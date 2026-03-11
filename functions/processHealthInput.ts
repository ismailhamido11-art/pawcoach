import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, text, imageUrl, dogId } = await req.json();

    if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });

    // Sanitize user inputs to prevent prompt injection and limit length
    const sanitize = (s, max = 2000) => String(s || '').substring(0, max).replace(/[<>]/g, '');

    // Fetch dog info and health records for context
    let dogName = "ton chien";
    let ownerName = "toi";
    let dogDetails = "";
    let historyContext = "";
    let missingInfos = [];
    
    
    if (dogId) {
      try {
        // Use get() for direct ID lookup
        let dog = null;
        try {
          dog = await base44.entities.Dog.get(dogId);
        } catch (e) {
          console.warn(`[WARN] Dog.get(${dogId}) failed, trying filter...`);
          const dogs = await base44.entities.Dog.filter({ id: dogId });
          if (dogs && dogs.length > 0) dog = dogs[0];
        }

        if (!dog || dog.owner !== user.email) {
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
        dogName = dog.name || "ton chien";
        if (dog.breed) dogDetails += dog.breed;
        if (dog.weight) dogDetails += ` (${dog.weight}kg)`;
        if (dog.birth_date) {
          const birthDate = new Date(dog.birth_date);
          if (!isNaN(birthDate.getTime()) && birthDate.getTime() < Date.now()) {
            const months = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
            dogDetails += months < 12 ? `, ${months} mois` : `, ${Math.floor(months / 12)} an(s)`;
          }
        }
        if (dog.sex) dogDetails += `, ${dog.sex === "male" ? "male" : "femelle"}`;
        if (dog.neutered) dogDetails += `, sterilise: ${dog.neutered === true || dog.neutered === "yes" ? "oui" : "non"}`;
        if (dog.allergies) dogDetails += `, allergies: ${String(dog.allergies).substring(0, 200)}`;
        if (dog.health_issues) dogDetails += `, problemes: ${String(dog.health_issues).substring(0, 200)}`;
        if (dog.owner_goal) dogDetails += `, objectif proprietaire: ${String(dog.owner_goal).substring(0, 150)}`;
        if (dog.diet_type) dogDetails += `, alimentation: ${dog.diet_type}`;
        if (dog.diet_restrictions) dogDetails += `, restrictions alimentaires: ${String(dog.diet_restrictions).substring(0, 200)}`;
        if (dog.diet_brand) dogDetails += `, marque actuelle: ${String(dog.diet_brand).substring(0, 100)}`;
        if (dog.activity_level) dogDetails += `, niveau activite: ${dog.activity_level}`;
        if (dog.environment) dogDetails += `, environnement: ${dog.environment}`;

        // Fetch all relevant data in parallel
        const [records, checkins, foodScans, dailyLogs, streaks] = await Promise.all([
          base44.entities.HealthRecord.filter({ dog_id: dogId }, "-date", 20).catch(() => []),
          base44.asServiceRole.entities.DailyCheckin.filter({ dog_id: dogId }).catch(() => []),
          base44.asServiceRole.entities.FoodScan.filter({ dog_id: dogId }).catch(() => []),
          base44.asServiceRole.entities.DailyLog.filter({ dog_id: dogId }).catch(() => []),
          base44.asServiceRole.entities.Streak.filter({ dog_id: dogId }).catch(() => []),
        ]);

        // Analyze missing info
        if (records) {
           const lastWeight = records.find(r => r.type === 'weight');
           const lastVaccine = records.find(r => r.type === 'vaccine');
           const lastVet = records.find(r => r.type === 'vet_visit');

           if (!lastWeight) missingInfos.push("poids (jamais fait)");
           else {
              const d = new Date(lastWeight.date);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - d.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays > 30) missingInfos.push(`poids (vieux de ${diffDays} jours)`);
           }
           if (!lastVaccine) missingInfos.push("vaccins (aucun)");
           if (!lastVet) missingInfos.push("visite veterinaire (aucune)");

           const summaryLines = records.map(r => {
            let line = `${r.date} [${r.type}]: ${r.title}`;
            if (r.value) line += ` (${r.value}kg)`;
            return line;
          });
          historyContext = "DONNEES EXISTANTES DU CARNET:\n" + summaryLines.slice(0, 8).join("\n");
        }

        // Build well-being context from DailyCheckins (last 7 days)
        const now = new Date();
        const recentCheckins = (checkins || [])
          .filter(c => c.date && (now.getTime() - new Date(c.date).getTime()) < 7 * 24 * 60 * 60 * 1000)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (recentCheckins.length > 0) {
          const moodMap = { great: "excellent", good: "bon", neutral: "neutre", bad: "mauvais", terrible: "tres mauvais" };
          const energyMap = { high: "haute", medium: "moyenne", low: "basse" };
          const appetiteMap = { normal: "normal", increased: "augmente", decreased: "diminue", none: "aucun" };
          historyContext += `\nBIEN-ETRE RECENT (${recentCheckins.length} check-ins, 7j) :`;
          historyContext += `\n- Humeurs : ${recentCheckins.map(c => moodMap[c.mood] || c.mood).filter(Boolean).join(", ")}`;
          historyContext += `\n- Energie : ${recentCheckins.map(c => energyMap[c.energy] || c.energy).filter(Boolean).join(", ")}`;
          historyContext += `\n- Appetit : ${recentCheckins.map(c => appetiteMap[c.appetite] || c.appetite).filter(Boolean).join(", ")}`;
          const latestNote = recentCheckins.find(c => c.notes)?.notes;
          if (latestNote) historyContext += `\n- Note : "${String(latestNote).substring(0, 200)}"`;
        }

        // Food scan context
        const recentScans = (foodScans || [])
          .sort((a, b) => new Date(b.timestamp || b.created_date).getTime() - new Date(a.timestamp || a.created_date).getTime())
          .slice(0, 3);
        if (recentScans.length > 0) {
          historyContext += `\nALIMENTS SCANNES : ${recentScans.map(s => `${s.food_name} (${s.verdict})`).join(", ")}`;
        }

        // Activity context
        const recentLogs = (dailyLogs || [])
          .filter(l => l.date && (now.getTime() - new Date(l.date).getTime()) < 7 * 24 * 60 * 60 * 1000);
        if (recentLogs.length > 0) {
          const totalMin = recentLogs.reduce((s, l) => s + (l.walk_minutes || 0), 0);
          historyContext += `\nACTIVITE (7j) : ${recentLogs.length} jour(s) de balade, ${totalMin} min total`;
        }

        // Streak
        const streak = (streaks || [])[0];
        if (streak?.current_streak) {
          historyContext += `\nSTREAK : ${streak.current_streak} jour(s)`;
        }
      } catch (e) {
        console.warn("[WARN] Error fetching history:", e?.message || String(e));
      }
    }

    // Get current user info
    if (user && user.full_name) {
      ownerName = user.full_name.split(" ")[0]; // First name
    }

    // Build prompt for LLM
    const todayFr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const systemPrompt = `Tu es l'ange gardien veterinaire de ${dogName}${dogDetails ? ` (${dogDetails})` : ''}. ${ownerName} compte sur toi.
Ton but : Rassurer, Guider, et Etre Efficace.
DATE : ${todayFr}

CONTEXTE COMPLET DE ${dogName.toUpperCase()} : ${historyContext || "Aucun historique."}
INFORMATIONS MANQUANTES : ${missingInfos.length > 0 ? missingInfos.join(", ") : "Tout est a jour !"}

INTELLIGENCE HOLISTIQUE :
- Tu as acces au bien-etre recent (humeur, energie, appetit), a l'activite physique, et aux aliments scannes.
- UTILISE CES DONNEES pour enrichir ton analyse. Ex: "Je vois que l'energie de ${dogName} est basse depuis 3 jours, combine avec cette perte d'appetit, ca merite attention."
- Fais des connexions entre les symptomes rapportes et les donnees objectives.
- ATTENTION : donnees absentes = fonctionnalite non utilisee, PAS un signal negatif. "Pas de check-in" ne signifie PAS que le chien va mal. Ne tire jamais de conclusion d'une absence de donnees.
- Si le chien a des restrictions alimentaires ou des allergies, prends-les en compte dans tes analyses (interactions medicamenteuses, regimes speciaux).

REGLES D'INTELLIGENCE EMOTIONNELLE :
- Sois chaleureux mais precis. Utilise des emojis rassurants.
- TON ROLE PREMIER : RASSURER. Un proprietaire inquiet ne veut pas entendre "appelle le veto" au moindre signe.
- Si le chien va mal : PAS DE BLABLA inutile. Pose 1 question pour cibler l'urgence, puis donne la conduite a tenir.
- Cree du lien : "Pauvre ${dogName}...", "Je comprends ton inquietude...".

ECHELLE DE SEVERITE (OBLIGATOIRE — ne saute JAMAIS un niveau) :
- NIVEAU 1 "Rien d'inquietant" : symptome isole, leger, depuis <24h (fatigue apres balade, appetit moyen 1 jour, leger eternuement).
  → Rassure : "C'est normal. Surveille les prochaines 24h. Si ca persiste, on en reparle."
  → show_vet_map: "none"
- NIVEAU 2 "A surveiller" : symptome qui persiste 2-3 jours OU 2 symptomes legers combines.
  → Conseille : "Si ca ne s'ameliore pas dans 2-3 jours, un check-up serait une bonne idee."
  → show_vet_map: "routine"
- NIVEAU 3 "Consultation conseillee" : symptomes multiples, persistants (>3j), ou combinaison suspecte (fatigue + perte appetit + perte poids).
  → Recommande : "Ces symptomes combines meritent un avis veterinaire dans les jours qui viennent."
  → show_vet_map: "important"
- NIVEAU 4 "Urgence" : symptomes graves (convulsions, saignement, paralysie, gonflement abdomen, ingestion toxique, difficulte respiratoire).
  → Urgence : "Contacte ton veterinaire ou les urgences rapidement."
  → show_vet_map: "urgent"

EXEMPLES CONCRETS :
- "Mon chien est fatigue aujourd'hui" → NIVEAU 1 (surtout si activite recente)
- "Mon chien ne mange plus depuis ce matin" → NIVEAU 1 (trop tot pour s'alarmer)
- "Mon chien vomit depuis 2 jours" → NIVEAU 2-3 selon frequence
- "Mon chien a mange du chocolat" → NIVEAU 3-4 selon quantite
- "Mon chien convulse" → NIVEAU 4

NE PROPOSE JAMAIS "appeler le veto" pour un symptome isole de <24h. C'est DISPROPORTIONNE et ANXIOGENE.

GÉRER LE LIEN VÉTÉRINAIRE :
Si tu recommandes d'aller chez le véto :
1. NE METS PAS de lien Google Maps dans ton texte.
2. Mets le champ JSON "show_vet_map" avec le niveau : "none", "routine", "important", ou "urgent".
3. Adapte ton message au niveau (voir echelle ci-dessus).

DÉROULEMENT DE LA CONVERSATION :
1. ANALYSE L'HISTORIQUE CI-DESSOUS AVEC ATTENTION.
2. Si c'est le tout début (aucun message précédent) :
   - D'abord, mentionne les informations manquantes s'il y en a (ex: "Je vois que le carnet de ${dogName} n'a pas encore de vaccins enregistrés, ni de poids récent...").
   - Puis propose le menu principal avec les suggested_actions: ["Urgence / Bobo 🤒", "Sortie de véto 🏥", "Mise à jour carnet 📝", "Conseil / Question ❓"].
   - Si le carnet est COMPLÈTEMENT VIDE (aucun HealthRecord), commence par : "Bienvenue ! Le carnet de ${dogName} est tout neuf. On va le remplir ensemble, c'est rapide et ça peut sauver des vies." Then propose: ["Enregistrer ses vaccins", "Ajouter son poids actuel", "Raconter sa dernière visite véto"].
3. Si l'utilisateur signale un problème (ex: "Il est malade", "Il boite") :
   - IGNORE le menu principal.
   - Commence immédiatement le triage.
   - Pose UNE seule question à la fois.
   - NE REPOSE JAMAIS une question dont la réponse est déjà dans l'historique (ex: si l'utilisateur a dit "ce matin", ne demande pas "depuis quand ?").
   - Si tu as assez d'éléments, donne ton conseil final et mets "is_finished": true.

IMPORTANT SUR LES SUGGESTIONS (suggested_actions) :
Ce sont des RÉPONSES que l'utilisateur peut donner à TA question.
Elles doivent être contextuelles et utiles.
Exemple pour "Il boite ?" -> ["Patte avant", "Patte arrière", "Je ne sais pas"]
Exemple pour "Depuis quand ?" -> ["Depuis ce matin", "Depuis 2-3 jours", "Depuis longtemps"]
NE METS JAMAIS "Réponse A" ou "Réponse rapide".

Retourne TOUJOURS du JSON valide :
{
  "next_question": "Ton message...",
  "records_to_save": [{ "type": "vaccine|vet_visit|weight|medication|allergy|note", "title": "...", "date": "YYYY-MM-DD", "next_date": "...", "value": number, "details": "..." }],
  "suggest_scan": false,
  "show_vet_map": "none",
  "suggested_actions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "is_finished": boolean
}`;

    // Collect user message content and history
    let conversationHistory = "";
    let fileUrls = [];

    if (messages && Array.isArray(messages)) {
      conversationHistory = messages.slice(-10).map(m => `[${m.role === 'user' ? 'UTILISATEUR' : 'ASSISTANT'}] ${sanitize(m.content)}`).join("\n");
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.image_url) fileUrls.push(lastMsg.image_url);
    } else if (text || imageUrl) {
      conversationHistory = `[UTILISATEUR] ${sanitize(text) || "Document à analyser"}`;
      if (imageUrl) fileUrls.push(imageUrl);
    }

    // Call Base44 native LLM
    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt + "\n\n--- HISTORIQUE DE LA CONVERSATION ---\n" + conversationHistory,
      response_json_schema: {
        type: "object",
        properties: {
          next_question: { type: "string" },
          show_vet_map: { type: "string", enum: ["none", "routine", "important", "urgent"] },
          records_to_save: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                title: { type: "string" },
                date: { type: "string" },
                next_date: { type: "string" },
                value: { type: "number" },
                details: { type: "string" }
              }
            }
          },
          suggest_scan: { type: "boolean" },
          suggested_actions: { 
            type: "array", 
            items: { type: "string" } 
          },
          is_finished: { type: "boolean" }
        }
      },
      file_urls: fileUrls.length > 0 ? fileUrls : undefined
    });

    // Parse the JSON response
    let parsedResult = llmResult;
    try {
      if (typeof llmResult === "string") {
        parsedResult = JSON.parse(llmResult);
      } else if (llmResult.response && typeof llmResult.response === "string") {
        parsedResult = JSON.parse(llmResult.response);
      }
    } catch (parseErr) {
      console.error("processHealthInput JSON parse error:", parseErr?.message || String(parseErr));
      return Response.json({ next_question: "Pardon, je n'ai pas compris la reponse. Peux-tu reformuler ?", records_to_save: [], suggested_actions: [], is_finished: false }, { status: 200 });
    }

    return Response.json(parsedResult);

  } catch (error) {
    console.error("processHealthInput error:", error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});