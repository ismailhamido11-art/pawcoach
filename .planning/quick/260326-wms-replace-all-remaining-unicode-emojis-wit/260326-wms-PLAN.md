---
phase: quick-emoji-cleanup
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  # Wave 1 — Shared data files (consumed by other files)
  - src/components/achievements/badgeUtils.jsx
  - src/components/profile/AchievementsSection.jsx
  # Wave 2 — Standalone pages & components (no cross-deps, fully parallel)
  - src/components/achievements/AchievementFeed.jsx
  - src/components/activite/AITrainingProgram.jsx
  - src/components/dogprofile/DogEditModal.jsx
  - src/components/dogprofile/DogIdentityCards.jsx
  - src/components/dogprofile/DogPersonalitySection.jsx
  - src/components/dogprofile/DogProfileHero.jsx
  - src/components/dogprofile/DogTrophiesRow.jsx
  - src/components/home/EmotionalTip.jsx
  - src/components/nutrition/FoodComparator.jsx
  - src/components/onboarding/WelcomeScreen.jsx
  - src/components/profile/CoachSettings.jsx
  - src/components/profile/SettingsSection.jsx
  - src/components/profile/WalkReminderSettings.jsx
  - src/components/sante/DiagnosisContent.jsx
  - src/components/sante/FindVetContent.jsx
  - src/components/sante/HealthImportContent.jsx
  - src/components/scan/ShareCard.jsx
  - src/components/tracker/NearbyParks.jsx
  - src/components/tracker/ParkReviews.jsx
  - src/components/tracker/TrackerHistory.jsx
  - src/components/tracker/WalkMode.jsx
  - src/components/tracker/WalkShareCard.jsx
  - src/components/training/ExerciseDetail.jsx
  - src/components/training/FreeExercisesGate.jsx
  - src/components/training/JourneyView.jsx
  - src/components/training/MilestoneScreen.jsx
  - src/components/vet/AIDiagnosisModal.jsx
  - src/components/vet/DiagnosisStep2Questions.jsx
  - src/components/vet/ShareVetModal.jsx
  - src/components/vet/VetDogCard.jsx
  - src/components/vet/VetNoteForm.jsx
  - src/components/WellnessBanner.jsx
  - src/lib/PageNotFound.jsx
  - src/pages/Activite.jsx
  - src/pages/DogProfile.jsx
  - src/pages/DogPublicProfile.jsx
  - src/pages/Onboarding.jsx
  - src/pages/Premium.jsx
  - src/pages/Scan.jsx
  - src/pages/Training.jsx
  - src/pages/VetDogView.jsx
autonomous: true
requirements: [EMOJI-CLEANUP]
must_haves:
  truths:
    - "Zero unicode emoji remaining in src/ (excluding components/ui/)"
    - "All icons render as Lucide React vector SVGs with Nature Premium palette colors"
    - "Data objects use {Icon: LucideComponent, color: 'text-xxx'} pattern instead of {emoji: 'X'}"
    - "App builds without errors after all replacements"
  artifacts:
    - path: "src/components/achievements/badgeUtils.jsx"
      provides: "Badge icon mappings consumed by AchievementFeed, AchievementsSection, DogTrophiesRow"
      contains: "import.*from.*lucide-react"
    - path: "src/components/dogprofile/DogPersonalitySection.jsx"
      provides: "Personality trait icons"
      contains: "import.*from.*lucide-react"
    - path: "src/pages/Training.jsx"
      provides: "Exercise and program icons"
      contains: "import.*from.*lucide-react"
  key_links:
    - from: "src/components/achievements/badgeUtils.jsx"
      to: "src/components/profile/AchievementsSection.jsx"
      via: "shared badge definitions"
      pattern: "Icon.*lucide"
    - from: "src/components/achievements/badgeUtils.jsx"
      to: "src/components/dogprofile/DogTrophiesRow.jsx"
      via: "trophy icon rendering"
      pattern: "Icon.*lucide"
---

<objective>
Replace ALL remaining unicode emojis (245 occurrences across 43 files) in pawcoach/src/ with Lucide React vector icons.

Purpose: Consistent cross-platform rendering, Nature Premium visual identity, no more broken/inconsistent emoji display across devices.
Output: Zero unicode emojis in codebase, all replaced with properly colored Lucide icons.
</objective>

<context>
@src/components/achievements/badgeUtils.jsx
@src/components/profile/AchievementsSection.jsx
@src/pages/Training.jsx
@src/components/activite/AITrainingProgram.jsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace emojis in shared data files and badge system (Wave 1 — must go first)</name>
  <files>
    src/components/achievements/badgeUtils.jsx
    src/components/profile/AchievementsSection.jsx
  </files>
  <action>
These two files define badge/achievement data consumed by other components. Fix them first because DogTrophiesRow.jsx and AchievementFeed.jsx read from these.

**badgeUtils.jsx (12 emoji lines)**

Change the data structure from `emoji: "X"` to `Icon: LucideComponent, color: "text-xxx"`. Add lucide-react import at top.

Mapping:
- `"🐾"` (first_walk) -> `Icon: PawPrint, color: "text-emerald-600"`
- `"👟"` (walk_30min) -> `Icon: Footprints, color: "text-emerald-600"`
- `"📅"` (walk_7days) -> `Icon: Calendar, color: "text-blue-600"`
- `"🏅"` (walk_marathon) -> `Icon: Medal, color: "text-amber-600"`
- `"✨"` (first_program) -> `Icon: Sparkles, color: "text-violet-500"`
- `"🎓"` (training_3programs) -> `Icon: GraduationCap, color: "text-indigo-600"`
- `"🔥"` (streak_3) -> `Icon: Flame, color: "text-orange-500"`
- `"⚡"` (streak_7) -> `Icon: Zap, color: "text-amber-500"`
- `"👑"` (streak_30) -> `Icon: Crown, color: "text-amber-600"`
- `"⭐"` (points_100) -> `Icon: Star, color: "text-amber-500"`
- `"🌟"` (points_500) -> `Icon: Star, color: "text-amber-400"` (use Star, distinguish by color)
- `"💎"` (points_1000) -> `Icon: Diamond, color: "text-violet-500"`

Export a small helper if needed: `export function renderBadgeIcon(badge, size = 16) { const I = badge.Icon; return <I className={\`w-\${size/4} h-\${size/4} \${badge.color}\`} />; }`

**AchievementsSection.jsx (18 emoji lines)**

Same badge data (lines 9-23) — apply identical mapping. Also fix the level emojis (lines 43-47):
- `"🐶"` (Chiot) -> `Icon: Dog, color: "text-emerald-500"`
- `"🐕"` (Compagnon) -> `Icon: Dog, color: "text-emerald-600"`
- `"🦮"` (Sportif) -> `Icon: Dog, color: "text-blue-600"` (use Dog, vary color)
- `"🏅"` (Champion) -> `Icon: Medal, color: "text-amber-500"`
- `"👑"` (Legende) -> `Icon: Crown, color: "text-amber-600"`

Line 315 fallback `"🎯"` -> render `<Target className="w-4 h-4 text-emerald-600" />`

Everywhere these data objects are rendered (where `{badge.emoji}` or `{level.emoji}` appears in JSX), replace with: `<badge.Icon className={\`w-N h-N \${badge.color}\`} />` (adjust size to match current text-base/text-lg/text-xl sizing — text-base ~ w-4 h-4, text-lg ~ w-5 h-5, text-xl ~ w-5 h-5, text-2xl ~ w-6 h-6, text-3xl ~ w-8 h-8).

Import from lucide-react: `{ PawPrint, Footprints, Calendar, Medal, Sparkles, GraduationCap, Flame, Zap, Crown, Star, Diamond, Dog, Target }`
  </action>
  <verify>
    <automated>cd /c/Users/smalt/Desktop/app-chien-ia/pawcoach && node -e "const fs=require('fs');['src/components/achievements/badgeUtils.jsx','src/components/profile/AchievementsSection.jsx'].forEach(f=>{const c=fs.readFileSync(f,'utf8');const m=c.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FABF}\u{2600}-\u{27BF}]/gu);if(m)console.log('FAIL:',f,m);else console.log('OK:',f)})"</automated>
  </verify>
  <done>badgeUtils.jsx and AchievementsSection.jsx have zero unicode emojis, all replaced with Lucide Icon components with Nature Premium colors, exported renderBadgeIcon helper available</done>
</task>

<task type="auto">
  <name>Task 2: Replace emojis in dogprofile, tracker, training components (Wave 2a — 16 files)</name>
  <files>
    src/components/achievements/AchievementFeed.jsx
    src/components/dogprofile/DogEditModal.jsx
    src/components/dogprofile/DogIdentityCards.jsx
    src/components/dogprofile/DogPersonalitySection.jsx
    src/components/dogprofile/DogProfileHero.jsx
    src/components/dogprofile/DogTrophiesRow.jsx
    src/components/tracker/NearbyParks.jsx
    src/components/tracker/ParkReviews.jsx
    src/components/tracker/TrackerHistory.jsx
    src/components/tracker/WalkMode.jsx
    src/components/tracker/WalkShareCard.jsx
    src/components/training/ExerciseDetail.jsx
    src/components/training/FreeExercisesGate.jsx
    src/components/training/JourneyView.jsx
    src/components/training/MilestoneScreen.jsx
    src/pages/Training.jsx
  </files>
  <action>
Read each file, replace ALL unicode emojis with Lucide icons. Follow the mapping rules strictly.

**DogPersonalitySection.jsx (10 emoji lines)** — Personality traits data:
- `"🎾"` joueur -> `Icon: Target, color: "text-emerald-600"`
- `"😌"` calme -> `Icon: Leaf, color: "text-emerald-500"`
- `"🐾"` sociable -> `Icon: Users, color: "text-blue-600"`
- `"😟"` craintif -> `Icon: ShieldAlert, color: "text-amber-500"`
- `"🍖"` gourmand -> `Icon: Bone, color: "text-amber-600"`
- `"😤"` tetu -> `Icon: Anchor, color: "text-slate-600"`
- `"⚡"` energique -> `Icon: Zap, color: "text-amber-500"`
- `"🤗"` calin -> `Icon: HeartHandshake, color: "text-rose-500"`
- `"🦁"` independant -> `Icon: Compass, color: "text-slate-600"`
- `"😰"` anxieux -> `Icon: CloudRain, color: "text-blue-400"`

Render: replace `{trait.emoji}` with `<trait.Icon className="w-5 h-5 {trait.color}" />`

**DogProfileHero.jsx (3 emoji lines)** — Status badges:
- `"💪"` healthy -> `Icon: Heart, color: "text-emerald-600"`
- `"🩹"` recovering -> `Icon: Stethoscope, color: "text-emerald-600"`
- `"✈️"` traveling -> `Icon: Plane, color: "text-blue-600"`

**DogEditModal.jsx (1 line)** — `"🐕"` -> `<Dog className="w-8 h-8 text-[#1A4D3E]" />`

**DogIdentityCards.jsx (2 lines)**:
- `"🐾 Male"/"🐾 Femelle"` (L22, unused variable _sexLabel — if truly unused, remove the line; if used, replace with inline icon)
- `"♂"/"♀"` (L46) — these are standard text symbols not emojis. Keep as-is OR replace with Lucide icons if they match the emoji regex. Check: if `♂`/`♀` trigger the regex, replace with text "M"/"F" styled with appropriate colors.

**DogTrophiesRow.jsx (12 emoji lines)** — Trophy data uses same pattern as badgeUtils. Replace all emoji fields:
- `"🔥"` -> `Icon: Flame, color: "text-orange-500"`
- `"⚡"` -> `Icon: Zap, color: "text-amber-500"`
- `"🏅"` -> `Icon: Medal, color: "text-amber-600"`
- `"🐾"` -> `Icon: PawPrint, color: "text-emerald-600"`
- `"👟"` -> `Icon: Footprints, color: "text-emerald-600"`
- `"📅"` -> `Icon: Calendar, color: "text-blue-600"`
- `"✨"` -> `Icon: Sparkles, color: "text-violet-500"`
- `"🎓"` -> `Icon: GraduationCap, color: "text-indigo-600"`
- `"🔍"` -> `Icon: Search, color: "text-blue-500"`
- `"🧪"` -> `Icon: FlaskConical, color: "text-violet-500"`
- `"💎"` -> `Icon: Diamond, color: "text-violet-500"`
Render each `{trophy.emoji}` as `<trophy.Icon className="w-4 h-4 {trophy.color}" />`

**AchievementFeed.jsx (1 line)** — `{a.badge_emoji || "🏅"}` -> `{a.badge_emoji ? <span>{a.badge_emoji}</span> : <Medal className="w-4 h-4 text-amber-500" />}`
WAIT — `a.badge_emoji` comes from DB data which may still contain emoji strings. For now, replace only the fallback. The DB emoji rendering is a separate concern. Replace: `{a.badge_emoji || "🏅"}` with a helper that checks if badge_emoji matches a known badge and renders the Icon, else falls back to `<Medal />`.

**TrackerHistory.jsx (4 lines)**:
- L14 MOOD_EMOJIS: `super: "😊"` -> `super: Smile`, `good: "👍"` -> `good: ThumbsUp`, `calm: "😐"` -> `calm: Meh`, `hard: "😤"` -> `hard: Frown`
  Change to `{ super: { Icon: Smile, color: "text-emerald-500" }, good: { Icon: ThumbsUp, color: "text-emerald-600" }, calm: { Icon: Meh, color: "text-slate-400" }, hard: { Icon: Frown, color: "text-amber-500" } }`
  Render: wherever `MOOD_EMOJIS[x]` appears, use `<MOOD_EMOJIS[x].Icon className="w-4 h-4 {MOOD_EMOJIS[x].color}" />`
- L162 `"✅"` -> `<CheckCircle className="w-4 h-4 text-emerald-600" />`
- L182 `"🔥"` -> `<Flame className="w-3 h-3 text-orange-500" />`
- L190 `"🏆"/"🎯"` -> `weeklyWalks >= WEEKLY_GOAL ? <Trophy className="w-5 h-5 text-amber-500" /> : <Target className="w-5 h-5 text-emerald-600" />`

**WalkMode.jsx (10 lines)**:
- L17-20 mood options: same as TrackerHistory mapping (Smile, ThumbsUp, Meh, Frown)
- L456 `"🐕"` -> `<Dog className="w-5 h-5 text-[#1A4D3E]" />`
- L512 `"⏸ EN PAUSE"` -> `<Pause className="w-4 h-4 inline" /> EN PAUSE`
- L584 `"🐾"` -> `<PawPrint className="w-4 h-4 text-emerald-600" />`
- L609 `"🦴"` -> `<Bone className="w-3.5 h-3.5 text-amber-600" />`
- L616/L706 `"✓"` — these are plain text checkmarks, not emojis. If they trigger the regex, replace with `<Check className="w-3 h-3 text-emerald-600" />`. If not triggered, leave.

**WalkShareCard.jsx (6 lines)** — Share card data:
- `"🏆"` -> `Icon: Trophy, color: "text-amber-500"`
- `"🎯"` -> `Icon: Target, color: "text-emerald-600"`
- `"🐾"` -> `Icon: PawPrint, color: "text-blue-500"`
- `"🐕"` -> `Icon: Dog, color: "text-slate-400"`
- L162 `"🦴"` -> `<Bone className="w-3.5 h-3.5 text-amber-600 inline" />`
- L176 `"🐾"` -> `<PawPrint style={{width:14,height:14}} className="text-emerald-600 inline" />`

**NearbyParks.jsx (2 lines)** — Paw rating display:
- `"🐾".repeat(paws)` -> render paws as: `Array.from({length: paws}).map((_, i) => <PawPrint key={i} className="w-3 h-3 text-emerald-600 inline" />)`
- Same pattern for the `"○"` unfilled paws: `Array.from({length: 3-paws}).map((_, i) => <PawPrint key={i} className="w-3 h-3 text-slate-200 inline" />)`

**ParkReviews.jsx (3 lines)** — Same paw rating pattern as NearbyParks. Replace `.repeat()` with mapped PawPrint icons.

**Training.jsx (25 lines)** — Exercises and programs data. Each entry already has an `icon` field with Lucide component AND an `emoji` field. Remove the `emoji` field entirely since `icon` already exists. If `emoji` is rendered anywhere, switch to the existing `icon` field. For program entries (lines 38-140) that only have `emoji`, add `Icon` field:
- `"🐾"` -> `Icon: PawPrint`
- `"🛡️"` -> `Icon: Shield`
- `"🤝"` -> `Icon: Handshake`
- `"🦮"` -> `Icon: Dog`
- `"😤"` -> `Icon: Anchor`
- `"📢"` -> `Icon: Megaphone`
- `"😰"` -> `Icon: CloudRain`
- `"🎆"` -> `Icon: Sparkles`
- L420 `"🔒"` -> `<Lock className="w-5 h-5 text-slate-400" />`
- L454/L526/L532/L551 `"✕"/"✓"` — plain text marks. If triggered by regex, replace with `<X className="w-3 h-3 text-red-600" />` and `<Check className="w-3 h-3 text-emerald-600" />`. If not triggered, leave.
- L698 `"🐾"` -> `<PawPrint className="w-6 h-6 text-emerald-600" />`

**ExerciseDetail.jsx (1 line)** — `"🎉"` in button text -> `<PartyPopper className="w-4 h-4 inline" />`

**FreeExercisesGate.jsx (4 lines)**:
- L11 `"📣"` -> `Icon: Megaphone, color: "text-red-500"`
- L12 `"🤝"` -> `Icon: Handshake, color: "text-emerald-600"`
- L13 `"🎾"` -> `Icon: Target, color: "text-emerald-600"`
- L74 `"👑"` -> `<Crown className="w-4 h-4 text-amber-500 inline" />`

**JourneyView.jsx (1 line)** — `{exercise.emoji || "🐾"}` -> `{exercise.Icon ? <exercise.Icon className="w-4 h-4 text-emerald-600" /> : <PawPrint className="w-4 h-4 text-emerald-600" />}`

**MilestoneScreen.jsx (4 lines)**:
- L26 share text with emojis in template literal — replace `🐾` with `[paw]`, `✅` with `[v]`, `🏆` with `[trophy]` (text-only context, no JSX icons needed for share strings). Or better: keep simple text markers that work in all platforms. Use plain text: remove emoji from share string, use dashes or bullets instead.
- L35 `_milestoneEmoji` variable — if unused (prefixed with `_`), remove it. If used, replace with Icon component selection.
- L71 `"🐾"` in text -> `<PawPrint className="w-3 h-3 text-emerald-600 inline" />`
- L82 `"🚀"` in button -> `<Rocket className="w-4 h-4 inline" />` (import Rocket from lucide-react... wait, no Rocket in lucide. Use `ArrowRight` or `ChevronRight` instead) -> `Continuer <ArrowRight className="w-4 h-4 inline" />`

For ALL files: import only the Lucide icons actually used. Size Lucide icons to match the surrounding text size (text-base ~ w-4 h-4, text-lg ~ w-5 h-5, text-xl ~ w-5 h-5, text-2xl ~ w-6 h-6, text-3xl ~ w-8 h-8). Add `inline` or `inline-block` when icon is in text flow.
  </action>
  <verify>
    <automated>cd /c/Users/smalt/Desktop/app-chien-ia/pawcoach && node -e "const fs=require('fs');const files=['src/components/achievements/AchievementFeed.jsx','src/components/dogprofile/DogEditModal.jsx','src/components/dogprofile/DogIdentityCards.jsx','src/components/dogprofile/DogPersonalitySection.jsx','src/components/dogprofile/DogProfileHero.jsx','src/components/dogprofile/DogTrophiesRow.jsx','src/components/tracker/NearbyParks.jsx','src/components/tracker/ParkReviews.jsx','src/components/tracker/TrackerHistory.jsx','src/components/tracker/WalkMode.jsx','src/components/tracker/WalkShareCard.jsx','src/components/training/ExerciseDetail.jsx','src/components/training/FreeExercisesGate.jsx','src/components/training/JourneyView.jsx','src/components/training/MilestoneScreen.jsx','src/pages/Training.jsx'];let fail=0;files.forEach(f=>{const c=fs.readFileSync(f,'utf8');const m=c.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FABF}\u{2600}-\u{27BF}]/gu);if(m){console.log('FAIL:',f,m);fail++}else console.log('OK:',f)});process.exit(fail)"</automated>
  </verify>
  <done>All 16 files have zero unicode emojis. Lucide icons render with correct Nature Premium colors. Personality traits, trophies, moods, training exercises all use vector icons.</done>
</task>

<task type="auto">
  <name>Task 3: Replace emojis in pages, health, scan, vet, remaining components (Wave 2b — 27 files)</name>
  <files>
    src/components/activite/AITrainingProgram.jsx
    src/components/home/EmotionalTip.jsx
    src/components/nutrition/FoodComparator.jsx
    src/components/onboarding/WelcomeScreen.jsx
    src/components/profile/CoachSettings.jsx
    src/components/profile/SettingsSection.jsx
    src/components/profile/WalkReminderSettings.jsx
    src/components/sante/DiagnosisContent.jsx
    src/components/sante/FindVetContent.jsx
    src/components/sante/HealthImportContent.jsx
    src/components/scan/ShareCard.jsx
    src/components/vet/AIDiagnosisModal.jsx
    src/components/vet/DiagnosisStep2Questions.jsx
    src/components/vet/ShareVetModal.jsx
    src/components/vet/VetDogCard.jsx
    src/components/vet/VetNoteForm.jsx
    src/components/WellnessBanner.jsx
    src/lib/PageNotFound.jsx
    src/pages/Activite.jsx
    src/pages/DogProfile.jsx
    src/pages/DogPublicProfile.jsx
    src/pages/Onboarding.jsx
    src/pages/Premium.jsx
    src/pages/Scan.jsx
    src/pages/VetDogView.jsx
  </files>
  <action>
Read each file, replace ALL unicode emojis with Lucide icons. Follow the mapping rules strictly.

**AITrainingProgram.jsx (30 lines)** — Largest file. Multiple data objects:
- L17-18 ACTIVITY_ICONS: `"🐾"` -> `PawPrint`, `"🎾"` -> `Target`, `"🧠"` -> `Brain`, `"💆"` -> `Flower2`, `"💤"` -> `Moon`, `"🎯"` -> `Target`
  Change to: `{ balade: { Icon: PawPrint, color: "text-emerald-600" }, jeu: { Icon: Target, color: "text-emerald-600" }, ... }`
  Render: wherever `ACTIVITY_ICONS[x]` is used as text, replace with `<Icon className="w-4 h-4 {color}" />`
- L25-30 goals: same Icon/color pattern. `"❤️"` -> `Heart, "text-rose-500"`, `"⚡"` -> `Zap, "text-amber-500"`, `"🧘"` -> `Flower2, "text-emerald-500"`, `"🏋️"` -> `Dumbbell, "text-blue-600"`, `"🧠"` -> `Brain, "text-violet-500"`, `"🎯"` -> `Target, "text-emerald-600"`
- L34-38 satisfaction: `"😕"` -> `Frown, "text-slate-400"`, `"🙂"` -> `Meh, "text-slate-500"`, `"😊"` -> `Smile, "text-emerald-500"`, `"😄"` -> `Laugh, "text-emerald-600"`, `"🤩"` -> `Star, "text-amber-500"`
- L44-52 feedback emojis: `"🌟"` -> `Star, "text-amber-400"`, `"💪"` -> `Dumbbell, "text-emerald-600"`, `"🌱"` -> `Sprout, "text-emerald-500"`, `"🐾"` -> `PawPrint, "text-emerald-600"`
- L85 fallback `"🐶"` -> `<Dog className="w-4 h-4 text-[#1A4D3E]" />`
- L121, L159 `"📖"` -> `<BookOpen className="w-3 h-3 text-amber-700 inline" />`
- L196 celebration emojis array -> `[PartyPopper, Star, PawPrint, Dumbbell, Trophy]` with matching colors, render as `<Icon className="w-6 h-6 text-amber-500" />`
- L227 `"🎉"` -> `<PartyPopper className="w-6 h-6 text-amber-500" />`
- L796-801 feature list: `"📋"` -> `ClipboardList`, `"📖"` -> `BookOpen`, `"💡"` -> `Lightbulb`, `"👀"` -> `Eye`, `"⭐"` -> `Star`, `"🐕"` -> `Dog`
- L960 `"🐕"` -> `<Dog className="w-4 h-4 text-[#1A4D3E] inline" />`

**EmotionalTip.jsx (5 lines)** — Category icons:
- `"🏃"` activite -> `Icon: Footprints, color: "text-emerald-600"`
- `"🥕"` nutrition -> `Icon: Carrot, color: "text-orange-500"`
- `"💚"` sante -> `Icon: Heart, color: "text-emerald-600"`
- `"🐾"` bien-etre -> `Icon: PawPrint, color: "text-[#1A4D3E]"`
- L43 render: replace `<span className="text-2xl">{icon}</span>` with `<Icon className="w-6 h-6 {color}" />`

**FoodComparator.jsx (4 lines)** — Inline text emojis:
- L314 `"✅ Avantages"` -> `<CheckCircle className="w-3 h-3 text-emerald-700 inline" /> Avantages`
- L327 `"❌ Inconvenients"` -> `<XCircle className="w-3 h-3 text-red-700 inline" /> Inconvenients`
- L339 `"💡"` -> `<Lightbulb className="w-3 h-3 text-primary inline" />`
- L440 `"🎯"` -> `<Target className="w-3 h-3 text-primary inline" />`

**WelcomeScreen.jsx (1 line)** — `"🎉"` -> `<PartyPopper className="w-6 h-6 text-amber-500" />`

**CoachSettings.jsx (7 lines)** — Settings options data:
- `"🌟"` encouraging -> `Icon: Star, color: "text-amber-400"`
- `"🎯"` direct -> `Icon: Target, color: "text-emerald-600"`
- `"📚"` pedagogical -> `Icon: BookOpen, color: "text-blue-600"`
- `"❤️"` health -> `Icon: Heart, color: "text-rose-500"`
- `"🥩"` nutrition -> `Icon: Bone, color: "text-amber-600"`
- `"🎾"` training -> `Icon: Target, color: "text-emerald-600"`
- `"🧠"` behavior -> `Icon: Brain, color: "text-violet-500"`

**SettingsSection.jsx (2 lines)**:
- L78 `"🐾"` in text -> `<PawPrint className="w-3 h-3 text-emerald-600 inline" />`
- L130 `"👋"` in toast string -> remove emoji from string, toast is text-only. Use: `toast.success('Compte supprime', { description: 'Au revoir !' })`

**WalkReminderSettings.jsx (1 line)** — `"🐾"` in toast -> remove emoji. `toast.success(val ? \`Rappel active a \${time}\` : "Rappel desactive")`

**DiagnosisContent.jsx (9 lines)** — Symptom data:
- `"🤮"` Vomissements -> `Icon: Frown, color: "text-amber-500"` (no Vomit icon — use closest)
- `"💩"` Diarrhee -> `Icon: AlertTriangle, color: "text-amber-500"`
- `"😴"` Fatigue -> `Icon: Moon, color: "text-blue-400"`
- `"🍽️"` Perte appetit -> `Icon: Utensils, color: "text-slate-400"`
- `"🐾"` Boite -> `Icon: PawPrint, color: "text-amber-500"`
- `"👁️"` Probleme oculaire -> `Icon: Eye, color: "text-blue-500"`
- `"😤"` Respiration -> `Icon: Wind, color: "text-blue-400"` (import Wind from lucide-react)
- `"🩸"` Saignement -> `Icon: Droplets, color: "text-red-500"` (import Droplets)
- L82 `"🚨"` -> `<AlertTriangle className="w-4 h-4 text-red-600 inline" />`

**FindVetContent.jsx (1 line)** — `"📞"` -> `<Phone className="w-3 h-3 text-emerald-600 inline" />`

**HealthImportContent.jsx (5 lines)**:
- L195 `"🔒"` -> `<Lock className="w-3 h-3 text-muted-foreground inline" />`
- L246 `"🤖"` -> `<Bot className="w-3.5 h-3.5 text-primary inline" />` (import Bot)
- L287 `"📅"` -> `<Calendar className="w-3 h-3 text-primary inline" />`
- L288 `"⚠️"` -> `<AlertTriangle className="w-3 h-3 text-red-600 inline" />`
- L315 `"🎉"` -> `<PartyPopper className="w-5 h-5 text-amber-500 inline" />`

**ShareCard.jsx (4 lines)** — Share card verdict data:
- `"✅"` safe -> `Icon: CheckCircle, color: "#34d399"`
- `"⚠️"` caution -> `Icon: AlertTriangle, color: "#fbbf24"`
- `"💀"` toxic -> `Icon: Skull, color: "#f87171"`
- L146 `"🐾"` -> render `<PawPrint style={{width:16,height:16}} className="text-emerald-600" />`

**AIDiagnosisModal.jsx (2 lines)** and **DiagnosisStep2Questions.jsx (1 line)** — `"✓"` in styled div. These are text checkmarks inside green circles. Replace with `<Check className="w-3 h-3" />` (import Check from lucide-react).

**ShareVetModal.jsx (8 lines)** — Health data categories:
- `"💉"` vaccine -> `Icon: Syringe, color: "text-emerald-600"`
- `"⚖️"` weight -> `Icon: Scale, color: "text-blue-600"`
- `"🏥"` vet_visit -> `Icon: Hospital, color: "text-red-500"` (Hospital not in lucide — use `Building2` with `"text-red-500"`)
- `"💊"` medication -> `Icon: Pill, color: "text-violet-500"`
- `"📝"` note -> `Icon: FileText, color: "text-slate-600"`
- `"📊"` checkins -> `Icon: BarChart3, color: "text-blue-500"`
- `"📷"` scans -> `Icon: Camera, color: "text-emerald-600"`
- `"🩺"` diagnosis -> `Icon: Stethoscope, color: "text-emerald-700"`

**VetDogCard.jsx (1 line)** — `"🐾"` -> `<PawPrint className="w-7 h-7 text-primary" />`

**VetNoteForm.jsx (5 lines)** — Note type labels with inline emojis:
- `"🔍 Observation"` -> render `<Search className="w-3.5 h-3.5 inline" /> Observation`
- `"💡 Recommandation"` -> `<Lightbulb className="w-3.5 h-3.5 inline" /> Recommandation`
- `"💊 Prescription"` -> `<Pill className="w-3.5 h-3.5 inline" /> Prescription`
- `"📅 Suivi a prevoir"` -> `<Calendar className="w-3.5 h-3.5 inline" /> Suivi a prevoir`
- L75 `"⚠️"` -> `<AlertTriangle className="w-3 h-3 text-red-600 inline" />`
NOTE: These are inside `label` strings of a data array. Since labels are rendered as text in a select/dropdown, you cannot embed JSX. Instead: remove emoji from label string, and if these labels are rendered in JSX elsewhere, add an `Icon` field and render it alongside the label text.

**WellnessBanner.jsx (1 line)** — `"🐾"` in text -> `<PawPrint className="w-3.5 h-3.5 text-emerald-600 inline" />`

**PageNotFound.jsx (1 line)** — `"🐾"` -> `<PawPrint className="w-12 h-12 text-[#1A4D3E]" />`

**Activite.jsx (9 lines)** — Tab data already has `icon` field with Lucide. Remove `emoji` field. For lines 272-277 tips:
- `"💡"` -> `<Lightbulb className="w-3.5 h-3.5 text-primary inline" />`
- `"⏱️"` -> `Icon: Timer, color: "text-primary"`
- `"🎯"` -> `Icon: Target, color: "text-primary"`
- `"🍖"` -> `Icon: Bone, color: "text-primary"`
- `"📅"` -> `Icon: Calendar, color: "text-primary"`

**DogProfile.jsx (1 line)** — `"🐾"` in template literal (share text) -> remove emoji, use plain text prefix.

**DogPublicProfile.jsx (2 lines)**:
- L133 `"🚨"` in text -> `<AlertTriangle className="w-4 h-4 text-red-600 inline" />`
- L203 `"⚠️"` -> `<AlertTriangle className="w-4 h-4 text-red-700 inline" />`

**Onboarding.jsx (3 lines)**:
- L81 feature tags `"🤖 IA personnalisee"` etc — these are in an array rendered as text tags. Remove emojis from strings, add Icon field: `{label: "IA personnalisee", Icon: Bot}`, `{label: "Suivi quotidien", Icon: BarChart3}`, `{label: "Carnet sante", Icon: Stethoscope}`, `{label: "NutriCoach", Icon: Utensils}`
- L341 `"✓"` -> `<Check className="w-5 h-5" />`
- L391 `"🎙️"` -> `<Mic className="w-4 h-4 inline" />` (import Mic)

**Premium.jsx (1 line)** — `"🔥"` in text -> `<Flame className="w-4 h-4 text-orange-500 inline" />`

**Scan.jsx (15 lines)** — Verdict labels and inline text:
- L32 `"✅ Sans danger"` -> strip emoji, add Icon field: `{ Icon: CheckCircle, color: "text-emerald-600", label: "Sans danger" }`
- L41 `"⚠️ Avec precaution"` -> `{ Icon: AlertTriangle, color: "text-amber-600", label: "Avec precaution" }`
- L50 `"💀 TOXIQUE"` -> `{ Icon: Skull, color: "text-red-600", label: "TOXIQUE" }`
- L439 `"🚨"` -> `<AlertTriangle className="w-4 h-4 text-red-600 inline" />`
- L497 `"📸"` -> `<Camera className="w-3.5 h-3.5 inline" />`
- L498 `"🏷️"` -> `<Tag className="w-3.5 h-3.5 inline" />` (import Tag)
- L621/L633/L815/L856 `"⚠️"` -> `<AlertTriangle className="w-3 h-3 text-red-600 inline" />`
- L637 `"😱"` -> `Oui` (remove emoji, exclamation sufficient)
- L647/L865 `"💡"` -> `<Lightbulb className="w-3 h-3 text-primary inline" />`
- L676 `"✅"` -> `<CheckCircle className="w-3 h-3 text-emerald-600 inline" />`
- L850 `"✅"` -> `<CheckCircle className="w-3 h-3 text-emerald-700 inline" />`

**VetDogView.jsx (7 lines)**:
- L81 `"🐾"` -> `<PawPrint className="w-8 h-8 text-white" />`
- L85 `"♂"/"♀"` -> text "M"/"F" or keep if not emoji
- L86 `"⚠️"` -> `<AlertTriangle className="w-3 h-3 text-white/70 inline" />`
- L164 `"😊"` -> `<Smile className="w-3 h-3 text-emerald-500 inline" />`
- L165 `"⚡"` -> `<Zap className="w-3 h-3 text-amber-500 inline" />`
- L166 `"🍽️"` -> `<Utensils className="w-3 h-3 text-blue-500 inline" />`
- L210 verdict: `"✅ Sur"/"⚠️ Precaution"/"🚫 Toxique"` -> inline icons `<CheckCircle/>`, `<AlertTriangle/>`, `<XCircle/>` with matching colors

For ALL files: import only icons actually used. Match icon size to surrounding text. Add `inline` class when icon is in text flow. For toast/share strings (plain text contexts), simply remove the emoji — no icon replacement possible in pure strings.
  </action>
  <verify>
    <automated>cd /c/Users/smalt/Desktop/app-chien-ia/pawcoach && node -e "const fs=require('fs');const path=require('path');const emojiRe=/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FABF}\u{2600}-\u{27BF}]/gu;function scan(dir){let fails=0;const entries=fs.readdirSync(dir,{withFileTypes:true});for(const e of entries){const p=path.join(dir,e.name);if(e.isDirectory()){if(e.name==='node_modules'||e.name==='ui')continue;fails+=scan(p)}else if(/\\.jsx?$/.test(e.name)){const c=fs.readFileSync(p,'utf8');const m=c.match(emojiRe);if(m){console.log('FAIL:',p,[...new Set(m)]);fails++}}}return fails}const f=scan('src');console.log(f?f+' FILES STILL HAVE EMOJIS':'ALL CLEAR — zero emojis in src/');process.exit(f)"</automated>
  </verify>
  <done>All 25 remaining files have zero unicode emojis. Every Lucide icon uses Nature Premium palette. App builds clean.</done>
</task>

</tasks>

<verification>
1. Run the full emoji scan: zero matches across all of src/ (excluding components/ui/)
2. Run `npm run build` — zero errors
3. Spot-check key pages in browser: Training, DogProfile, Activite, Scan — icons render correctly with proper colors
</verification>

<success_criteria>
- Zero unicode emojis in src/**/*.{js,jsx} (excluding components/ui/)
- All 245 emoji occurrences replaced with Lucide React icons
- Icons use Nature Premium palette (forest #1A4D3E, emerald #2D9F82, amber for warnings)
- Data objects use {Icon: Component, color: "text-xxx"} pattern
- Toast/share strings have emojis removed (no icon replacement in pure text)
- npm run build passes
</success_criteria>

<output>
After completion, verify with full scan + build.
</output>
