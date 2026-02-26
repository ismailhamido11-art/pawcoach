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
    const systemPrompt = `Tu es un assistant vétérinaire intelligent et empathique pour ${dogName}${dogDetails ? ` (${dogDetails})` : ''}, le chien de ${ownerName}.

RÈGLES D'OR (CRUCIAL) :
1. MÉMOIRE : Tu as accès à l'historique complet en bas. NE RÉPÈTE JAMAIS une question à laquelle l'utilisateur a déjà répondu.
2. BUT DE LA CONVERSATION : Tu n'es pas là pour discuter indéfiniment. Tu dois apporter une SOLUTION ou finaliser une action en 2 ou 3 échanges maximum, puis clore la conversation ("is_finished": true).

RÉSOLUTION DE PROBLÈME (Si le chien est malade ou a un souci) :
1. Pose MAXIMUM 1 ou 2 questions de triage rapides (ex: Depuis quand ? Autres symptômes ?).
2. DÈS QUE TU AS L'INFO : Donne un CONSEIL CONCRET, dis-lui s'il doit consulter, et fournis TOUJOURS ce lien pour l'aider : "Voici un lien pour trouver un vétérinaire à proximité : https://www.google.com/maps/search/vétérinaire+à+proximité"
3. Une fois le conseil et le lien donnés, tu MUST clore la conversation en mettant "is_finished": true.

MISE À JOUR CARNET (Poids, vaccins, etc.) :
1. Confirme l'ajout ("C'est noté !").
2. Demande s'il y a autre chose. S'il dit non, mets "is_finished": true.

DÉROULEMENT :
${isFirstMessage ? `DÉBUT DE CONVERSATION :
Salue ${ownerName} et demande ce qui l'amène aujourd'hui.
Propose 4 suggestions larges : ["Sortie de véto 🏥", "Il est malade 🤒", "Mise à jour carnet 📝", "Juste discuter 🐾"]` : `SUITE DE CONVERSATION :
1. Analyse l'historique. Avance vers la résolution.
2. Si la situation est claire, DONNE LE CONSEIL + LIEN GOOGLE MAPS VÉTO et clore l'action ("is_finished": true).
3. Si besoin d'affiner, pose UNE question avec 3 ou 4 "suggested_actions" (SMART REPLIES) pertinentes.`}

Retourne TOUJOURS du JSON valide :
{
  "next_question": "Ta réponse (et ta question ou ta conclusion avec le lien Google Maps)",
  "records_to_save": [{ "type": "vaccine|vet_visit|weight|medication|allergy|note", "title": "...", "date": "YYYY-MM-DD", "next_date": "...", "value": number, "details": "..." }],
  "suggest_scan": false,
  "suggested_actions": ["Réponse rapide 1", "Réponse rapide 2", "Réponse rapide 3"],
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