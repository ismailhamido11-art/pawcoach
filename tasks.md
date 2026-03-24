# tasks.md — PawCoach Visual Polish
Dernière mise à jour: 2026-03-24
Statut global: EN ATTENTE

## Contexte
PawCoach = app coach bien-être canin. ~32K lignes. React + Vite + Tailwind + shadcn/ui + Framer Motion + Lucide.
Design system existant dans index.css (cream bg + forest green #1A4D3E + emerald #2D9F82).
Composants existants: EmptyState (8 mascottes SVG), PawIllustrations, PawMascot (10 moods JPG), Illustration (12 SVG CDN).
Mission: AJOUTER la couche émotionnelle sans toucher à la logique métier ni au design system.

## Approches échouées (NE PAS RETENTER)
- (aucune pour l'instant)

## Décisions prises
- Travailler sur branche polish/visual-layer
- Ne PAS modifier les couleurs du design system
- Ne PAS modifier la logique métier, API calls, hooks, routing
- Utiliser les assets existants + nouvelles mascottes SVG + Lottie (src/lib/lottieLibrary.js existe — ~70 URLs CDN organisées par catégorie)
- Les illustrations Storyset SONT disponibles dans src/assets/illustrations/storyset/ (23 SVGs recolorés #1A4D3E): welcome, vet-checkup, feeding, running, training, walking, playing, achievement, community, health-record, examination, diagnosis, growth, healthy-food, cooking, meal-plan, calendar, search, premium, onboarding-1, error, no-results, success
- Installer @lottiefiles/dotlottie-react pour le player Lottie

---

## PHASE -1 — NETTOYAGE REPO (faire AVANT tout)

- [ ] Supprimer dossier .planning/ entier: rm -rf .planning/
- [ ] Supprimer CONTEXT-PROMPT.md: rm -f CONTEXT-PROMPT.md
- [ ] Supprimer dossier .argus/: rm -rf .argus/
- [ ] Supprimer .claude/audit/: rm -rf .claude/audit/
- [ ] Supprimer docs/benchmark-concurrentiel.md et docs/swot-analysis.md (garder docs/ si d'autres fichiers utiles)
- [ ] Vérifier qu'aucun fichier utile n'a été supprimé: git status
- [ ] git commit -am "chore: clean up old planning/audit files"

## PHASE 0 — SETUP (faire en premier)

- [ ] Créer branche: git checkout -b polish/visual-layer
- [ ] Installer plugins: /plugin marketplace add anthropics/claude-plugins-official && /plugin install ralph-wiggum@claude-plugins-official
- [ ] Installer Impeccable: /plugin marketplace add pbakaus/impeccable
- [ ] Installer packages npm: npm install @formkit/auto-animate @lottiefiles/dotlottie-react --save
- [ ] Configurer Impeccable: /teach-impeccable (app=PawCoach coach canin, audience=propriétaires chiens FR 25-45 ans, couleur=#1A4D3E, accent=#2D9F82, stack=React+Vite+Tailwind+shadcn+Framer+Lucide)
- [ ] Lancer audit initial: /audit → sauvegarder résultat dans AUDIT_INITIAL.md
- [ ] git commit -am "chore: setup design tools"

## PHASE 1 — FONDATIONS TECHNIQUES

- [ ] Créer src/components/ui/SkeletonPage.jsx (Bone, SkeletonCard, SkeletonHero, SkeletonList, SkeletonStats, SkeletonPage avec variants: list, stats, detail, chat)
- [ ] Ajouter .card-hover dans index.css (@layer components): transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]
- [ ] Créer src/hooks/useCountUp.js (end, duration=600 → nombre incrémental)
- [ ] Créer src/components/ui/LottieAnimation.jsx (props: src, size, loop, autoplay — utiliser dotlottie-player CDN ou @lottiefiles/dotlottie-react)
- [ ] Vérifier que src/lib/lottieLibrary.js existe (créé par Cowork shopping) — il DOIT être là (~70 URLs Lottie CDN)
- [ ] Copier les 23 illustrations Storyset de storyset/ vers src/assets/illustrations/storyset/ (welcome.svg, vet-checkup.svg, feeding.svg, running.svg, training.svg, walking.svg, playing.svg, achievement.svg, community.svg, health-record.svg, examination.svg, diagnosis.svg, growth.svg, healthy-food.svg, cooking.svg, meal-plan.svg, calendar.svg, search.svg, premium.svg, onboarding-1.svg, error.svg, no-results.svg, success.svg)
- [ ] Ajouter 12 nouvelles mascottes SVG dans PawIllustrations.jsx: DogSleepy, DogRunner, DogEating, DogCamera, DogHeart, DogStar, DogQuestion, DogCalendar, DogWalking, DogReading, DogCrown, DogSad (même style que les 8 existantes: viewBox 200x200, ombre ellipse, prop color)
- [ ] Mettre à jour MASCOTS dans EmptyState.jsx avec les 12 nouvelles mascottes
- [ ] Modifier Layout.jsx: AnimatePresence mode="wait" + motion.div fadeIn sur {children} + Suspense fallback=SkeletonPage
- [ ] Ajouter prefers-reduced-motion dans index.css si absent
- [ ] git commit -am "feat: design foundations"

## PHASE 2 — CORRECTIONS COHÉRENCE

- [ ] grep -rn "text-slate-\|bg-slate-" src/pages/ src/components/ --include="*.jsx" → remplacer par tokens design system (foreground, muted-foreground, muted, secondary)
- [ ] grep -rn "text-purple-\|bg-purple-\|border-purple-" src/ --include="*.jsx" → évaluer: contexte premium=laisser, sinon=tokens
- [ ] grep -rn "text-emerald-\|bg-emerald-" src/ --include="*.jsx" → évaluer: sémantique succès/safe=laisser, sinon=accent/primary
- [ ] Corriger spécifiquement DogPublicProfile.jsx (couleurs hardcodées slate/purple → tokens)
- [ ] DogPublicProfile.jsx: remplacer l'empty state ShieldCheck brut par EmptyState mascot="doctor"
- [ ] grep -rn "import.*from.*@heroicons\|import.*from.*react-icons\|import.*from.*@mui" src/ → remplacer par Lucide si trouvé
- [ ] git commit -am "fix: color consistency + icon unification"

## PHASE 3 — SKELETONS (remplacer TOUS les spinners)

- [ ] Home.jsx: loading → SkeletonPage variant="stats"
- [ ] Activite.jsx: loading → SkeletonPage variant="stats"
- [ ] Nutri.jsx: loading → SkeletonPage variant="list"
- [ ] Sante.jsx: loading → SkeletonPage variant="stats" + skeleton onglets
- [ ] Training.jsx: loading → SkeletonPage variant="list"
- [ ] Chat.jsx: loading → SkeletonPage variant="chat"
- [ ] Profile.jsx: loading → SkeletonPage variant="detail"
- [ ] DogProfile.jsx: loading → SkeletonPage variant="detail"
- [ ] Library.jsx: loading → SkeletonPage variant="list"
- [ ] Dashboard.jsx: loading → SkeletonPage variant="stats"
- [ ] VetPortal.jsx: loading → SkeletonPage variant="list"
- [ ] VetDogView.jsx: loading → SkeletonPage variant="detail"
- [ ] grep -rn "animate-spin\|Loader2.*className.*spin\|Chargement\.\.\." src/ --include="*.jsx" → remplacer tout spinner restant
- [ ] git commit -am "feat: skeleton loading on all pages"

## PHASE 4 — ANIMATIONS PAGE PAR PAGE (appliquer pour chaque: fadeIn contenu, stagger listes, card-hover cartes cliquables, boutons active:scale)

- [ ] Home.jsx + DogRadarHero + DailyBriefing + InlineCheckin
- [ ] Activite.jsx + composants tracker/*
- [ ] Nutri.jsx + NutritionMealPlan + DietPreferencesPanel + FoodComparator
- [ ] Sante.jsx (onglets principaux: smooth highlight + fadeIn contenu)
- [ ] NotebookContent.jsx + SectionVaccins + SectionPoids + HealthScoreCard + VaccineCard + WeightCard + StatusPills + NextActionCard
- [ ] DiagnosisContent.jsx (symptômes stagger, résultat diagnostic slide-up)
- [ ] GrowthTrackerContent.jsx (graphique animation dessin progressif)
- [ ] HealthImportContent.jsx (transitions étapes SELECT→ANALYZING→REVIEW→SUCCESS, stagger ANALYZING_STEPS)
- [ ] FindVetContent.jsx (résultats PlaceCard stagger)
- [ ] Training.jsx + VideoCoaching + MilestoneScreen (barre progression animation width)
- [ ] Chat.jsx (bulles slide-up, typing dots pulse, scroll smooth)
- [ ] Profile.jsx + SettingsSection (card-hover items settings, photo absente→mascotte)
- [ ] DogProfile.jsx (infos stagger, photo absente→mascotte "happy")
- [ ] Onboarding.jsx (slide gauche/droite entre étapes, illustration différente par étape, dots progression animés)
- [ ] Library.jsx (bookmarks stagger, filtre actif bg transition)
- [ ] Dashboard.jsx (StatCards stagger + useCountUp sur chiffres)
- [ ] Scan.jsx (état initial→illustration, scan en cours→animation, résultat→slide-up)
- [ ] Premium.jsx (features stagger, vérifier CTA animation)
- [ ] DogPublicProfile.jsx (cohérence avec DogProfile)
- [ ] VetPortal.jsx (dossiers stagger, empty→mascotte "doctor")
- [ ] VetDogView.jsx (cohérence)
- [ ] git commit -am "feat: animations on all pages"

## PHASE 5 — BOTTOM SHEETS & MODALS

- [ ] PremiumNudgeSheet: features stagger (delay i*0.06), CTA active:scale
- [ ] HealthAssistantSheet: contenu fadeIn
- [ ] CombinedFAB: fields stagger à l'ouverture, state "saved" animation succès
- [ ] MobileSelect: vérifier stagger existant cohérent
- [ ] WalkShareCard: stats useCountUp, boutons active:scale
- [ ] ShareCard (scan): verdict slide-up, boutons active:scale
- [ ] ShareVetModal: vérifier animations
- [ ] git commit -am "feat: polish bottom sheets and modals"

## PHASE 6 — EMPTY STATES EXHAUSTIFS

- [ ] grep -rn "length === 0\|\.length < 1\|\.length === 0" src/pages/ src/components/ --include="*.jsx" | head -80 → pour chaque: vérifier EmptyState avec mascotte
- [ ] grep -rn "catch\|setError\|toast.error" src/pages/ src/components/ --include="*.jsx" | head -80 → pour chaque erreur: si page vide après→ajouter EmptyState + bouton Réessayer
- [ ] Sante sous-pages: vérifier CHAQUE onglet vide (Journal, Vaccins, Visites, Poids, Médoc., Notes)
- [ ] Chat vide → EmptyState mascot="chat" + "Posez votre première question"
- [ ] VetPortal vide → mascot="doctor"
- [ ] Library vide → illustration ou mascotte adaptée
- [ ] Scan état initial → mascotte "camera" ou "detective"
- [ ] Activite aucune balade → mascotte "runner"
- [ ] Intégrer les illustrations Storyset (DISPONIBLES dans src/assets/illustrations/storyset/) dans les écrans principaux: Onboarding (onboarding-1.svg, welcome.svg), Home premier lancement (welcome.svg), Santé (vet-checkup.svg, health-record.svg, examination.svg, diagnosis.svg), Nutrition (feeding.svg, healthy-food.svg, cooking.svg, meal-plan.svg), Training (training.svg, running.svg), Activité (walking.svg, playing.svg), Erreur (error.svg), Pas de résultat (no-results.svg, search.svg), Succès (success.svg, achievement.svg), Premium (premium.svg), Community (community.svg), Calendar (calendar.svg), Growth (growth.svg)
- [ ] Intégrer les animations Lottie (si lottieLibrary.js disponible) dans: Suspense fallback (loading chien), succès actions (confetti), erreurs (sad), scan en cours (radar), chat IA réflexion (typing)
- [ ] git commit -am "feat: exhaustive empty states + illustrations + lottie"

## PHASE 7 — FINITIONS

- [ ] Installer AutoAnimate: appliquer useAutoAnimate sur listes dynamiques (Home chiens, Library bookmarks, NotebookContent records, FindVetContent résultats, VetPortal dossiers) — SAUF si Framer AnimatePresence déjà en place
- [ ] grep -rn "duration:" src/ --include="*.jsx" --include="*.css" → vérifier cohérence durées (micro:0.1-0.15s, entrées:0.2-0.35s, springs:300-400/25-30, stagger:0.04-0.08s)
- [ ] Lancer /audit (Impeccable) → comparer avec AUDIT_INITIAL.md
- [ ] Lancer /polish (Impeccable) pour un pass global
- [ ] Lancer /harden (Impeccable) pour robustesse (focus states, edge cases)
- [ ] Lancer /simplify pour cleanup final (3 agents parallèles)
- [ ] npm run build → vérifier ZERO erreurs
- [ ] git commit -am "feat: finitions + audit impeccable"

## PHASE 8 — RAPPORT & PUSH

- [ ] Créer POLISH_REPORT.md: nombre fichiers modifiés, pages polies, assets utilisés, ce qui manque, audit initial vs final
- [ ] git add -A && git commit -am "docs: polish report"
- [ ] git push origin polish/visual-layer
- [ ] Écrire dans tasks.md: Statut global: TERMINÉ + date

---

## QUAND RELANCER (si session interrompue)
Lire ce fichier. Les tâches [x] sont faites. Reprendre à la première [ ] non cochée.
