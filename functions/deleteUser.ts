import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.3.1';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 0: Cancel Stripe subscription if any (best-effort — never blocks deletion)
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
      const subscriptionId = users[0]?.stripe_subscription_id;
      if (subscriptionId) {
        await stripe.subscriptions.cancel(subscriptionId);
        console.log(`Stripe subscription cancelled: ${subscriptionId}`);
      }
    } catch (stripeErr) {
      console.error('Stripe cancel failed (non-blocking):', stripeErr?.message || String(stripeErr));
    }

    // Step 1: Get all user's dogs to cascade delete child records
    const userDogs = await base44.asServiceRole.entities.Dog.filter({ owner: user.email });
    const dogIds = (userDogs || []).map((d: { id: string }) => d.id);

    // Step 2: Delete all dog-linked entities (using dog_id)
    if (dogIds.length > 0) {
      await Promise.all(dogIds.flatMap((dogId: string) => [
        base44.asServiceRole.entities.HealthRecord.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.DailyCheckin.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.DailyLog.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.Streak.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.FoodScan.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.DogAchievement.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.UserProgress.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.WeeklyInsight.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.ChatMessage.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.GrowthEntry.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.DiagnosisReport.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.NutritionPlan.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.DietPreferences.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.SharedVetAccess.deleteMany({ dog_id: dogId }).catch(() => {}),
        base44.asServiceRole.entities.VetNote.deleteMany({ dog_id: dogId }).catch(() => {}),
      ]));
    }

    // Step 3: Delete user-linked entities (using owner_email or owner)
    await Promise.all([
      base44.asServiceRole.entities.Dog.deleteMany({ owner: user.email }).catch(() => {}),
      base44.asServiceRole.entities.Bookmark.deleteMany({ owner: user.email }).catch(() => {}),
      base44.asServiceRole.entities.PlaceFavorite.deleteMany({ owner: user.email }).catch(() => {}),
      base44.asServiceRole.entities.SharedVetAccess.deleteMany({ owner_email: user.email }).catch(() => {}),
      base44.asServiceRole.entities.VetNote.deleteMany({ vet_email: user.email }).catch(() => {}),
    ]);

    return Response.json({ success: true, message: 'User account deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return Response.json({ error: err?.message || 'Failed to delete user' }, { status: 500 });
  }
});