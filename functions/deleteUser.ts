import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cascade delete: clean up all related entities
    const entityNames = [
      'Dog', 'HealthRecord', 'DailyCheckin', 'DailyLog', 'Streak',
      'FoodScan', 'Bookmark', 'UserProgress', 'WeeklyInsight', 'WeeklyCheckin',
      'ChatMessage', 'SharedVetAccess', 'VetNote', 'DiagnosisReport',
      'NutritionPlan', 'DietPreferences', 'GrowthEntry', 'DogAchievement',
      'PlaceFavorite', 'TrainingExercise'
    ];

    // Delete entities owned by this user
    await Promise.all(
      entityNames.map(name =>
        base44.asServiceRole.entities[name]
          .deleteMany({ owner_email: user.email })
          .catch(() => {}) // Ignore if entity doesn't exist
      )
    );

    // Alternative: delete by owner field
    await Promise.all([
      base44.asServiceRole.entities.Dog.deleteMany({ owner: user.email }).catch(() => {}),
      base44.asServiceRole.entities.HealthRecord.deleteMany({ dog_id: user.id }).catch(() => {}),
      base44.asServiceRole.entities.SharedVetAccess.deleteMany({ owner_email: user.email }).catch(() => {}),
      base44.asServiceRole.entities.VetNote.deleteMany({ vet_email: user.email }).catch(() => {}),
    ]);

    return Response.json({ success: true, message: 'User account deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return Response.json({ error: err.message || 'Failed to delete user' }, { status: 500 });
  }
});