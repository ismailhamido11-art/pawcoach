import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, text, imageUrl, dogId } = await req.json();

    // Fetch dog info and health records for context
    let dogName = "ton chien";
    let ownerName = "toi";
    let dogDetails = "";
    let historyContext = "";
    
    console.log(`[DEBUG] Processing for dogId: ${dogId}`);
    
    if (dogId) {
      try {
        console.log(`[DEBUG] Fetching dog with ID: ${dogId}`);
        // Use get() for direct ID lookup
        let dog = null;
        try {
          dog = await base44.entities.Dog.get(dogId);
        } catch (e) {
          console.warn(`[WARN] Dog.get(${dogId}) failed, trying filter...`);
          const dogs = await base44.entities.Dog.filter({ id: dogId });
          if (dogs && dogs.length > 0) dog = dogs[0];
        }

        if (dog) {
          console.log(`[DEBUG] Dog found: ${dog.name}`);
          dogName = dog.name || "ton chien";
          if (dog.breed) dogDetails += dog.breed;
          if (dog.weight) dogDetails += ` (${dog.weight}kg)`;
        } else {
           console.warn(`[WARN] No dog found for id ${dogId}`);
        }
        
        const records = await base44.entities.HealthRecord.filter({ dog_id: dogId }, "-date", 20);
        
        // Analyze missing info
        let missingInfos = [];
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
    try {
      if (user && user.full_name) {
        ownerName = user.full_name.split(" ")[0]; // First name
      }
    } catch (e) {}

    // Check if this is the first message
    const isFirstMessage = !messages || messages.length === 0 || (Array.isArray(messages) && messages.length === 1);

    // Build prompt for LLM
    const systemPrompt = `Tu es l'ange gardien vétérinaire de ${dogName}${dogDetails ? ` (${dogDetails})` : ''}. ${ownerName} compte sur toi.
Ton but : Rassurer, Guider, et Être Efficace.

RÈGLES D'INTELLIGENCE ÉMOTIONNELLE :
- Sois chaleureux mais précis. Utilise des émojis rassurants 🐾 💙.
- Si le chien va mal : PAS DE BLABLA inutile. Pose 1 question pour cibler l'urgence, puis donne la conduite à tenir.
- Crée du lien : "Pauvre ${dogName}...", "Je comprends ton inquiétude...".

GÉRER LE LIEN VÉTÉRINAIRE :
Si tu recommandes d'aller chez le véto :
1. NE METS PAS de lien Google Maps dans ton texte.
2. Mets le champ JSON "show_vet_map": true.
3. Dis simplement "Je te conseille de consulter un vétérinaire." ou "Une visite s'impose."
L'application affichera automatiquement une carte interactive et les boutons d'urgence.

DÉROULEMENT "ENTONNOIR" :
${isFirstMessage ? `DÉBUT :
Accueille ${ownerName} avec douceur.
Propose ces actions (Smart Buttons) :
["Urgence / Bobo 🤒", "Sortie de véto 🏥", "Mettre à jour le carnet 📝", "Conseil / Question ❓"]` : `SUITE :
1. Analyse l'historique pour ne pas te répéter.
2. Si tu as assez d'infos -> DONNE LA SOLUTION/CONSEIL + LIEN VÉTO SI BESOIN -> "is_finished": true.
3. Sinon -> Pose UNE question simple -> Propose 3 RÉPONSES PRÉ-MÂCHÉES (Smart Buttons) pour que l'utilisateur n'ait même pas besoin d'écrire.`}

IMPORTANT SUR LES SUGGESTIONS (suggested_actions) :
Ce sont des RÉPONSES que l'utilisateur peut donner.
Exemple : Si tu demandes "Il a de la fièvre ?", tes suggestions DOIVENT être : ["Oui, il est chaud", "Non, ça va", "Je ne sais pas"].
NE METS JAMAIS des ordres comme "Répondre à la question".

Retourne TOUJOURS du JSON valide :
{
  "next_question": "Ton message rassurant (avec markdown pour les liens)",
  "records_to_save": [{ "type": "vaccine|vet_visit|weight|medication|allergy|note", "title": "...", "date": "YYYY-MM-DD", "next_date": "...", "value": number, "details": "..." }],
  "suggest_scan": false,
  "suggested_actions": ["Réponse A", "Réponse B", "Réponse C"],
  "is_finished": boolean
}`;

    // Collect user message content and history
    let conversationHistory = "";
    let fileUrls = [];

    if (messages && Array.isArray(messages)) {
      conversationHistory = messages.map(m => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'} : ${m.content}`).join("\n");
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.image_url) fileUrls.push(lastMsg.image_url);
    } else if (text || imageUrl) {
      conversationHistory = `Utilisateur : ${text || "Document à analyser"}`;
      if (imageUrl) fileUrls.push(imageUrl);
    }

    // Call Base44 native LLM
    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt + "\n\n--- HISTORIQUE DE LA CONVERSATION ---\n" + conversationHistory,
      add_context_from_internet: true,
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