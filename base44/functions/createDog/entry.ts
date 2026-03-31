import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const FREE_DOG_LIMIT = 1;
const PREMIUM_DOG_LIMIT = 3;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const dogData = await req.json();

    // Server-side limit enforcement — free: 1 dog, premium: 3 dogs
    const isPremium = user.is_premium || (user.trial_expires_at && new Date(user.trial_expires_at) > new Date());
    const limit = isPremium ? PREMIUM_DOG_LIMIT : FREE_DOG_LIMIT;
    const existingDogs = await base44.asServiceRole.entities.Dog.filter({ owner: user.email });
    if ((existingDogs || []).length >= limit) {
      return Response.json({ error: 'dog_limit_reached', limit, current: (existingDogs || []).length }, { status: 429 });
    }

    // Force owner to authenticated user — prevents spoofing
    const dog = await base44.asServiceRole.entities.Dog.create({
      ...dogData,
      owner: user.email,
    });

    return Response.json({ dog });
  } catch (err) {
    console.error('createDog error:', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
});
