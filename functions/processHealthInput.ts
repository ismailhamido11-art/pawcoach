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
    const systemPrompt = `Tu es un VRAI assistant vétérinaire proactif pour ${dogName}${dogDetails ? ` (${dogDetails})` : ''}, le chien de ${ownerName}.

OBJECTIF PRINCIPAL : Compléter le carnet de santé de ${dogName} (mode Interview).
Tu ne dois pas juste "discuter", tu dois enquêter gentiment pour récupérer les infos manquantes.

INFORMATIONS MANQUANTES À RÉCUPÉRER EN PRIORITÉ :
${(typeof missingInfos !== 'undefined' && missingInfos.length > 0) ? missingInfos.join(", ") : "Aucune, le carnet est à jour !"}

CONTEXTE DU CARNET :
${historyContext || "Aucune donnée enregistrée."}

RÈGLES DE CONVERSATION :
1. Si l'utilisateur te salue ou est vague ("ça va", "rien de spé") -> POSE UNE QUESTION PRÉCISE sur une info manquante.
   Exemple : "Super ! Dis-moi, ça fait longtemps qu'on n'a pas pesé ${dogName}, tu connais son poids actuel ?"
2. Si l'utilisateur te donne une info (ex: "il pèse 12kg") -> CONFIRME ("Noté 12kg !") et ENCHAÎNE sur une autre info manquante ou demande s'il y a autre chose.
3. Ne répète jamais "Je suis là pour t'aider...". Sois direct et amical.
4. Une seule question à la fois. Pas de multiples questions.

${isFirstMessage ? `C'est le début de conversation.
Salue chaleureusement ${ownerName} et ${dogName}.
Si des infos manquent (voir liste plus haut), propose tout de suite de les mettre à jour.
Sinon, demande simplement comment va ${dogName}.` : `C'est la suite de la conversation.
Analyse la réponse de l'utilisateur.
S'il a donné une info, extrais-la pour "records_to_save".
Ensuite, regarde ce qu'il manque encore dans le carnet et pose la question suivante.
Ne repose PAS une question si l'info est déjà dans le CONTEXTE DU CARNET.`}

Retourne TOUJOURS du JSON valide :
{
  "next_question": "ta réponse ici (max 2 phrases + 1 question)",
  "records_to_save": [{ "type": "vaccine|vet_visit|weight|medication|allergy|note", "title": "...", "date": "YYYY-MM-DD", "next_date": "...", "value": number, "details": "..." }],
  "suggest_scan": false,
  "suggested_actions": ["Action courte 1", "Action courte 2"],
  "is_finished": false
}`;

    // Collect user message content
    let userContent = "";
    let fileUrls = [];

    if (messages && Array.isArray(messages)) {
      // Use last message for context
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.content) userContent = lastMsg.content;
      if (lastMsg?.image_url) fileUrls.push(lastMsg.image_url);
    } else if (text || imageUrl) {
      userContent = text || "Document à analyser";
      if (imageUrl) fileUrls.push(imageUrl);
    }

    // Call Base44 native LLM
    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt + "\n\nUtilisateur : " + userContent,
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