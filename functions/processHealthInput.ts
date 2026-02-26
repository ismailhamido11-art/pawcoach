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

RÈGLE D'OR : Écoute l'utilisateur avant tout ! Ne tourne pas en rond. S'il te parle d'un problème spécifique (ex: mal aux dents), réponds LUI LÀ-DESSUS directement et pose une question pour creuser CE problème. Oublie les infos manquantes si l'utilisateur te parle d'un problème précis.

INFOS MANQUANTES DANS LE CARNET : ${(typeof missingInfos !== 'undefined' && missingInfos.length > 0) ? missingInfos.join(", ") : "Rien, tout est à jour"}. (Ne demande ces infos QUE si la discussion est une simple mise à jour, n'en parle JAMAIS si le chien est malade).

DÉROULEMENT :
${isFirstMessage ? `DÉBUT DE CONVERSATION :
Salue ${ownerName} et demande ce qui l'amène aujourd'hui.
Propose 4 suggestions larges : ["Sortie de véto 🏥", "Il est malade 🤒", "Mise à jour carnet 📝", "Juste discuter 🐾"]` : `SUITE DE CONVERSATION :
1. ANALYSE CE QUE DIT L'UTILISATEUR. S'il te parle d'un symptôme ou d'un problème, adapte-toi IMMÉDIATEMENT. Ne change pas de sujet, ne reviens pas sur des vieux trucs.
2. Pose UNE SEULE question claire à la fin de ta réponse pour l'aider ou préciser.
3. Génère TOUJOURS 3 ou 4 "suggested_actions" (SMART REPLIES) ultra pertinentes par rapport à TA question, pour qu'il puisse te répondre en un clic sans taper (ex: si tu demandes "Depuis quand a-t-il mal ?", suggère ["Depuis ce matin", "Depuis hier", "Plusieurs jours"]).`}

Retourne TOUJOURS du JSON valide :
{
  "next_question": "Ta réponse empathique + ta question suivante",
  "records_to_save": [{ "type": "vaccine|vet_visit|weight|medication|allergy|note", "title": "...", "date": "YYYY-MM-DD", "next_date": "...", "value": number, "details": "..." }],
  "suggest_scan": false,
  "suggested_actions": ["Réponse rapide 1", "Réponse rapide 2", "Réponse rapide 3"],
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