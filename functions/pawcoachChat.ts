import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, dogId, imageUrl } = await req.json();

    if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });

    // Fetch dog profile server-side
    const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
    const dog = dogs?.[0];
    if (!dog) return Response.json({ error: 'Dog not found' }, { status: 400 });

    // Build system prompt server-side
    const getAge = (birthDate) => {
      if (!birthDate) return null;
      const months = Math.floor((Date.now() - new Date(birthDate)) / (1000 * 60 * 60 * 24 * 30));
      if (months < 1) return "moins d'un mois";
      if (months < 12) return `${months} mois`;
      const years = Math.floor(months / 12);
      const rem = months % 12;
      return rem > 0 ? `${years} an${years > 1 ? 's' : ''} et ${rem} mois` : `${years} an${years > 1 ? 's' : ''}`;
    };

    const ageStr = getAge(dog.birth_date);
    const systemPrompt = `Tu es PawCoach, un assistant IA spécialisé dans le bien-être canin. Tu donnes des conseils personnalisés sur la nutrition, le comportement et le dressage.

PROFIL DU CHIEN :
- Nom : ${dog.name}
- Race : ${dog.breed || "Non renseignée"}
${ageStr ? `- Âge : ${ageStr}` : ""}
${dog.weight ? `- Poids : ${dog.weight} kg` : ""}
${dog.sex ? `- Sexe : ${dog.sex === "male" ? "Mâle" : "Femelle"}` : ""}
${dog.neutered !== undefined ? `- Stérilisé : ${dog.neutered ? "Oui" : "Non"}` : ""}
${dog.activity_level ? `- Niveau d'activité : ${dog.activity_level}` : ""}
${dog.environment ? `- Environnement : ${dog.environment}` : ""}
${dog.allergies ? `- Allergies : ${dog.allergies}` : ""}
${dog.health_issues ? `- Problèmes de santé : ${dog.health_issues}` : ""}
${dog.vet_name ? `- Vétérinaire : ${dog.vet_name}${dog.vet_city ? ` (${dog.vet_city})` : ""}` : ""}

RÈGLES :
- Réponds en français, avec le tutoiement
- Sois chaleureux, utilise des émojis 🐾
- Personnalise tes réponses en fonction du profil ci-dessus
- Ne pose JAMAIS de diagnostic médical
- En cas de symptôme inquiétant, recommande toujours de consulter un vétérinaire
- Sois concis (2-3 paragraphes max)`;

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return Response.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 });

    let model = "deepseek/deepseek-chat";
    let lastUserMessage = messages[messages.length - 1];

    // If there's an image, use GPT-4o vision
    if (imageUrl) {
      model = "openai/gpt-4o";
      // Replace last user message with vision content
      const visionMessages = messages.slice(0, -1);
      visionMessages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl }
          },
          {
            type: "text",
            text: (lastUserMessage?.content || "Analyse cette image de mon chien.") + "\n\nNote: Décris ce que tu observes. Ne diagnostique jamais. Si tu vois des symptômes inquiétants, recommande de consulter un vétérinaire."
          }
        ]
      });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://pawcoach.app",
          "X-Title": "PawCoach",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...visionMessages,
          ],
          max_tokens: 600,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return Response.json({ error: err }, { status: response.status });
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      return Response.json({ content });
    }

    // Text-only with DeepSeek
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pawcoach.app",
        "X-Title": "PawCoach",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return Response.json({ content });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});