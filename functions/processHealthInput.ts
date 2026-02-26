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

OBJECTIF : Aider l'utilisateur rapidement grâce à des QUESTIONS CIBLÉES et des SUGGESTIONS DE RÉPONSES (Entonnoir).

INFOS MANQUANTES (à récupérer si l'occasion se présente) : ${(typeof missingInfos !== 'undefined' && missingInfos.length > 0) ? missingInfos.join(", ") : "Rien, tout est à jour"}.

RÈGLES "SMART REPLY" (CRUCIAL - C'EST TON OUTIL PRINCIPAL D'ERGONOMIE) :
Tu dois TOUJOURS générer 3 ou 4 "suggested_actions" qui sont des RÉPONSES DIRECTES que l'utilisateur peut cliquer.
C'est le "mode entonnoir" : on part du large vers le précis.

DÉROULEMENT :
${isFirstMessage ? `1. DÉBUT DE CONVERSATION :
Salue ${ownerName}.
Demande ce qui l'amène aujourd'hui avec des choix larges.
Génère CES suggested_actions PRÉCISES pour orienter direct : 
["Sortie de véto 🏥", "Il est malade 🤒", "Mise à jour poids/santé 📝", "Juste discuter 🐾"]` : `2. SUITE DE CONVERSATION :
Analyse la réponse.
- Si "Sortie de véto" -> Demande "C'était pour quoi ?" -> Suggestions : ["Vaccins annuels", "Contrôle routine", "Urgence", "Autre"].
- Si "Il est malade" -> Demande "Mince, quel genre de souci ?" -> Suggestions : ["Digestif (Vomi/Diarrhée)", "Boiterie", "Peau/Grattage", "Fatigue"].
- Si "Mise à jour" -> Demande l'info manquante prioritaire (${(typeof missingInfos !== 'undefined' && missingInfos.length > 0) ? missingInfos[0] : "aucune"}).
- Si tu poses une question de date -> Suggestions : ["Aujourd'hui", "Hier", "Il y a 1 semaine"].
- Si tu poses une question Oui/Non -> Suggestions : ["Oui", "Non", "Je ne sais pas"].
`}

Retourne TOUJOURS du JSON valide :
{
  "next_question": "Ta réponse courte + ta question suivante",
  "records_to_save": [{ "type": "vaccine|vet_visit|weight|medication|allergy|note", "title": "...", "date": "YYYY-MM-DD", "next_date": "...", "value": number, "details": "..." }],
  "suggest_scan": false,
  "suggested_actions": ["Réponse A", "Réponse B", "Réponse C"],
  "is_finished": boolean
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