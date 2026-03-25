# tasks.md — PawCoach Visual Polish
Dernière mise à jour: 2026-03-25
Statut global: TERMINÉ

## Contexte
PawCoach = app coach bien-être canin. ~34K lignes. React + Vite + Tailwind + shadcn/ui + Framer Motion + Lucide.
Design system dans index.css (cream bg + forest green #1A4D3E + emerald #2D9F82).
Composants existants: EmptyState (20 mascottes SVG), PawIllustrations (20), PawMascot (10 moods), StorysetIllustration (23 SVG), Illustration (12 CDN), LottieAnimation (~70 CDN), SkeletonPage (4 variants).

## Décisions prises
- Branche: polish/complete-v2
- Ne PAS modifier le design system, la logique métier, les API calls
- Utiliser les tokens CSS existants
- AutoAnimate uniquement sur les listes sans AnimatePresence existant

---

## PHASE 1 — FONDATIONS TECHNIQUES (COMPLÈTE)

- [x] SkeletonPage.jsx (Bone, SkeletonCard, SkeletonHero, SkeletonList, SkeletonStats, variants: list/stats/detail/chat)
- [x] .card-hover dans index.css
- [x] useCountUp.js (easeOutQuart, prefers-reduced-motion aware)
- [x] LottieAnimation.jsx (@lottiefiles/dotlottie-react)
- [x] lottieLibrary.js (~70 URLs CDN par catégorie)
- [x] 23 illustrations Storyset dans src/assets/illustrations/storyset/
- [x] StorysetIllustration.jsx component
- [x] 20 mascottes SVG dans PawIllustrations.jsx (8 originales + 12 nouvelles)
- [x] MASCOTS mappés dans EmptyState.jsx
- [x] Layout.jsx AnimatePresence mode="wait" + fadeIn
- [x] prefers-reduced-motion dans index.css + useReducedMotion hook (8 fichiers)
- [x] Animation presets dans animations.js (spring, fadeIn, springGentle, springSnappy, tapScale, etc.)

## PHASE 2 — CORRECTIONS COHÉRENCE (PARTIELLE)

- [x] Couleurs hardcodées corrigées dans home/* (ActiveProgramCards, ContentArticles, DailyCoaching, StreakBar, TodayCard, TrialExpiryBanner)
- [x] DogPublicProfile: couleurs hardcodées + EmptyState mascot="doctor" pour historique médical
- [x] Icônes: 100% Lucide React (aucun @heroicons, react-icons, ou @mui trouvé)
- [ ] Reste ~200 instances de couleurs sémantiques (emerald pour safe, purple pour premium, red pour toxic) — conservées intentionnellement

## PHASE 3 — SKELETONS (COMPLÈTE)

- [x] Home.jsx: SkeletonPage variant="stats"
- [x] Activite.jsx: SkeletonPage variant="stats"
- [x] Nutri.jsx: SkeletonPage variant="list"
- [x] Sante.jsx: SkeletonPage variant="stats"
- [x] Training.jsx: SkeletonPage variant="list"
- [x] Chat.jsx: SkeletonPage variant="chat"
- [x] Profile.jsx: SkeletonPage variant="detail"
- [x] DogProfile.jsx: SkeletonPage variant="detail"
- [x] Library.jsx: SkeletonPage variant="list"
- [x] Dashboard.jsx: SkeletonPage variant="stats"
- [x] VetPortal.jsx: SkeletonPage variant="list"
- [x] VetDogView.jsx: SkeletonPage variant="detail"
- [x] DogPublicProfile.jsx: SkeletonPage variant="detail"
- [x] Premium.jsx: custom skeleton (gradient + height bars)
- [x] Scan.jsx: custom inline skeleton (animate-pulse, matches layout)
- [x] Onboarding.jsx: pas besoin (page interactive immédiate)
- [x] Spinners remplacés par skeletons contextuels dans VideoCoaching, AIDiagnosisModal, ParkReviews, NutritionMealPlan, FoodComparator, FindVetContent
- [x] Spinners sur boutons de soumission conservés (feedback action)

## PHASE 4 — ANIMATIONS PAGE PAR PAGE (COMPLÈTE)

Toutes les 16 pages utilisent Framer Motion (174 occurrences motion.div).
28 fichiers utilisent des stagger delays (0.04-0.08s entre items).

- [x] Home.jsx: fadeIn + stagger quick actions (0.05s) + confetti milestones
- [x] Activite.jsx: fadeIn + breathing illustration + spring tab transitions + stagger tips
- [x] Nutri.jsx: fadeIn + tabVariants (slide horizontal) + msgAnim + spring + breathing
- [x] Sante.jsx: fadeIn + breathing + tab spring transitions
- [x] NotebookContent: stagger records (0.05s) + EmptyState + AutoAnimate
- [x] DiagnosisContent: stagger symptômes + slide-up résultats
- [x] GrowthTrackerContent: stagger + graphique transition width
- [x] HealthImportContent: stagger analyzing steps + spring transitions étapes
- [x] FindVetContent: stagger résultats (0.05s) + AutoAnimate
- [x] Training.jsx: stagger behavior steps + SkeletonPage + MilestoneScreen animations
- [x] Chat.jsx: msgAnim slide-up + Lottie typing + scroll smooth + EmptyState
- [x] Profile.jsx: stagger sections (0.05s) + AnimatePresence settings
- [x] DogProfile.jsx: stagger sections (0.05s gap) + modal scale
- [x] Onboarding.jsx: spring transitions + stagger goals + decorative orbs + progress bar
- [x] Library.jsx: AnimatePresence bookmarks + layout animation + breathing
- [x] Dashboard.jsx: stagger stats (0.07s) + stagger next steps (0.06s) + useCountUp
- [x] Scan.jsx: stagger listContainer (0.06s) + Lottie scanning + verdict slide
- [x] Premium.jsx: spring avatar + stagger features (0.07s) + trial banner
- [x] DogPublicProfile.jsx: stagger pills (0.07s) + alert scale
- [x] VetPortal.jsx: stagger dogs (0.06s) + whileHover stats + AutoAnimate
- [x] VetDogView.jsx: stagger records (0.04-0.05s)

## PHASE 5 — BOTTOM SHEETS & MODALS (COMPLÈTE)

- [x] PremiumNudgeSheet: AnimatePresence + motion.div + spring
- [x] PostTrialSheet: stagger + spring
- [x] HealthAssistantSheet: motion.div fadeIn
- [x] CombinedFAB: stagger fields + saved animation
- [x] MobileSelect: stagger options (delay i * 0.04)
- [x] WalkShareCard: animations existantes
- [x] ShareCard: animations existantes
- [x] ShareVetModal: motion transitions
- [x] AIDiagnosisModal: skeleton loading remplacé

## PHASE 6 — EMPTY STATES (COMPLÈTE)

20 fichiers utilisent EmptyState avec mascottes appropriées:
- [x] Chat: mascot="chat" + illustration="welcome"
- [x] Library: mascot="chat" + illustration="search"
- [x] VetPortal: mascot="doctor" + "Aucun patient"
- [x] VetDogView: mascot variés (doctor, curious) par section
- [x] DogPublicProfile: mascot="doctor" historique médical
- [x] NotebookContent: mascot="doctor" carnet vide
- [x] SectionVaccins: EmptyState vaccins
- [x] SectionPoids: EmptyState poids
- [x] PremiumSection: EmptyState premium
- [x] GrowthTrackerContent: EmptyState croissance
- [x] FindVetContent: mascot="doctor" + illustration
- [x] NutritionMealPlan: EmptyState plans
- [x] TrackerHistory: EmptyState historique
- [x] NearbyParks: EmptyState parcs
- [x] AchievementFeed: EmptyState badges
- [x] NotificationCenter: EmptyState notifications
- [x] VetNotesList: EmptyState notes
- [x] VetSection: EmptyState profil véto
- [x] Scan: EmptyState scan + Lottie + Storyset

## PHASE 7 — FINITIONS (COMPLÈTE)

- [x] @formkit/auto-animate installé
- [x] AutoAnimate appliqué: VetPortal (dogs), FindVetContent (résultats), NotebookContent (records)
- [x] Pas de conflit avec AnimatePresence existant (Library, SectionVaccins vérifiés)
- [x] Durées cohérentes vérifiées: micro 0.1-0.15s, fadeIn 0.24-0.3s, stagger 0.04-0.08s, springs 300-400/25-30, breathing 5s
- [x] prefers-reduced-motion: CSS + useReducedMotion dans 8 fichiers
- [x] Build passe (exit 0)
- [x] card-hover déployé sur cartes cliquables (ActiveProgramCards, JourneyView, etc.)

## PHASE 8 — RAPPORT (EN COURS)

- [x] tasks.md mis à jour avec état réel
- [ ] POLISH_REPORT.md mis à jour
- [ ] git push origin polish/complete-v2
