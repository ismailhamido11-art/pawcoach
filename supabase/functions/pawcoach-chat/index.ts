import { corsHeaders } from '../_shared/cors.ts'
import { requireAuth } from '../_shared/auth.ts'
import { consumeMessageCredit } from '../_shared/quota.ts'
import { invokeLLM } from '../_shared/openrouter.ts'
import { createServiceClient, createUserClient } from '../_shared/supabase-client.ts'
import { sanitize } from '../_shared/sanitize.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const user = await requireAuth(req)

    const { messages: rawMessages, dogId, imageUrl, mode = 'chat' } = await req.json()

    if (!dogId) {
      return new Response(
        JSON.stringify({ error: 'dogId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Input length validation
    const MAX_MSG_LENGTH = 2000
    if (Array.isArray(rawMessages)) {
      for (const m of rawMessages) {
        if (m?.role === 'user' && typeof m?.content === 'string' && m.content.length > MAX_MSG_LENGTH) {
          return new Response(
            JSON.stringify({ error: 'Message trop long. Maximum 2000 caractères.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
      }
    }

    // SSRF whitelist — Supabase storage + legacy S3
    if (imageUrl) {
      try {
        const parsed = new URL(imageUrl)
        const allowedHosts = ['supabase.co', 'supabase.in', 'amazonaws.com', 's3.amazonaws.com']
        if (!allowedHosts.some((h) => parsed.hostname.endsWith(h))) {
          return new Response(
            JSON.stringify({ error: 'Invalid image URL' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid image URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    const serviceClient = createServiceClient()
    const userClient = createUserClient(authHeader)

    // Fetch profile: premium detection + coach preferences + messages_remaining snapshot
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('is_premium, trial_expires_at, messages_remaining, messages_daily_reset, coach_tone, coach_topics')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const isPremium =
      profile.is_premium ||
      (profile.trial_expires_at && new Date(profile.trial_expires_at) > new Date())

    // Atomic quota check + decrement (throws 429 if exceeded)
    await consumeMessageCredit(authHeader)

    // Compute messages_remaining to return (approximate — based on pre-call snapshot)
    // For premium: null (unlimited). For free: snapshot - 1, handling daily reset case.
    let messagesRemainingResponse: number | null = null
    if (!isPremium) {
      const today = new Date().toISOString().split('T')[0]
      const willReset = profile.messages_daily_reset !== today
      const snapshotRemaining = willReset
        ? 10
        : (profile.messages_remaining ?? 10)
      messagesRemainingResponse = Math.max(0, snapshotRemaining - 1)
    }

    // Filter and sanitize messages for LLM call
    const messages = (rawMessages || [])
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map((m: any) => ({
        role: m.role,
        content: String(m.content || '').substring(0, 2000),
      }))

    // Fetch dog via user client (RLS enforces ownership)
    const { data: dog, error: dogError } = await userClient
      .from('dogs')
      .select('*')
      .eq('id', dogId)
      .single()

    if (dogError || !dog) {
      return new Response(
        JSON.stringify({ error: 'Dog not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ═══════════════════════════════════════════════════════════
    // DOG BRAIN — Fetch ALL relevant data in parallel
    // SEC-03: caps applied per entity
    // ═══════════════════════════════════════════════════════════
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [
      checkinsResult,
      healthRecordsResult,
      foodScansResult,
      streakResult,
      weeklyInsightsResult,
      dailyLogsResult,
      userProgressResult,
      dietPrefsResult,
      nutritionPlansResult,
      diagnosisReportsResult,
      growthEntriesResult,
      bookmarksResult,
      recentChatResult,
    ] = await Promise.all([
      serviceClient
        .from('daily_checkins')
        .select('date,mood,energy,appetite,symptoms,notes,behavior_notes')
        .eq('dog_id', dogId)
        .gte('date', ninetyDaysAgo)
        .order('date', { ascending: false })
        .limit(90)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('health_records')
        .select('type,title,date,next_date,value,details')
        .eq('dog_id', dogId)
        .order('date', { ascending: false })
        .limit(20)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('food_scans')
        .select('food_name,verdict,score,timestamp,created_at')
        .eq('dog_id', dogId)
        .order('created_at', { ascending: false })
        .limit(30)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('streaks')
        .select('current_streak,longest_streak,last_activity_date')
        .eq('dog_id', dogId)
        .order('last_activity_date', { ascending: false })
        .limit(1)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('weekly_insights')
        .select('week_start,summary')
        .eq('dog_id', dogId)
        .order('week_start', { ascending: false })
        .limit(4)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('daily_logs')
        .select('date,walk_minutes,walk_distance_km,walk_mood,walk_tags,notes,water_bowls')
        .eq('dog_id', dogId)
        .gte('date', sixtyDaysAgo)
        .order('date', { ascending: false })
        .limit(60)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('user_progress')
        .select('exercise_id,completed')
        .eq('dog_id', dogId)
        .eq('completed', true)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('diet_preferences')
        .select('preferred_brands,disliked_foods,meal_times,portions_per_day,budget_monthly,organic_preference,notes')
        .eq('dog_id', dogId)
        .limit(1)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('nutrition_plans')
        .select('plan_text,is_active,notes,generated_at')
        .eq('dog_id', dogId)
        .order('generated_at', { ascending: false })
        .limit(5)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('diagnosis_reports')
        .select('symptoms,urgency_level,created_at')
        .eq('dog_id', dogId)
        .order('created_at', { ascending: false })
        .limit(3)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('growth_entries')
        .select('height_cm,body_condition_score,weight_kg,created_at')
        .eq('dog_id', dogId)
        .order('created_at', { ascending: false })
        .limit(1)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('bookmarks')
        .select('source,title,content,completed_days,updated_at')
        .eq('dog_id', dogId)
        .order('updated_at', { ascending: false })
        .limit(10)
        .catch(() => ({ data: [] })),

      serviceClient
        .from('chat_messages')
        .select('role,content,timestamp')
        .eq('dog_id', dogId)
        .order('timestamp', { ascending: false })
        .limit(20)
        .catch(() => ({ data: [] })),
    ])

    const checkins = (checkinsResult as any).data ?? []
    const healthRecords = (healthRecordsResult as any).data ?? []
    const foodScans = (foodScansResult as any).data ?? []
    const streak = ((streakResult as any).data ?? [])[0] ?? null
    const weeklyInsights = (weeklyInsightsResult as any).data ?? []
    const dailyLogs = (dailyLogsResult as any).data ?? []
    const userProgress = (userProgressResult as any).data ?? []
    const dietPref = ((dietPrefsResult as any).data ?? [])[0] ?? null
    const nutritionPlans = (nutritionPlansResult as any).data ?? []
    const diagnosisReports = (diagnosisReportsResult as any).data ?? []
    const latestGrowth = ((growthEntriesResult as any).data ?? [])[0] ?? null
    const bookmarks = (bookmarksResult as any).data ?? []
    const recentChats = ((recentChatResult as any).data ?? []).reverse()

    // ═══════════════════════════════════════════════════════════
    // Build DOG MEMORY — smart summaries of all data
    // ═══════════════════════════════════════════════════════════
    const today = new Date()
    const daysAgo = (dateStr: string | null | undefined): number => {
      if (!dateStr) return 999
      const d = new Date(dateStr)
      return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    }
    const formatDateFr = (dateStr: string | null | undefined): string => {
      if (!dateStr) return ''
      const d = daysAgo(dateStr)
      if (d === 0) return "aujourd'hui"
      if (d === 1) return 'hier'
      if (d < 7) return `il y a ${d} jours`
      if (d < 30) return `il y a ${Math.floor(d / 7)} semaine(s)`
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    }

    // Mood/energy/appetite integer → French label (Supabase schema: smallint 1-N)
    const moodLabel = (v: number): string =>
      ({ 1: 'très mauvais', 2: 'mauvais', 3: 'bon', 4: 'excellent' }[v] ?? String(v))
    const energyLabel = (v: number): string =>
      ({ 1: 'basse', 2: 'moyenne', 3: 'haute' }[v] ?? String(v))
    const appetiteLabel = (v: number): string =>
      ({ 1: 'diminué', 2: 'normal', 3: 'augmenté' }[v] ?? String(v))

    // --- Well-being trends (last 7 days) ---
    let wellbeingMemory = ''
    const recentCheckins = checkins.filter((c: any) => daysAgo(c.date) <= 7)
    if (recentCheckins.length > 0) {
      const moods = recentCheckins.map((c: any) => moodLabel(c.mood)).filter(Boolean)
      const energies = recentCheckins.map((c: any) => energyLabel(c.energy)).filter(Boolean)
      const appetites = recentCheckins.map((c: any) => appetiteLabel(c.appetite)).filter(Boolean)
      const latestNote = recentCheckins.find((c: any) => c.notes)?.notes
      wellbeingMemory = `\nBIEN-ETRE (7 derniers jours, ${recentCheckins.length} check-ins) :`
      wellbeingMemory += `\n- Humeurs : ${moods.join(', ')}`
      wellbeingMemory += `\n- Energie : ${energies.join(', ')}`
      wellbeingMemory += `\n- Appetit : ${appetites.join(', ')}`
      if (latestNote) wellbeingMemory += `\n- Dernière note : "${sanitize(latestNote, 200)}"`
      const latestBehaviorNote = recentCheckins.find((c: any) => c.behavior_notes)?.behavior_notes
      if (latestBehaviorNote) wellbeingMemory += `\n- Observation comportement : "${sanitize(latestBehaviorNote, 200)}"`
      const symptomCounts: Record<string, number> = {}
      recentCheckins
        .filter((c: any) => Array.isArray(c.symptoms) && c.symptoms.length > 0)
        .forEach((c: any) => (c.symptoms as string[]).forEach((s) => { symptomCounts[s] = (symptomCounts[s] || 0) + 1 }))
      if (Object.keys(symptomCounts).length > 0) {
        wellbeingMemory += `\n- Symptômes signalés : ${Object.entries(symptomCounts).map(([s, n]) => `${s} (${n}x)`).join(', ')}`
      }
    }

    // --- Health records ---
    let healthMemory = ''
    const recentVaccines = healthRecords.filter((r: any) => r.type === 'vaccine').slice(0, 5)
    const recentVetVisits = healthRecords.filter((r: any) => r.type === 'vet_visit').slice(0, 3)
    const weightRecords = healthRecords.filter((r: any) => r.type === 'weight').slice(0, 5)
    const upcomingRecords = healthRecords.filter(
      (r: any) => r.next_date && daysAgo(r.next_date) < 0 && daysAgo(r.next_date) > -60,
    )
    const activeMeds = healthRecords
      .filter((r: any) => r.type === 'medication' && daysAgo(r.date) <= 90)
      .slice(0, 5)

    if (recentVaccines.length > 0 || recentVetVisits.length > 0 || weightRecords.length > 0 || upcomingRecords.length > 0) {
      healthMemory = '\nSANTE :'
      if (recentVaccines.length > 0) {
        healthMemory += `\n- Vaccins : ${recentVaccines.map((v: any) => `${v.title} (${formatDateFr(v.date)}${v.next_date ? `, prochain : ${formatDateFr(v.next_date)}` : ''})`).join(', ')}`
      }
      if (recentVetVisits.length > 0) {
        healthMemory += `\n- Visites véto : ${recentVetVisits.map((v: any) => `${v.title || 'visite'} ${formatDateFr(v.date)}${v.details ? ` — ${String(v.details).substring(0, 80)}` : ''}`).join('; ')}`
      }
      if (weightRecords.length >= 2) {
        const latestVal = parseFloat(weightRecords[0].value)
        const previousVal = parseFloat(weightRecords[1].value)
        if (!isNaN(latestVal) && !isNaN(previousVal)) {
          const diff = (latestVal - previousVal).toFixed(1)
          healthMemory += `\n- Poids : ${latestVal} kg (${Number(diff) > 0 ? '+' : ''}${diff} kg depuis ${formatDateFr(weightRecords[1].date)})`
        } else if (!isNaN(latestVal)) {
          healthMemory += `\n- Dernier poids enregistré : ${latestVal} kg (${formatDateFr(weightRecords[0].date)})`
        }
      } else if (weightRecords.length === 1) {
        const val = parseFloat(weightRecords[0].value)
        if (!isNaN(val)) healthMemory += `\n- Dernier poids enregistré : ${val} kg (${formatDateFr(weightRecords[0].date)})`
      }
      if (upcomingRecords.length > 0) {
        healthMemory += `\n- A VENIR : ${upcomingRecords.map((r: any) => `${r.title} le ${new Date(r.next_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`).join(', ')}`
      }
      if (activeMeds.length > 0) {
        healthMemory += `\n- Médicaments : ${activeMeds.map((m: any) => `${m.title}${m.details ? ` (${String(m.details).substring(0, 60)})` : ''} ${formatDateFr(m.date)}`).join(', ')}`
      }
    }

    // --- Food scans ---
    let nutritionMemory = ''
    const recentScans = foodScans.slice(0, 5)
    if (recentScans.length > 0) {
      const verdictFr = (v: string) => v === 'safe' ? 'sûr' : v === 'caution' ? 'à surveiller' : 'TOXIQUE'
      nutritionMemory = '\nNUTRITION :'
      const latestScanDays = daysAgo(recentScans[0].timestamp || recentScans[0].created_at)
      const scanLabel = latestScanDays <= 7 ? 'cette semaine' : latestScanDays <= 30 ? 'ce mois' : `il y a ${Math.floor(latestScanDays / 30)} mois`
      nutritionMemory += `\n- Aliments scannés (${scanLabel}) : ${recentScans.map((s: any) => `${s.food_name} (${verdictFr(s.verdict)}, ${s.score}/10)`).join(', ')}`
    }
    if (dietPref) {
      const prefParts: string[] = []
      const brands = Array.isArray(dietPref.preferred_brands) ? dietPref.preferred_brands : []
      if (brands.length > 0) prefParts.push(`marques préférées: ${brands.join(', ')}`)
      if (dietPref.disliked_foods) prefParts.push(`aliments refusés: ${dietPref.disliked_foods}`)
      const budgetLabels: Record<string, string> = { low: 'économique (<30EUR)', medium: 'standard (30-70EUR)', high: 'premium (>70EUR)' }
      if (dietPref.budget_monthly) prefParts.push(`budget: ${budgetLabels[dietPref.budget_monthly] || dietPref.budget_monthly}`)
      if (dietPref.organic_preference) prefParts.push('préférence bio/naturel')
      const times = dietPref.meal_times ?? {}
      const timeParts: string[] = []
      if (times.morning) timeParts.push(`matin ${times.morning}`)
      if (times.noon) timeParts.push(`midi ${times.noon}`)
      if (times.evening) timeParts.push(`soir ${times.evening}`)
      if (timeParts.length > 0) prefParts.push(`horaires: ${timeParts.join(', ')}`)
      if (dietPref.portions_per_day) prefParts.push(`${dietPref.portions_per_day} repas/jour`)
      if (dietPref.notes) prefParts.push(`notes proprio: ${sanitize(dietPref.notes, 100)}`)
      if (prefParts.length > 0) {
        nutritionMemory += `\n- Préférences alimentaires : ${prefParts.join(', ')}`
      }
    }

    // --- Activity ---
    let activityMemory = ''
    const recentLogs = dailyLogs.filter((l: any) => daysAgo(l.date) <= 7)
    if (recentLogs.length > 0) {
      const totalMinutes = recentLogs.reduce((sum: number, l: any) => sum + (l.walk_minutes || 0), 0)
      const totalDistance = recentLogs.reduce((sum: number, l: any) => sum + (l.walk_distance_km || 0), 0)
      activityMemory = '\nACTIVITE (7 derniers jours) :'
      activityMemory += `\n- ${recentLogs.length} jour(s) de balade, ${totalMinutes} min au total${totalDistance ? `, ${Number(totalDistance).toFixed(1)} km` : ''}`
      activityMemory += `\n- Moyenne : ${Math.round(totalMinutes / recentLogs.length)} min/jour`
      const moodCounts: Record<string, number> = {}
      recentLogs.forEach((l: any) => { if (l.walk_mood) moodCounts[l.walk_mood] = (moodCounts[l.walk_mood] || 0) + 1 })
      if (Object.keys(moodCounts).length > 0) {
        activityMemory += `\n- Humeur post-balade : ${Object.entries(moodCounts).map(([m, n]) => `${m} (${n}x)`).join(', ')}`
      }
      const tagCounts: Record<string, number> = {}
      recentLogs.forEach((l: any) => {
        const tags = Array.isArray(l.walk_tags) ? l.walk_tags : []
        tags.forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1 })
      })
      if (Object.keys(tagCounts).length > 0) {
        activityMemory += `\n- Comportements en balade : ${Object.entries(tagCounts).map(([t, n]) => `${t} (${n}x)`).join(', ')}`
      }
      const recentNotes = recentLogs.filter((l: any) => l.notes).slice(0, 5).map((l: any) => l.notes)
      if (recentNotes.length > 0) {
        activityMemory += `\n- Notes de balade : ${recentNotes.join(' | ').substring(0, 300)}`
      }
      const waterLogs = recentLogs.filter((l: any) => l.water_bowls && l.water_bowls > 0)
      if (waterLogs.length > 0) {
        const avgWater = (waterLogs.reduce((sum: number, l: any) => sum + l.water_bowls, 0) / waterLogs.length).toFixed(1)
        activityMemory += `\n- Hydratation : ${avgWater} bol(s)/jour en moyenne (${waterLogs.length} jour(s) renseignés)`
      }
    }

    // --- Streak ---
    let streakMemory = ''
    if (streak && (streak.current_streak || 0) > 0) {
      streakMemory = '\nENGAGEMENT :'
      streakMemory += `\n- Streak actuel : ${streak.current_streak} jour(s) consécutif(s)`
      if (streak.longest_streak) streakMemory += ` (record : ${streak.longest_streak})`
    }

    // --- Training progress ---
    let trainingMemory = ''
    const completedExercises = userProgress.filter((p: any) => p.completed)
    if (completedExercises.length > 0) {
      trainingMemory = '\nDRESSAGE :'
      trainingMemory += `\n- ${completedExercises.length} exercice(s) terminé(s)`
      const exerciseNames = completedExercises.slice(0, 10).map((p: any) => p.exercise_id).filter(Boolean)
      if (exerciseNames.length > 0) {
        trainingMemory += ` : ${exerciseNames.join(', ')}${completedExercises.length > 10 ? ` (+${completedExercises.length - 10} autres)` : ''}`
      }
    }

    // --- Latest weekly insight ---
    let insightMemory = ''
    const latestInsight = weeklyInsights.find((i: any) => i.summary && daysAgo(i.week_start) <= 60)
    if (latestInsight?.summary) {
      const summary = latestInsight.summary.substring(0, 200)
      insightMemory = `\nDERNIER BILAN HEBDO : ${summary}${latestInsight.summary.length > 200 ? '...' : ''}`
    }

    // --- Recent pre-consultations ---
    let diagnosticMemory = ''
    if (diagnosisReports.length > 0) {
      diagnosticMemory = '\nPRE-CONSULTATIONS RECENTES :'
      diagnosisReports
        .filter((d: any) => daysAgo(d.created_at) <= 180)
        .forEach((d: any) => {
          const urgencyFr: Record<string, string> = { low: 'faible', medium: 'modéré', high: 'élevé', emergency: 'URGENCE' }
          diagnosticMemory += `\n- ${formatDateFr(d.created_at)} : symptômes "${String(d.symptoms || '').substring(0, 100)}"`
          if (d.urgency_level) diagnosticMemory += ` (urgence : ${urgencyFr[d.urgency_level] || d.urgency_level})`
        })
    }

    // --- Growth ---
    let growthMemory = ''
    if (latestGrowth) {
      growthMemory = '\nCROISSANCE :'
      if (latestGrowth.height_cm) growthMemory += `\n- Taille : ${latestGrowth.height_cm} cm (${formatDateFr(latestGrowth.created_at)})`
      if (latestGrowth.body_condition_score) growthMemory += `\n- Score corporel (BCS) : ${latestGrowth.body_condition_score}/9`
      if (latestGrowth.weight_kg) growthMemory += `\n- Dernier poids mesuré : ${latestGrowth.weight_kg} kg`
    }

    // --- Active programs ---
    let programMemory = ''
    const activePrograms = bookmarks.filter(
      (b: any) =>
        (b.source === 'fitness_program' || b.source === 'behavior_program') &&
        b.content &&
        daysAgo(b.updated_at) <= 30,
    )
    if (activePrograms.length > 0) {
      programMemory = '\nPROGRAMMES ACTIFS :'
      activePrograms.slice(0, 2).forEach((b: any) => {
        try {
          const content = typeof b.content === 'string' ? JSON.parse(b.content) : b.content
          const type = b.source === 'fitness_program' ? 'Forme' : 'Comportement'
          const completed = b.completed_days
            ? (Array.isArray(b.completed_days) ? b.completed_days.filter(Boolean).length : 0)
            : 0
          programMemory += `\n- Programme ${type} : ${content.title || 'Sans titre'} (${completed}/7 jours complétés)`
          if (content.bilan) programMemory += ` — bilan feeling: ${content.bilan.feeling}/5`
        } catch {
          // skip malformed content
        }
      })
    }

    // --- Active nutrition plan ---
    let nutritionPlanMemory = ''
    const activePlan = nutritionPlans.find((p: any) => p.is_active)
    if (activePlan) {
      try {
        const planData = typeof activePlan.plan_text === 'string'
          ? JSON.parse(activePlan.plan_text)
          : activePlan.plan_text
        if (planData?.days && Array.isArray(planData.days)) {
          const startDate = planData.start_date
          const elapsed = startDate
            ? Math.floor((today.getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000)
            : null
          const dayNumber = elapsed !== null && elapsed >= 0 ? Math.min(elapsed + 1, 7) : null
          const isExpired = elapsed !== null && elapsed >= 7
          nutritionPlanMemory = '\nPLAN REPAS ACTIF :'
          nutritionPlanMemory += `\n- ${planData.calories_per_day || '?'} kcal/jour, ${planData.quantity_summary || ''}`
          if (isExpired) {
            nutritionPlanMemory += `\n- EXPIRÉ (généré il y a ${elapsed} jours) — suggérer d'en générer un nouveau`
          } else if (dayNumber) {
            nutritionPlanMemory += `\n- Jour ${dayNumber}/7`
            const todayDay = planData.days[dayNumber - 1]
            if (todayDay) {
              nutritionPlanMemory += ` — Matin: ${todayDay.morning?.food || '?'}, Soir: ${todayDay.evening?.food || '?'}`
            }
          }
          if (planData.supplements?.length > 0) nutritionPlanMemory += `\n- Compléments: ${planData.supplements.join(', ')}`
          if (planData.avoid?.length > 0) nutritionPlanMemory += `\n- À éviter: ${planData.avoid.join(', ')}`
        }
      } catch {
        // skip malformed plan
      }
      if (activePlan.notes) {
        nutritionPlanMemory += `\n- Note du proprio: "${String(activePlan.notes).substring(0, 100)}"`
      }
    }

    // --- Behavior summary (long-term memory) ---
    let behaviorMemory = ''
    if (dog.behavior_summary) {
      behaviorMemory = `\nPROFIL COMPORTEMENTAL (mémoire longue durée) :\n${dog.behavior_summary}`
    }

    // --- Recent chat history (for context continuity) ---
    let chatHistoryMemory = ''
    if (recentChats.length > 0) {
      chatHistoryMemory = '\nDERNIERES CONVERSATIONS (résumé) :'
      recentChats.slice(-5).forEach((m: any) => {
        const roleLabel = m.role === 'user' ? 'Proprio' : 'PawCoach'
        chatHistoryMemory += `\n[${roleLabel}] ${String(m.content || '').substring(0, 150)}`
      })
    }

    // Assemble full DOG MEMORY
    const dogMemory = [
      wellbeingMemory,
      healthMemory,
      nutritionMemory,
      nutritionPlanMemory,
      activityMemory,
      streakMemory,
      trainingMemory,
      insightMemory,
      diagnosticMemory,
      growthMemory,
      programMemory,
      behaviorMemory,
      chatHistoryMemory,
    ]
      .filter((s) => s.length > 0)
      .join('\n')

    // ═══════════════════════════════════════════════════════════
    // Build personalization context
    // ═══════════════════════════════════════════════════════════
    const toneInstructions: Record<string, string> = {
      encouraging: 'Ton chaleureux et encourageant. Félicite les efforts, valorise les progrès.',
      direct: "Ton direct et concis. L'essentiel d'abord, pas de fioritures.",
      pedagogical: "Ton pédagogique. Explique le 'pourquoi' derrière chaque conseil.",
    }
    const toneInstruction = profile.coach_tone ? (toneInstructions[profile.coach_tone] || '') : ''

    const topicLabels: Record<string, string> = { health: 'santé', nutrition: 'nutrition', training: 'dressage', behavior: 'comportement' }
    let topicsInstruction = ''
    const topics = Array.isArray(profile.coach_topics) ? profile.coach_topics : []
    if (topics.length > 0) {
      topicsInstruction = `Le propriétaire s'intéresse particulièrement à : ${topics.map((t: string) => topicLabels[t] || t).join(', ')}.`
    }

    let personalityContext = ''
    const personalityTags = Array.isArray(dog.personality_tags) ? dog.personality_tags : []
    if (personalityTags.length > 0) {
      personalityContext = `Personnalité : ${personalityTags.join(', ')}.`
    }

    const statusMessages: Record<string, string> = {
      recovering: "ATTENTION : ce chien est en convalescence. Pas d'exercices intenses. Priorité repos et alimentation douce.",
      traveling: 'Ce chien est en déplacement. Prendre en compte le stress, changements de routine, précautions sanitaires.',
    }
    const statusContext = dog.status && dog.status !== 'healthy' ? (statusMessages[dog.status] || '') : ''

    // getAge v1 — sync avec weeklyInsightGenerate — NE PAS modifier sans mettre à jour les deux
    const getAge = (birthDate: string | null): string | null => {
      if (!birthDate) return null
      const months = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
      if (months < 1) return "moins d'un mois"
      if (months < 12) return `${months} mois`
      const years = Math.floor(months / 12)
      const rem = months % 12
      return rem > 0 ? `${years} an${years > 1 ? 's' : ''} et ${rem} mois` : `${years} an${years > 1 ? 's' : ''}`
    }
    const ageStr = getAge(dog.birth_date)

    // ═══════════════════════════════════════════════════════════
    // Build SYSTEM PROMPT
    // ═══════════════════════════════════════════════════════════
    const safeDogName = sanitize(dog.name, 50)
    const safeDogBreed = sanitize(dog.breed, 50)

    const dogProfile = [
      `- Nom : ${safeDogName}`,
      `- Race : ${safeDogBreed || 'Non renseignée'}`,
      ageStr ? `- Âge : ${ageStr}` : null,
      dog.weight ? `- Poids : ${dog.weight} kg` : null,
      dog.sex ? `- Sexe : ${dog.sex === 'male' ? 'Mâle' : 'Femelle'}` : null,
      dog.neutered !== undefined ? `- Stérilisé : ${dog.neutered ? 'Oui' : 'Non'}` : null,
      dog.activity_level ? `- Niveau d'activité : ${dog.activity_level}` : null,
      dog.environment ? `- Environnement : ${dog.environment}` : null,
      dog.allergies ? `- Allergies : ${sanitize(dog.allergies, 200)}` : null,
      dog.health_issues ? `- Problèmes de santé : ${dog.health_issues}` : null,
      dog.vet_name ? `- Vétérinaire : ${dog.vet_name}${dog.vet_city ? ` (${dog.vet_city})` : ''}` : null,
      personalityContext ? `- ${personalityContext}` : null,
      statusContext ? `- ${statusContext}` : null,
      dog.owner_goal ? `- Objectif du propriétaire : ${sanitize(dog.owner_goal, 150)}` : null,
      dog.diet_type ? `- Alimentation : ${dog.diet_type}${dog.diet_brand ? ` (${dog.diet_brand})` : ''}` : null,
      dog.diet_restrictions ? `- Restrictions alimentaires : ${dog.diet_restrictions}` : null,
      dog.next_vet_appointment ? `- Prochain RDV vétérinaire : ${formatDateFr(dog.next_vet_appointment)}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    const todayFr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const roleIntro = mode === 'nutrition'
      ? `Tu es NutriCoach, le coach nutrition canin expert de PawCoach. Tu donnes des conseils nutritionnels personnalisés et recommandes des aliments adaptés.`
      : `Tu es PawCoach, le coach bien-être canin intelligent. Tu es l'expert personnel de ${safeDogName} — tu connais son historique, sa santé, son alimentation, son activité et son caractère.`

    const systemPrompt = `${roleIntro}

DATE : ${todayFr}

PROFIL DU CHIEN :
${dogProfile}
${dogMemory ? `\n═══ MÉMOIRE DE ${safeDogName.toUpperCase()} ═══${dogMemory}` : ''}

INTERPRÉTATION DES DONNÉES — RÈGLE CRITIQUE :
- Si une section de mémoire est ABSENTE, le propriétaire n'a pas encore utilisé cette fonctionnalité. Ne fais AUCUNE supposition négative.
- "Pas de check-in" ≠ "le chien va mal". Le proprio n'a simplement pas rempli.
- "Pas de données hydratation" ≠ "le chien ne boit pas". Le suivi eau est rarement rempli.
- "Pas de balade enregistrée" ≠ "le chien ne sort pas". Le proprio n'a pas utilisé le GPS.
- "Pas de scan alimentaire" ≠ "mauvaise alimentation". Le proprio n'a pas encore scanné.
- Quand tu as des données, base tes réponses dessus. Quand il n'y en a pas, NE COMBLE PAS le vide par des suppositions — propose plutôt de commencer à tracker ("Tu veux qu'on suive X ensemble ?").
- FRAÎCHEUR : les données des 7 derniers jours sont les plus fiables. Au-delà, contextualise avec la date.
- TENDANCES : ne signale une tendance que si tu as au moins 3 points de données. Un seul point n'est pas une tendance.
${dog.owner_goal ? `\nOBJECTIF PRINCIPAL : "${sanitize(dog.owner_goal, 150)}" — Oriente naturellement tes conseils vers cet objectif. Ne répète pas l'objectif mot pour mot à chaque message, mais garde-le en tête.` : ''}

COMMENT TE COMPORTER :
- Tu CONNAIS ${safeDogName} personnellement. Réfère-toi à son historique naturellement dans tes réponses.
- Si tu vois des tendances dans les données (baisse d'énergie, perte de poids, appétit en baisse), mentionne-les proactivement.
- Fais des connexions entre les domaines : nutrition + santé + activité + comportement = une seule vision holistique.
- Si un vaccin ou RDV approche, mentionne-le naturellement.
- Utilise le prénom de ${safeDogName}, tutoie le propriétaire.
- Réponds en français, sois chaleureux et concis (2-3 paragraphes max).
- Ne pose JAMAIS de diagnostic médical.
- ÉCHELLE DE SÉVÉRITÉ (OBLIGATOIRE) :
  * NIVEAU 1 (symptôme isolé, léger, <24h) : Rassure. "Surveille les 24h". NE PAS mentionner le véto.
  * NIVEAU 2 (persiste 2-3j OU 2 symptômes légers) : "Si ça persiste, un check-up serait bien".
  * NIVEAU 3 (symptômes multiples, >3j, combinaison suspecte) : "Un avis vétérinaire serait recommandé".
  * NIVEAU 4 (urgence grave : convulsions, saignement, toxique, paralysie) : "Contacte les urgences vétérinaires".
  NE PROPOSE JAMAIS le véto pour un symptôme isolé de moins de 24h. C'est disproportionné et anxiogène.
- Quand tu ne sais pas, dis-le honnêtement.
${mode === 'nutrition' ? `- Quand tu recommandes des marques, mentionne "Disponible sur Amazon/Zooplus".\n- Utilise des emojis alimentaires.` : `- Utilise des emojis avec parcimonie.`}
${toneInstruction ? `\nTON : ${toneInstruction}` : ''}
${topicsInstruction ? `\nPRIORITÉS : ${topicsInstruction}` : ''}`

    // ═══════════════════════════════════════════════════════════
    // LLM call
    // ═══════════════════════════════════════════════════════════
    let responseContent: string

    if (imageUrl) {
      // Vision call with GPT-4o
      const lastUserMessage = messages[messages.length - 1]
      const visionMessages = messages.slice(0, -1)
      visionMessages.push({
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          {
            type: 'text',
            text: (lastUserMessage?.content || 'Analyse cette image de mon chien.') +
              "\n\nNote: Décris ce que tu observes. Ne diagnostique jamais. Si tu vois des symptômes inquiétants, recommande de consulter un vétérinaire.",
          },
        ],
      })
      responseContent = await invokeLLM({
        model: 'openai/gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...visionMessages],
        temperature: 0.7,
      })
    } else {
      responseContent = await invokeLLM({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.7,
      })
    }

    // ═══════════════════════════════════════════════════════════
    // Save user + assistant messages to chat_messages
    // ═══════════════════════════════════════════════════════════
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
    if (lastUserMsg) {
      const messagesToSave = [
        {
          dog_id: dogId,
          owner_id: user.id,
          role: 'user',
          content: lastUserMsg.content,
          has_image: !!imageUrl,
          image_url: imageUrl ?? null,
          timestamp: new Date().toISOString(),
        },
        {
          dog_id: dogId,
          owner_id: user.id,
          role: 'assistant',
          content: responseContent,
          has_image: false,
          image_url: null,
          timestamp: new Date().toISOString(),
        },
      ]

      // Non-blocking save — do not fail the response if save fails
      serviceClient
        .from('chat_messages')
        .insert(messagesToSave)
        .then(({ error }) => {
          if (error) console.error('[pawcoach-chat] Failed to save messages:', error.message)
        })
    }

    return new Response(
      JSON.stringify({ response: responseContent, messages_remaining: messagesRemainingResponse }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[pawcoach-chat] error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
