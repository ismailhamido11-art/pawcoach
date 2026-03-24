# PawCoach — Lancer le polish visuel avec GSD-2

## ÉTAPE 1 — Installer GSD-2 (une seule fois)

```
npm install -g gsd-pi@latest
```

## ÉTAPE 2 — Commit de sécurité

```
cd C:\Users\smalt\Desktop\app-chien-ia\pawcoach
git add -A
git commit -m "pre-gsd: setup visual polish assets"
```

## ÉTAPE 3 — Lancer GSD

```
gsd
```

Au premier lancement il te demande ton provider (choisis Anthropic) et ta clé API. Ensuite colle cette description de projet :

```
PawCoach est une app React coach bien-être canin (React 18 + Vite + Tailwind + shadcn/ui + Framer Motion + Lucide).

MISSION : Ajouter la couche émotionnelle visuelle sur toute l'app — animations Framer Motion (fadeIn, stagger, springs), skeletons de chargement sur les 16 pages, empty states avec mascottes SVG et illustrations Storyset, animations Lottie (loading, succès, erreurs, scan), micro-interactions (hover, active, card-hover), transitions de page avec AnimatePresence.

ASSETS DISPONIBLES :
- 23 illustrations SVG Storyset recolorées #1A4D3E dans src/assets/illustrations/storyset/
- ~70 animations Lottie CDN dans src/lib/lottieLibrary.js
- 8 mascottes SVG existantes dans PawIllustrations.jsx
- 10 mascottes JPG dans PawMascot.jsx
- 12 illustrations CDN dans Illustration.jsx

RÈGLES ABSOLUES :
- NE JAMAIS toucher la logique métier (appels API, hooks, routing, états)
- NE JAMAIS modifier les couleurs du design system dans index.css
- NE JAMAIS supprimer du code fonctionnel
- Utiliser UNIQUEMENT les tokens CSS existants (--primary, --accent, etc.)
- npm run build DOIT passer sans erreur après chaque tâche
- Respecter prefers-reduced-motion

ARCHITECTURE : 16 pages, 5 sous-pages Santé, 7+ bottom sheets. Voir CLAUDE.md pour les détails.
```

## ÉTAPE 4 — Lancer le mode autonome

```
/gsd auto
```

Et c'est tout. GSD va :
- Analyser le code
- Découper en milestones → slices → tâches
- Exécuter chaque tâche avec un contexte frais
- Commit automatiquement
- Récupérer des crashes tout seul
- Avancer jusqu'à la fin

## SI ÇA S'ARRÊTE

Relance simplement :
```
gsd
/gsd auto
```
Il reprend où il en était grâce au dossier .gsd/

## QUAND C'EST FINI

```
npm run build
git log --oneline -20
```
