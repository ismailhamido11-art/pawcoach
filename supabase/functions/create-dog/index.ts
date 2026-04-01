import { corsHeaders } from '../_shared/cors.ts'
import { requireAuth } from '../_shared/auth.ts'
import { createServiceClient, createUserClient } from '../_shared/supabase-client.ts'

const FREE_DOG_LIMIT = 1
const PREMIUM_DOG_LIMIT = 3

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const user = await requireAuth(req)

    const dogData = await req.json()

    const serviceClient = createServiceClient()

    // Fetch profile pour la détection premium
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('is_premium, trial_expires_at')
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
    const limit = isPremium ? PREMIUM_DOG_LIMIT : FREE_DOG_LIMIT

    // Count existing dogs via service client (bypass RLS pour avoir le vrai compte)
    const { count, error: countError } = await serviceClient
      .from('dogs')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)

    if (countError) {
      throw new Error(`Failed to count dogs: ${countError.message}`)
    }

    const currentCount = count ?? 0
    if (currentCount >= limit) {
      return new Response(
        JSON.stringify({ error: 'dog_limit_reached', limit, current: currentCount }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Insert dog — force owner_id au user authentifié pour éviter le spoofing
    const { data: dog, error: insertError } = await serviceClient
      .from('dogs')
      .insert({
        ...dogData,
        owner_id: user.id,
      })
      .select()
      .single()

    if (insertError || !dog) {
      throw new Error(`Failed to insert dog: ${insertError?.message}`)
    }

    // Créer la streak initiale pour ce chien
    const { error: streakError } = await serviceClient
      .from('streaks')
      .insert({
        dog_id: dog.id,
        owner_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        grace_days_remaining: 1,
      })

    if (streakError) {
      // Non-bloquant — le chien est déjà créé
      console.error(`[create-dog] Failed to create streak for dog ${dog.id}:`, streakError.message)
    }

    return new Response(
      JSON.stringify({ dog }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[create-dog] error:', err)
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
