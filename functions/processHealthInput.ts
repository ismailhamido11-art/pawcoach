import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, text, imageUrl, dogId } = await req.json();

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

        const records = await base44.entities.HealthRecord.filter({ dog_id: dogId }, "-date", 20);

        // Analyze missing info
        if (records) {
           const lastWeight = records.find(r => r.type === 'weight');
           const lastVaccine = records.find(r => r.type === 'vaccine');
           const lastVet = records.find(r => r.type === 'vet_visit');

           if (!lastWeight) missingInfos.push("poids (jamais fait)");
           else {
              const d = new Date(lastWeight.date);
              const now = new Date();
              const diffTime = Math.abs(now - d);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays > 30) missingInfos.push(`poids (vieux de ${diffDays} jours)`);
           }
           if (!lastVaccine) missingInfos.push("vaccins (aucun)");
           if (!lastVet) missingInfos.push("visite vétérinaire (aucune)");

           const summaryLines = records.map(r => {
            let line = `${r.date} [${r.type}]: ${r.title}`;
            if (r.value) line += ` (${r.value}kg)`;
            return line;
          });
          historyContext = "DONNÉES EXISTANTES DU CARNET:\n" + summaryLines.slice(0, 8).join("\n");
        }
      } catch (e) {
        console.warn("[WARN] Error fetching history:", e.message);
      }
    }

    // Get current user info
    if (user && user.full_name) {
      ownerName = user.full_name.split(" ")[0]; // First name
    }

    // Build prompt for LLM
    const systemPrompt = `Tu es l'ange gardien vétérinaire de ${dogName}${dogDetails ? ` (${dogDetails})` : ''}. ${ownerName} compte sur toi.
Ton but : Rassurer, Guider, et Être Efficace.

CONTEXTE MÉDICAL : ${historyContext || "Aucun historique médical récent."}
INFORMATIONS MANQUANTES : ${missingInfos.length > 0 ? missingInfos.join(", ") : "Tout est à jour !"}

RÈGLES D'INTELLIGENCE ÉMOTIONNELLE :
- Sois chaleureux mais précis. Utilise des émojis rassurants 🐾 💙.
- Si le chien va mal : PAS DE BLABLA inutile. Pose 1 question pour cibler l'urgence, puis donne la conduite à tenir.
- Crée du lien : "Pauvre ${dogName}...", "Je comprends ton inquiétude...".

GÉRER LE LIEN VÉTÉRINAIRE :
Si tu recommandes d'aller chez le véto :
1. NE METS PAS de lien Google Maps dans ton texte.
2. Mets le champ JSON "show_vet_map": true.
3. Dis simplement "Je te conseille de consulter un vétérinaire." ou "Une visite s'impose."

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
  "show_vet_map": false,
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
          show_vet_map: { type: "boolean" },
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
    if (typeof llmResult === "string") {
      parsedResult = JSON.parse(llmResult);
    } else if (llmResult.response && typeof llmResult.response === "string") {
      parsedResult = JSON.parse(llmResult.response);
    }

    return Response.json(parsedResult);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});