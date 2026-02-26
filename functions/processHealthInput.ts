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
    
    if (dogId) {
      try {
        const dogs = await base44.entities.Dog.filter({ id: dogId });
        if (dogs && dogs.length > 0) {
          const dog = dogs[0];
          dogName = dog.name || "ton chien";
          if (dog.breed) dogDetails += dog.breed;
          if (dog.weight) dogDetails += ` (${dog.weight}kg)`;
        }
        
        const records = await base44.entities.HealthRecord.filter({ dog_id: dogId }, "-date", 15);
        if (records && records.length > 0) {
          const summaryLines = records.map(r => {
            let line = `${r.date}: ${r.title}`;
            if (r.value) line += ` (${r.value}kg)`;
            if (r.details) line += ` - ${r.details}`;
            return line;
          });
          historyContext = "Historique récent:\n" + summaryLines.slice(0, 5).join("\n");
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
    const systemPrompt = `Tu es un assistant de santé personnalisé pour ${dogName}${dogDetails ? ` (${dogDetails})` : ''}, le chien de ${ownerName}.

Ton rôle : Écouter ${ownerName}, poser des questions bienveillantes, et garder un journal de la santé de ${dogName}.
Ton ton : Chaleureux, attentif, comme un ami qui se soucie vraiment de ${dogName}. Utilise le prénom du chien. Fais reference à ce qu'on s'est dit.

${isFirstMessage ? `PREMIER MESSAGE :
Commence par une vraie intro chaleureuse qui explique qui tu es et ce qu'on va faire ensemble.
Exemple style :
"Coucou ${ownerName} ! 👋 Je suis ton assistant santé pour ${dogName}. On va garder ensemble un carnet de sa santé - vaccins, visites chez le veto, tout ça.

Alors, comment va ${dogName} en ce moment ? Quelque chose de spécial à me raconter ?"

Sois naturel, pas robotique. Utilise le prénom du chien. Fais sentir que tu t'intéresses vraiment.` : `SUIVI DE CONVERSATION :
Sois personnel et naturel (2-3 phrases max).
Référence ce qu'on s'est dit : "Tu m'avais dit que... [contexte]"
Pose une seule question qui continue la discussion logiquement.
Utilise le prénom du chien et celui de ${ownerName}.
${historyContext ? `Historique (utilise-le si pertinent) :\n${historyContext}` : ""}`}

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