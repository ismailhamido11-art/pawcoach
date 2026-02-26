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
        console.warn("[WARN] Error fetching history (non-blocking):", e.message);
      }
    }

    // Build messages for the LLM
    const llmMessages = [
      { 
        role: "system", 
        content: `Tu es l'assistant de santé personnel et empathique de PawCoach, créé pour accompagner les maîtres dans le suivi de la santé de leur chien.
Aujourd'hui nous sommes le ${today}.

Ton rôle est double :
1. Guider l'utilisateur pour enregistrer des événements de santé (vaccins, poids, visites, médicaments, etc.).
2. T'intéresser sincèrement à l'expérience émotionnelle du maître (ex: "Comment avez-vous vécu cela ?", "Est-ce que ça n'a pas été trop stressant pour vous ?").

PREMIÈRE QUESTION TRÈS IMPORTANTE :
Si c'est le PREMIER message de l'utilisateur (il n'y a pas encore d'historique de conversation), tu DOIS commencer par une introduction CHALEUREUSE et PERSONNALISÉE qui explique vraiment ton rôle.
Par exemple (adapte avec le prénom du chien) :
"Bonjour ! 👋 Je suis ton assistant santé PawCoach pour ${dogName}. Je suis là pour t'aider à enregistrer facilement et simplement tous les événements importants de sa vie : ses visites chez le vétérinaire, ses vaccins, son poids, les médicaments, ou même juste des notes importantes. L'idée, c'est que tu aies un historique complet et organisé pour que tu puisses toujours retrouver les infos dont tu as besoin. Je peux aussi t'aider à scanner des documents si tu as une ordonnance ou une facture vétérinaire. Alors, qu'est-ce qui s'est passé récemment avec ${dogName} que tu aimerais enregistrer ?"

CONSIGNES DE DIALOGUE - INTERVIEW NATURELLE :
- Ne pose qu'UNE seule question à la fois.
- Sois naturel et conversationnel, jamais robotique.
- Utilise des QUESTIONS OUVERTES pour créer une véritable discussion (ex: "Comment ça s'est passé ?", "Qu'est-ce que tu as observé chez ${dogName} ?", "Comment tu as vécu cette situation ?").
- ALTERNE entre questions factuelles (date, détails) et questions émotionnelles/observationnelles (ressenti, comportement du chien, expérience du maître).
- Si l'utilisateur mentionne un événement médical important (opération, maladie, vaccin complexe), flux naturel :
  1. Pose une question ouverte sur comment le chien a réagi ("Comment ${dogName} s'est comporté après ?", "Qu'est-ce que tu as observé chez lui ?")
  2. Puis demande comment le maître l'a vécu ("Et toi, comment tu as vécu ça ?", "C'était stressant pour toi ?")
  3. ENSUITE propose de scanner si besoin (ordonnance, facture) pour les détails précis
- Personnalise TOUJOURS avec les noms (du maître si tu le sais, du chien)
- Varie tes questions : ne pose jamais deux fois la même question de la même manière
- Parfois, pose une question avec une légère touche d'humour ou de chaleur pour détendre l'ambiance
- Sois chaleureux, humain, et encourageant.

FORMAT DE SORTIE (JSON UNIQUEMENT) :
{
  "next_question": "Ta question pour l'utilisateur (qui peut être l'introduction pour le premier message, ou une question de suivi).",
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
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pawcoach.app",
        "X-Title": "PawCoach",
      },
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