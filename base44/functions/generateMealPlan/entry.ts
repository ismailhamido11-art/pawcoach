import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const MONTHLY_FREE_LIMIT = 2;

Deno.serve(async (req) => {
  let step = 'init';
  try {
    const base44 = createClientFromRequest(req);

    step = 'auth';
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    step = 'parse_body';
    const { prompt, dogId } = await req.json();

    if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });
    if (!prompt || typeof prompt !== 'string') return Response.json({ error: 'prompt required' }, { status: 400 });
    if (prompt.length > 10000) return Response.json({ error: 'prompt too long' }, { status: 400 });

    // Verify dog ownership server-side
    step = 'dog_check';
    const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
    const dog = dogs?.[0];
    if (!dog) return Response.json({ error: 'Dog not found' }, { status: 400 });
    if (dog.owner !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Server-side quota check — non-fatal: if check fails, allow generation
    // (feature availability > strict quota enforcement on error)
    step = 'quota_check';
    const isPremium = user.is_premium || (user.trial_expires_at && new Date(user.trial_expires_at) > new Date());
    if (!isPremium) {
      try {
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
      } catch (quotaErr) {
        console.error('generateMealPlan: quota check failed, allowing generation:', quotaErr);
      }
    }

    // Call LLM server-side — response_json_schema guarantees structured JSON
    step = 'llm_call';
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          calories_per_day: { type: 'number' },
          quantity_summary: { type: 'string' },
          days: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'string' },
                morning: { type: 'object', properties: { food: { type: 'string' }, quantity: { type: 'string' } } },
                noon: { type: 'object', properties: { food: { type: 'string' }, quantity: { type: 'string' } } },
                evening: { type: 'object', properties: { food: { type: 'string' }, quantity: { type: 'string' } } },
              },
            },
          },
          supplements: { type: 'array', items: { type: 'string' } },
          avoid: { type: 'array', items: { type: 'string' } },
          tip: { type: 'string' },
          rationale: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    // Track generation for quota enforcement — non-fatal
    step = 'track';
    const planText = typeof llmResponse === 'string' ? llmResponse : JSON.stringify(llmResponse);
    let planId: string | null = null;
    try {
      const savedPlan = await base44.asServiceRole.entities.NutritionPlan.create({
        owner_email: user.email,
        dog_id: dogId,
        generated_at: new Date().toISOString(),
        plan_text: planText,
        is_active: false,
      });
      planId = savedPlan.id;
    } catch (trackErr) {
      console.error('generateMealPlan: quota tracking create failed:', trackErr);
    }

    return Response.json({ plan: llmResponse, planId });
  } catch (err: any) {
    console.error(`generateMealPlan FAILED at step=${step}:`, err?.message || err, err?.stack);
    return Response.json(
      { error: 'internal_error', _debug: { step, message: err?.message || 'unknown' } },
      { status: 500 },
    );
  }
});
