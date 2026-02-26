import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, imageUrl, dogId } = await req.json();

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return Response.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 });

    const today = new Date().toISOString().split("T")[0];

    // Build the prompt
    let userContent = [];
    if (imageUrl) {
      userContent.push({ type: "image_url", image_url: { url: imageUrl } });
      userContent.push({ type: "text", text: "Extrais les informations de santé de cette image." });
    }
    if (text) {
      userContent.push({ type: "text", text: `L'utilisateur dit : "${text}"` });
    }

    const systemPrompt = `Tu es un assistant vétérinaire expert en extraction de données.
Aujourd'hui nous sommes le ${today}.
Ta tâche est d'analyser le texte ou l'image fourni et d'extraire des enregistrements de santé structurés pour le chien.

Retourne UNIQUEMENT un JSON valide (sans markdown) contenant un tableau "records".
Chaque record doit suivre ce format :
{
  "type": "vaccine" | "vet_visit" | "weight" | "medication" | "allergy" | "note",
  "title": string (ex: "Vaccin Rage", "Visite annuelle", "Poids", "Antibiotique"),
  "date": string (YYYY-MM-DD, obligatoire, déduis-la si nécessaire, par défaut aujourd'hui si "hier" ou "aujourd'hui" est dit),
  "next_date": string (YYYY-MM-DD, optionnel, pour les rappels),
  "value": number (optionnel, pour le poids en kg),
  "details": string (optionnel, contexte supplémentaire)
}

Règles :
- Si on parle de poids (ex: "Il fait 15kg"), type="weight", value=15, title="Pesée".
- Si on parle de vaccin (ex: "Rappel CHPL"), type="vaccine". Essaie de deviner la prochaine date si c'est standard (1 an après).
- Si on parle de visite vétérinaire, type="vet_visit".
- Si médicament, type="medication".
- Si rien n'est détecté, retourne { "records": [], "message": "Je n'ai pas compris. Peux-tu préciser ?" }
- Si détecté, ajoute un petit message de confirmation dans le champ "message" du JSON racine (ex: "J'ai trouvé 1 vaccin.").
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pawcoach.app",
        "X-Title": "PawCoach",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o", // Use a capable model for extraction
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
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