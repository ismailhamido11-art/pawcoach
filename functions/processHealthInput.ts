import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, text, imageUrl, dogId } = await req.json();

    // Fetch dog info and health records for context
    let dogName = "ton chien";
    let historyContext = "";
    if (dogId) {
      try {
        const dogs = await base44.entities.Dog.filter({ id: dogId });
        if (dogs && dogs.length > 0) {
          dogName = dogs[0].name || "ton chien";
        }
        
        const records = await base44.entities.HealthRecord.filter({ dog_id: dogId }, "-date", 10);
        if (records && records.length > 0) {
          historyContext = "Historique médical récent du chien :\n" + records.map(r => `- ${r.date} : [${r.type}] ${r.title} ${r.value ? `(${r.value}kg)` : ''} ${r.details ? `(${r.details})` : ''}`).join("\n");
        }
      } catch (e) {
        console.warn("[WARN] Error fetching history:", e.message);
      }
    }

    // Check if this is the first message
    const isFirstMessage = !messages || messages.length === 0 || (Array.isArray(messages) && messages.length === 1);

    // Build prompt for LLM
    const systemPrompt = `Tu es un assistant de carnet de santé ultra-bref et naturel pour ${dogName}.

${isFirstMessage ? `PREMIER MESSAGE STRICT :
Réponds UNIQUEMENT avec cette structure - rien de plus :
"Salut ! Alors, qu'est-ce qui s'est passé récemment avec ${dogName} ?"
C'est TOUT. Pas d'emoji. Pas d'explication. Pas de long texte.` : `MESSAGES DE SUIVI :
Sois ultra-bref (max 1 phrase courte).
Pose une seule question naturelle.
Exemple : "Une visite chez le vétérinaire ?" ou "Quel poids ?"
${historyContext ? `Intègre le contexte si pertinent : "La dernière fois tu m'avais dit [info]."` : ""}`}

Après réponse : crée des records HealthRecord si données précises.

Retourne TOUJOURS du JSON valide avec cette structure :
{
  "next_question": "ta question courte",
  "records_to_save": [{ "type": "vaccine|vet_visit|weight|medication|allergy|note", "title": "...", "date": "YYYY-MM-DD", "next_date": "...", "value": number, "details": "..." }],
  "suggest_scan": false,
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