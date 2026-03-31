import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const MONTHLY_FREE_LIMIT = 2;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, dogId } = await req.json();

    if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });
    if (!prompt || typeof prompt !== 'string') return Response.json({ error: 'prompt required' }, { status: 400 });
    if (prompt.length > 10000) return Response.json({ error: 'prompt too long' }, { status: 400 });

    // Verify dog ownership server-side
    const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
    const dog = dogs?.[0];
    if (!dog) return Response.json({ error: 'Dog not found' }, { status: 400 });
    if (dog.owner !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Server-side quota check
    const isPremium = user.is_premium || (user.trial_expires_at && new Date(user.trial_expires_at) > new Date());
    if (!isPremium) {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const allPlans = await base44.asServiceRole.entities.NutritionPlan.filter({
        owner_email: user.email,
      });
      const plansThisMonth = (allPlans || []).filter(
        (p: any) => p.generated_at && p.generated_at >= monthStart
      );
      if (plansThisMonth.length >= MONTHLY_FREE_LIMIT) {
        return Response.json({ error: 'monthly_limit_reached', remaining: 0 }, { status: 429 });
      }
    }

    // Call LLM server-side
    const llmResponse = await base44.integrations.Core.InvokeLLM({ prompt });

    return Response.json({ plan: llmResponse });
  } catch (err) {
    console.error('generateMealPlan error:', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
});
