import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages: rawMessages, dogId, imageUrl, mode = "chat" } = await req.json();

    if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });

    // Filter messages to only allow safe roles (prevent prompt injection)
    const messages = (rawMessages || []).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
      role: m.role,
      content: String(m.content || ''),
    }));

    // Fetch dog profile server-side
    const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
    const dog = dogs?.[0];
    if (!dog) return Response.json({ error: 'Dog not found' }, { status: 400 });
    if (dog.owner !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Build personalization context from user preferences
    const toneInstructions = {
      encouraging: "Adopte un ton chaleureux, encourageant et bienveillant. Félicite le propriétaire pour ses efforts, mets en valeur les progrès, et donne espoir même dans les situations difficiles.",
      direct: "Adopte un ton direct, factuel et concis. Va à l'essentiel sans fioritures. Donne les informations importantes en premier, évite les formules de politesse inutiles.",
      pedagogical: "Adopte un ton pédagogue. Explique le raisonnement derrière chaque conseil. Aide le propriétaire à comprendre le 'pourquoi' pour qu'il puisse appliquer les principes seuls.",
    };
    const toneInstruction = user.coach_tone ? (toneInstructions[user.coach_tone] || "") : "";

    const topicLabels = { health: "santé", nutrition: "nutrition", training: "dressage", behavior: "comportement" };
    let topicsInstruction = "";
    try {
      const topics = JSON.parse(user.coach_topics || "[]");
      if (Array.isArray(topics) && topics.length > 0) {
        topicsInstruction = `Le propriétaire s'intéresse particulièrement à : ${topics.map(t => topicLabels[t] || t).join(", ")}. Priorise ces sujets quand c'est pertinent.`;
      }
    } catch {}

    // Dog personality & status context
    let personalityContext = "";
    try {
      const tags = JSON.parse(dog.personality_tags || "[]");
      if (Array.isArray(tags) && tags.length > 0) {
        personalityContext = `Personnalité du chien : ${tags.join(", ")}.`;
      }
    } catch {}

    const statusMessages = {
      recovering: "⚠️ Ce chien est en convalescence. Évite les exercices intenses. Priorise le repos, l'alimentation douce et le suivi vétérinaire.",
      traveling: "Ce chien est en déplacement/voyage. Tiens compte du stress potentiel, des changements de routine et des précautions sanitaires de voyage.",
    };
    const statusContext = dog.status && dog.status !== "healthy" ? (statusMessages[dog.status] || "") : "";

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

    let systemPrompt;

    if (mode === "nutrition") {
      // Fetch recent food scans for nutrition mode
      let scansContext = "";
      try {
        const scans = await base44.asServiceRole.entities.FoodScan.filter({ dog_id: dogId });
        const recentScans = scans
          .sort((a, b) => new Date(b.timestamp || b.created_date) - new Date(a.timestamp || a.created_date))
          .slice(0, 5);
        if (recentScans.length > 0) {
          scansContext = "\nALIMENTS RÉCEMMENT SCANNÉS :\n" + recentScans.map(s =>
            `- ${s.food_name}: ${s.verdict === "safe" ? "sûr" : s.verdict === "caution" ? "à surveiller" : "toxique"} (score ${s.score}/10) - ${s.details || ""}`
          ).join("\n");
        }
      } catch (e) {
        console.warn("Failed to fetch food scans:", e.message);
      }

      systemPrompt = `Tu es NutriCoach, le coach nutrition canin expert de PawCoach. Tu donnes des conseils nutritionnels personnalisés, recommandes des marques d'aliments adaptées, et proposes des plans de repas.

PROFIL DU CHIEN :
- Nom : ${dog.name}
- Race : ${dog.breed || "Non renseignée"}
${ageStr ? `- Âge : ${ageStr}` : ""}
${dog.weight ? `- Poids : ${dog.weight} kg` : ""}
${dog.sex ? `- Sexe : ${dog.sex === "male" ? "Mâle" : "Femelle"}` : ""}
${dog.neutered !== undefined ? `- Stérilisé : ${dog.neutered ? "Oui" : "Non"}` : ""}
${dog.activity_level ? `- Niveau d'activité : ${dog.activity_level}` : ""}
${dog.allergies ? `- Allergies : ${dog.allergies || "aucune"}` : "- Allergies : aucune"}
${dog.health_issues ? `- Problèmes de santé : ${dog.health_issues}` : "- Problèmes de santé : aucun"}
${personalityContext ? `- ${personalityContext}` : ""}
${statusContext ? `- Statut : ${statusContext}` : ""}
${scansContext}

RÈGLES :
1) Tu es un COACH NUTRITION, pas vétérinaire.
2) Ne prescris jamais de traitements médicaux.
3) Pour les problèmes de santé sérieux, renvoie vers un vétérinaire.
4) Quand tu recommandes des marques, mentionne "Disponible sur Amazon/Zooplus".
5) Personnalise avec le prénom du chien.
6) Tutoiement, chaleureux, concis et structuré.
7) Utilise des emojis alimentaires.
${toneInstruction ? `\nTON : ${toneInstruction}` : ""}
${topicsInstruction ? `\nPRIORITÉS : ${topicsInstruction}` : ""}`;
    } else {
      systemPrompt = `Tu es PawCoach, un assistant IA spécialisé dans le bien-être canin. Tu donnes des conseils personnalisés sur la nutrition, le comportement et le dressage.

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
${personalityContext ? `- ${personalityContext}` : ""}
${statusContext ? `- Statut : ${statusContext}` : ""}

RÈGLES :
- Réponds en français, avec le tutoiement
- Sois chaleureux, utilise des émojis 🐾
- Personnalise tes réponses en fonction du profil ci-dessus
- Ne pose JAMAIS de diagnostic médical
- En cas de symptôme inquiétant, recommande toujours de consulter un vétérinaire
- Sois concis (2-3 paragraphes max)
${toneInstruction ? `\nTON : ${toneInstruction}` : ""}
${topicsInstruction ? `\nPRIORITÉS : ${topicsInstruction}` : ""}`;
    }

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