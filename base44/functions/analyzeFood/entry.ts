import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dogId, file_url } = await req.json();

    if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });
    if (!file_url || typeof file_url !== 'string') return Response.json({ error: 'file_url required' }, { status: 400 });

    // Verify dog ownership server-side
    const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
    const dog = dogs?.[0];
    if (!dog) return Response.json({ error: 'Dog not found' }, { status: 400 });
    if (dog.owner !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch diet preferences server-side
    const dietPrefs = await base44.asServiceRole.entities.DietPreferences.filter({ dog_id: dogId });
    const dislikedFoods = dietPrefs?.[0]?.disliked_foods || 'aucun';

    // Build age text
    let ageText = 'âge inconnu';
    if (dog.birth_date) {
      const months = Math.floor((Date.now() - new Date(dog.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30));
      ageText = months < 12 ? `${months} mois` : `${Math.floor(months / 12)} ans`;
    }

    const prompt = `Tu es PawCoach, expert en nutrition canine. Analyse cette étiquette ou photo d'aliment pour chien.
Chien : ${dog.name || 'chien'}, race : ${dog.breed || 'inconnue'}, âge : ${ageText}, poids : ${dog.weight ? dog.weight + 'kg' : 'inconnu'}, allergies : ${dog.allergies || 'aucune'}, aliments indésirables : ${dislikedFoods}, régime : ${dog.diet_type || 'inconnu'}.
Si un ingrédient correspond aux aliments indésirables, le signaler dans l'analyse.
Si l'image ne montre pas clairement un produit ou une étiquette lisible, utilise food_name = 'Produit non identifié', score = 0, summary = 'Image non lisible — essayez avec une photo plus nette de l\\'étiquette'.
Fournis une analyse nutritionnelle détaillée en JSON. Réponds UNIQUEMENT en français. Sois précis sur la composition.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          food_name: { type: 'string' },
          verdict: { type: 'string' },
          score: { type: 'number' },
          summary: { type: 'string' },
          pros: { type: 'array', items: { type: 'string' } },
          cons: { type: 'array', items: { type: 'string' } },
          details: { type: 'string' },
          recommendation: { type: 'string' },
          key_ingredients: { type: 'array', items: { type: 'string' } },
          allergen_alert: { type: 'boolean' },
        },
      },
    });

    return Response.json({ result });
  } catch (err) {
    console.error('analyzeFood error:', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
});
