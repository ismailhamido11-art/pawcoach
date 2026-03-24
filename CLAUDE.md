# PawCoach — Run autonome de polish visuel

## Projet
PawCoach = SaaS coach bien-être canin. Mobile-first.
Stack: React 18 + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Lucide React.
Backend: Base44 (managé, pas de code backend).
Repo: github.com/ismailhamido11-art/pawcoach — branche: polish/visual-layer

## Design system (NE PAS MODIFIER)
- Primary: forest green #1A4D3E (HSL 160 50% 22%)
- Accent: emerald #2D9F82 (HSL 162 55% 42%)
- Background: cream off-white (HSL 37 33% 95%)
- Tokens CSS dans src/index.css — utiliser UNIQUEMENT les variables (--primary, --accent, --foreground, --muted, etc.)
- Dark mode supporté

## Architecture
- 16 pages dans src/pages/: Home, Activite, Nutri, Profile, Sante, Chat, Dashboard, DogProfile, DogPublicProfile, Library, Onboarding, Premium, Scan, Training, VetDogView, VetPortal
- Sante a 5 sous-pages: NotebookContent, DiagnosisContent, GrowthTrackerContent, HealthImportContent, FindVetContent
- 7+ bottom sheets: PremiumNudgeSheet, HealthAssistantSheet, CombinedFAB, MobileSelect, WalkShareCard, ShareCard, ShareVetModal
- Composants UI: src/components/ui/ (EmptyState, PawIllustrations, SkeletonPage, LottieAnimation)
- Illustrations: src/components/illustrations/Illustration.jsx (CDN GitHub) + src/assets/illustrations/storyset/ (23 SVGs recolorés #1A4D3E — DISPONIBLES)
- Mascottes: PawIllustrations.jsx (SVG) + PawMascot.jsx (JPG 10 moods)

## Mission
Ajouter la couche émotionnelle: animations, skeletons, empty states, illustrations, Lottie, transitions, micro-interactions.
Lire tasks.md pour la liste complète des tâches. Cocher [x] après chaque tâche terminée. Committer par phase.

## Règles absolues
1. NE JAMAIS toucher à la logique métier (appels API base44, hooks, routing, états)
2. NE JAMAIS modifier les couleurs du design system dans index.css
3. NE JAMAIS supprimer de code fonctionnel existant
4. TOUJOURS utiliser les tokens CSS existants (pas de couleurs hardcodées)
5. TOUJOURS committer après chaque phase
6. Si une erreur de build survient, la corriger IMMÉDIATEMENT avant de continuer
7. Les 23 illustrations Storyset sont dans src/assets/illustrations/storyset/ — les utiliser pour les empty states, onboarding, et écrans principaux
8. ~70 animations Lottie CDN sont dans src/lib/lottieLibrary.js — les utiliser pour loading, succès, erreurs, scan
9. Si un asset manque, utiliser les assets existants et noter dans MISSING_ASSETS.md

## Commandes
- npm run dev — serveur dev
- npm run build — build production (DOIT passer sans erreur)

## Style d'animation
- Micro-interactions (hover, active): 0.1-0.15s
- Entrées contenu (fadeIn): 0.2-0.35s ease-out
- Springs Framer: stiffness 300-400, damping 25-30
- Stagger entre items: 0.04-0.08s
- MAX 0.4s pour toute animation (sauf Lottie boucle)
- TOUJOURS respecter prefers-reduced-motion
