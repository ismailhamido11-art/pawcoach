# PawCoach Visual Polish

## Vision
Ajouter la couche emotionnelle visuelle sur toute l'app PawCoach — animations, skeletons, empty states, illustrations, Lottie, micro-interactions.

## Stack
React 18 + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Lucide React

## Constraints
- NE JAMAIS toucher la logique metier (API calls, hooks, routing, etats)
- NE JAMAIS modifier les couleurs du design system dans index.css
- NE JAMAIS supprimer du code fonctionnel
- Utiliser UNIQUEMENT les tokens CSS existants (--primary, --accent, etc.)
- npm run build DOIT passer sans erreur
- Respecter prefers-reduced-motion

## Assets disponibles
- 23 illustrations SVG Storyset recolorees #1A4D3E dans src/assets/illustrations/storyset/
- ~70 animations Lottie CDN dans src/lib/lottieLibrary.js
- 8 mascottes SVG dans PawIllustrations.jsx
- 10 mascottes JPG dans PawMascot.jsx
- 12 illustrations CDN dans Illustration.jsx
- SkeletonPage, LottieAnimation, EmptyState deja crees

## Architecture
16 pages, 5 sous-pages Sante, 7+ bottom sheets
