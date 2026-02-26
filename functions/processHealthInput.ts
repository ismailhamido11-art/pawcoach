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
        content: `Tu es un assistant de carnet de santé ultra-bref et naturel pour ${dogName}.

${isFirstMessage ? `PREMIER MESSAGE STRICT :
Réponds UNIQUEMENT avec cette structure - rien de plus :
"Salut ! Alors, qu'est-ce qui s'est passé récemment avec ${dogName} ?"
C'est TOUT. Pas d'emoji. Pas d'explication. Pas de long texte.` : `MESSAGES DE SUIVI :
Sois ultra-bref (max 1 phrase courte).
Pose une seule question naturelle.
Exemple : "Une visite chez le vétérinaire ?" ou "Quel poids ?"
${historyContext ? `Intègre le contexte si pertinent : "La dernière fois tu m'avais dit [info]."` : ""}`}

Après réponse : crée des records HealthRecord si données précises.
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