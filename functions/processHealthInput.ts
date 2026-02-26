import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, text, imageUrl, dogId } = await req.json();

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    console.log("[DEBUG] apiKey exists:", !!apiKey, "Length:", apiKey?.length);
    if (!apiKey) {
      console.error("[ERROR] OPENROUTER_API_KEY not found in env");
      return Response.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Fetch dog info and health records for context
    let dogName = "ton chien";
    let ownerName = "";
    let historyContext = "";
    if (dogId) {
      try {
        const dogs = await base44.entities.Dog.filter({ id: dogId });
        if (dogs && dogs.length > 0) {
          dogName = dogs[0].name || "ton chien";
          ownerName = dogs[0].owner || "";
        }
        
        const records = await base44.entities.HealthRecord.filter({ dog_id: dogId }, "-date", 10);
        if (records && records.length > 0) {
          historyContext = "Historique médical récent du chien :\n" + records.map(r => `- ${r.date} : [${r.type}] ${r.title} ${r.value ? `(${r.value}kg)` : ''} ${r.details ? `(${r.details})` : ''}`).join("\n");
        }
      } catch (e) {
        console.warn("[WARN] Error fetching history (non-blocking):", e.message);
      }
    }

    // Check if this is the first message of the conversation
    const isFirstMessage = !messages || messages.length === 0 || (Array.isArray(messages) && messages.length === 1);

    // Build messages for the LLM
    const llmMessages = [
      { 
        role: "system", 
        content: `Tu es un assistant santé pour ${dogName}. Tu aides le maître à enregistrer les événements médicaux dans le carnet de santé.
${today}

RÈGLE ABSOLUE - STYLE CONVERSATION HUMAINE :
${isFirstMessage ? `
PREMIER MESSAGE - FAIS COURT, PAS LONG :
- Salutation très courte : "Salut !" ou "Bonjour !"
- Puis UNE question ouverte pour lancer la conversation.
- EXEMPLE : "Salut ! Alors, qu'est-ce qui s'est passé récemment avec ${dogName} ? Une visite chez le veto, un vaccin, ou quelque chose ?"
- Ne parle PAS de ton rôle, ne fais pas de long discours.
` : `
MESSAGES DE SUIVI :
- Pose UNE seule question à la fois.
- Soit naturel et ami, pas robotique.
- Si historique existe, intègre-le : "La dernière fois, ${dogName} avait eu [event]. Y a-t-il du nouveau ?"
- Alterne : questions factuelles (date, symptômes) puis émotionnelles (comment c'était vécu).
- Si l'utilisateur donne des infos, propose d'enregistrer : "Je vais noter ça."
`}

${historyContext ? `HISTORIQUE DE ${dogName} :
${historyContext}` : ""}

DONNÉES À ENREGISTRER (carnet de santé) :
- vaccine : date, type vaccin, date prochaine
- vet_visit : date, raison, détails, date prochain RDV
- weight : date, poids en kg
- medication : date, nom, dosage, durée
- allergy : date découverte, allergie
- note : date, note importante

JSON REQUIS (et SEULEMENT du JSON) :
{
  "next_question": "Ton message conversationnel court",
  "records_to_save": [{ "type": "...", "title": "...", "date": "YYYY-MM-DD", "next_date": "YYYY-MM-DD" (opt), "value": number (opt), "details": "..." }],
  "suggest_scan": boolean,
  "is_finished": boolean
}
`
      }
    ];

    // Determine if there's an image in the conversation
    let hasImage = imageUrl;
    if (!hasImage && messages && Array.isArray(messages)) {
      hasImage = messages.some(msg => msg.image_url);
    }

    // Select model based on content type
    const model = hasImage ? "openai/gpt-4o" : "deepseek/deepseek-v3.2";

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

    console.log("API Key present:", !!apiKey, "Length:", apiKey?.length || 0);
    console.log("Using model:", model);
    console.log("Auth header value:", `Bearer ${apiKey.substring(0, 20)}...`);
    
    const headers = {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
      "http-referer": "https://pawcoach.app",
      "x-title": "PawCoach",
    };
    
    console.log("Headers being sent:", Object.keys(headers));
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        model: model,
        messages: llmMessages,
        response_format: { type: "json_object" }
      }),
    });

    console.log(`OpenRouter response status: ${response.status}`);
    
    if (!response.ok) {
      const err = await response.text();
      console.error(`OpenRouter error (${response.status}):`, err);
      return Response.json({ error: `OpenRouter error: ${err}` }, { status: response.status });
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