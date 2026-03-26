# Phase 6 — Data Layer — CONTEXT

## Decision: Facade/wrapper pattern
Create src/api/entities.js that re-exports all Base44 entities through a thin wrapper.
The wrapper adds: console.error logging, standardized error messages.
Each entity keeps the EXACT same API (filter, create, update, delete).

## Decision: Migration is mechanical
Each file changes:
1. Add import: `import { Dog, HealthRecord, ... } from "@/api/entities"`
2. Replace: `base44.entities.Dog` → `Dog`, `base44.entities.HealthRecord` → `HealthRecord`, etc.
3. Keep `base44` import IF the file also uses `base44.auth` or `base44.functions`
4. Remove `base44` import IF the file ONLY used `base44.entities`

## Decision: Do NOT touch backend functions
Backend functions (base44/functions/) run in Deno, not in the browser. They use a different client pattern (createClientFromRequest). Leave them alone.

## Decision: Do NOT touch src/components/ui/
shadcn components — never modify.

## Entities to wrap (from codebase scan)
Dog, HealthRecord, DailyCheckin, DailyLog, Streak, FoodScan, UserProgress,
DiagnosisReport, NutritionPlan, Bookmark, WeeklyInsight, SharedVetAccess,
DogAchievement, ContentArticle, DietPreferences, WalkSession, TrainingProgram,
BehaviorProgram, ParkReview, NearbyPark

## Success criteria
1. Zero raw `base44.entities.` calls in src/ (except in entities.js itself)
2. npm run build passes
3. No visual or functional regression
