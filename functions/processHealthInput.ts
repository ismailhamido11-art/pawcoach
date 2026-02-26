import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Support new "conversation" mode or legacy "single input" mode
    const { messages, text, imageUrl, dogId } = await req.json();

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return Response.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 });

    const today = new Date().toISOString().split("T")[0];

    // Fetch existing records for context
    let historyContext = "";
    if (dogId) {
      try {
        const records = await base44.entities.HealthRecord.filter({ dog_id: dogId }, "-date", 10);
        if (records && records.length > 0) {
          historyContext = "Historique médical récent du chien :\n" + records.map(r => `- ${r.date} : [${r.type}] ${r.title} ${r.value ? `(${r.value}kg)` : ''} ${r.details ? `(${r.details})` : ''}`).join("\n");
        }
      } catch (e) {
        console.error("Error fetching history", e);
      }
    }

    // Build messages for the LLM
    const llmMessages = [
      { 
        role: "system", 
        content: `Tu es l'assistant de santé personnel et empathique de PawCoach.
Aujourd'hui nous sommes le ${today}.

Ton rôle est double :
1. Guider l'utilisateur pour enregistrer des événements de santé (vaccins, poids, visites, etc.).
2. T'intéresser à l'expérience émotionnelle du maître (ex: "Comment avez-vous vécu cela ?", "Est-ce que ça n'a pas été trop dur pour vous ?").

CONSIGNES DE DIALOGUE :
- Ne pose qu'UNE seule question à la fois.
- Si l'utilisateur commence, pose une question de clarification si nécessaire (date, réaction).
- Si tu détectes un événement médical important (maladie, opération, vaccin), demande comment le chien a réagi, PUIS demande comment le maître l'a vécu.
- Suggère de scanner un document (ordonnance, facture) UNIQUEMENT si c'est pertinent pour avoir des détails précis (ex: "Avez-vous l'ordonnance sous la main ? Je pourrais la scanner pour noter les dosages exacts.").
- Sois chaleureux, humain, et encourageant.

FORMAT DE SORTIE (JSON UNIQUEMENT) :
{
  "next_question": "Ta prochaine question pour l'utilisateur, ou null si l'interaction semble terminée.",
  "records_to_save": [
     // Tableau d'objets HealthRecord COMPLETS. Ne le remplis que si tu as toutes les infos (date, type, titre).
     // Structure: { "type": "...", "title": "...", "date": "...", "next_date": "...", "value": number, "details": "..." }
     // Types: vaccine, vet_visit, weight, medication, allergy, note
  ],
  "suggest_scan": boolean, // true si tu penses qu'un scan serait utile MAINTENANT
  "is_finished": boolean // true si l'utilisateur a dit "terminé", "c'est tout", ou si tu as fini de traiter l'info
}

CONTEXTE MÉDICAL :
${historyContext}
`
      }
    ];

    if (messages && Array.isArray(messages)) {
      // New conversation mode
      messages.forEach(msg => {
        const content = [];
        if (msg.image_url) content.push({ type: "image_url", image_url: { url: msg.image_url } });
        if (msg.content) content.push({ type: "text", text: msg.content });
        llmMessages.push({ role: msg.role, content });
      });
    } else {
      // Legacy mode (single input)
      const content = [];
      if (imageUrl) content.push({ type: "image_url", image_url: { url: imageUrl } });
      if (text) content.push({ type: "text", text: `L'utilisateur dit : "${text}"` });
      llmMessages.push({ role: "user", content });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pawcoach.app",
        "X-Title": "PawCoach",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: llmMessages,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    // Parse JSON
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      result = { records: [], message: "Erreur de lecture de la réponse IA." };
    }

    return Response.json(result);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});