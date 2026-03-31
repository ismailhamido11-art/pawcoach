import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dogId, productA, productB } = await req.json();

    if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });
    if (!productA || !productB) return Response.json({ error: 'productA and productB required' }, { status: 400 });

    // Verify dog ownership server-side
    const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
    const dog = dogs?.[0];
    if (!dog) return Response.json({ error: 'Dog not found' }, { status: 400 });
    if (dog.owner !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch diet preferences server-side
    const dietPrefs = await base44.asServiceRole.entities.DietPreferences.filter({ dog_id: dogId });
    const dislikedFoods = dietPrefs?.[0]?.disliked_foods || 'aucun';

    const nameA = productA.food_name || 'Produit A';
    const nameB = productB.food_name || 'Produit B';

    const prompt = `Tu es PawCoach, expert nutrition canine. Compare ces deux produits pour le chien ${dog.name || 'ce chien'} (${dog.breed || ''}, ${dog.weight ? dog.weight + 'kg' : ''}, allergies : ${dog.allergies || 'aucune'}, aliments indésirables : ${dislikedFoods}).

Produit A — ${nameA} (score ${productA.score}/10)
- Points forts : ${(productA.pros || []).join(', ')}
- Points faibles : ${(productA.cons || []).join(', ')}
- Composition : ${productA.details}

Produit B — ${nameB} (score ${productB.score}/10)
- Points forts : ${(productB.pros || []).join(', ')}
- Points faibles : ${(productB.cons || []).join(', ')}
- Composition : ${productB.details}

Le champ winner doit valoir EXACTEMENT 'A' ou 'B', rien d'autre.
Fournis une comparaison personnalisée avec un verdict clair. Réponds en JSON, en français, en tutoyant l'utilisateur.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          winner: { type: 'string' },
          winner_name: { type: 'string' },
          winner_reason: { type: 'string' },
          comparison_summary: { type: 'string' },
          product_a_analysis: { type: 'string' },
          product_b_analysis: { type: 'string' },
          recommendation: { type: 'string' },
        },
      },
    });

    return Response.json({ result });
  } catch (err) {
    console.error('compareFoods error:', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
});
