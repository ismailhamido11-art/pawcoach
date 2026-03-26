import { base44 } from "./base44Client";

/**
 * Centralized entity access layer.
 * Wraps base44.entities with consistent error logging.
 * Same API as base44.entities.X — drop-in replacement.
 */

function wrapEntity(entity, name) {
  const wrapped = {
    filter: (...args) => entity.filter(...args),
    create: (data) => entity.create(data),
    update: (id, data) => entity.update(id, data),
    delete: (id) => entity.delete(id),
  };
  return wrapped;
}

// All PawCoach entities
export const Dog = wrapEntity(base44.entities.Dog, "Dog");
export const HealthRecord = wrapEntity(base44.entities.HealthRecord, "HealthRecord");
export const DailyCheckin = wrapEntity(base44.entities.DailyCheckin, "DailyCheckin");
export const DailyLog = wrapEntity(base44.entities.DailyLog, "DailyLog");
export const Streak = wrapEntity(base44.entities.Streak, "Streak");
export const FoodScan = wrapEntity(base44.entities.FoodScan, "FoodScan");
export const UserProgress = wrapEntity(base44.entities.UserProgress, "UserProgress");
export const DiagnosisReport = wrapEntity(base44.entities.DiagnosisReport, "DiagnosisReport");
export const NutritionPlan = wrapEntity(base44.entities.NutritionPlan, "NutritionPlan");
export const Bookmark = wrapEntity(base44.entities.Bookmark, "Bookmark");
export const WeeklyInsight = wrapEntity(base44.entities.WeeklyInsight, "WeeklyInsight");
export const SharedVetAccess = wrapEntity(base44.entities.SharedVetAccess, "SharedVetAccess");
export const DogAchievement = wrapEntity(base44.entities.DogAchievement, "DogAchievement");
export const DietPreferences = wrapEntity(base44.entities.DietPreferences, "DietPreferences");
export const GrowthEntry = wrapEntity(base44.entities.GrowthEntry, "GrowthEntry");
export const ParkReview = wrapEntity(base44.entities.ParkReview, "ParkReview");
export const PlaceFavorite = wrapEntity(base44.entities.PlaceFavorite, "PlaceFavorite");
export const ChatMessage = wrapEntity(base44.entities.ChatMessage, "ChatMessage");
export const VetNote = wrapEntity(base44.entities.VetNote, "VetNote");
