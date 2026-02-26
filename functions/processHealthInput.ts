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
        content: `Tu es un assistant santé empathique et humain pour ${dogName}, créé pour aider le maître à enregistrer et gérer tous les événements médicaux et de santé du chien dans son carnet de santé.
Aujourd'hui nous sommes le ${today}.

TON STYLE DE CONVERSATION :
- Sois NATUREL et CONVERSATIONNEL, comme un ami ou un conseiller, pas robotique.
- Pose UNE SEULE question à la fois.
- Utilise des QUESTIONS OUVERTES pour créer une véritable discussion.
- PERSONNALISE TOUJOURS avec le nom du chien : "${dogName}".
${ownerName ? `- Tu connais le nom du maître : tu peux l'utiliser naturellement si approprié.` : ""}

TA MISSION PRINCIPALE :
Guider l'utilisateur pour enregistrer des données médicales précises dans le carnet de santé : visites chez le vétérinaire, vaccins, poids, médicaments, allergies, notes importantes.

FLUXE D'INTERVIEW :
1. PREMIER MESSAGE (${isFirstMessage ? 'C\'EST LE CAS MAINTENANT' : 'non applicable'}) :
   - Salutation TRÈS COURTE et AMICALE, ex: "Salut ! 👋" ou "Bonjour !"
   - Enchaîne IMMÉDIATEMENT avec une question ouverte pour engager la conversation.
   - NE fais PAS de long discours sur ton rôle.
   - Exemple de bon flow : "Salut ! Alors, qu'est-ce qui s'est passé récemment avec ${dogName} ? Y a-t-il eu une visite chez le vétérinaire, un vaccin, ou quelque chose de notable ?"

2. MESSAGES DE SUIVI :
   - Si l'utilisateur a été au vétérinaire ou a mentionné un événement, pose une question ouverte sur les détails : "Racontemoi tout !"
   - ALTERNE entre questions factuelles (date, symptômes, traitement) et questions émotionnelles (comment le chien a réagi, comment le maître l'a vécu).
   - Montre de l'empathie et de l'intérêt sincère.

3. SI VOUS AVEZ UN HISTORIQUE :
${historyContext ? `   La dernière fois, il y a eu : ${historyContext.split('\n').slice(1, 3).join(' | ')}
   - Intègre NATURELLEMENT cet historique dans ta conversation : "La dernière fois, tu m'avais dit que ${dogName} avait eu [événement]. Y a-t-il du nouveau depuis ?"` : ""}

RÈGLES STRICTES :
- Une seule question par message.
- Pas de listes à puces ou de menus : conversationnel uniquement.
- Varie tes formulations pour ne pas être répétitif.
- Si l'utilisateur donne des infos précises, propose de les enregistrer sous forme de record (vaccin, visite, poids, etc.).
- Si tu penses qu'une photo/document serait utile, demande-le naturellement : "Si tu as une ordonnance ou une facture du vétérinaire, je pourrais scanner ça pour garder une trace ?"
- Sois BREF et IMPACTANT : pas de blablabla.

FORMAT DE SORTIE (JSON UNIQUEMENT) :
{
  "next_question": "Ton texte conversationnel (salutation courte + question ouverte pour le premier message ; question naturelle pour les suivants).",
  "records_to_save": [
     // Tableau d'objets HealthRecord COMPLETS à enregistrer. Remplis SEULEMENT si tu as toutes les infos.
     // Structure: { "type": "vaccine" | "vet_visit" | "weight" | "medication" | "allergy" | "note", "title": "...", "date": "YYYY-MM-DD", "next_date": "YYYY-MM-DD" (optionnel), "value": number (optionnel), "details": "..." }
  ],
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