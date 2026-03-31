# PawCoach — Regles projet

## REGLE #1 — Build avant commit (ZERO EXCEPTION)

Avant chaque `git commit`, lancer :
```bash
npm run build
```
- Si le build echoue → corriger AVANT de commiter
- Si le build passe → commiter
- Mentionner "build OK" dans le commentaire de ticket

Cette regle existe parce que 3 hotfix d'imports casses ont ete necessaires (SKOA-32, SKOA-35, SKOA-37). Ca ne doit plus arriver.

## REGLE #2 — Verifier les imports avant de modifier un fichier partage

Quand tu modifies un fichier dans `lib/`, `utils/`, `api/`, ou `components/ui/` :
1. Chercher tous les fichiers qui importent depuis ce fichier :
   ```bash
   grep -r "from.*nom-du-fichier" src/ --include="*.jsx" --include="*.js" -l
   ```
2. Si tu ajoutes, renommes ou supprimes un export → mettre a jour CHAQUE fichier qui l'importe
3. Ne JAMAIS supposer que "ca marchera" — verifier

## REGLE #3 — CODEBASE_KNOWLEDGE.md

Le fichier `docs/CODEBASE_KNOWLEDGE.md` contient les regles metier, routes et dependances critiques.
- Le LIRE avant de modifier du code business
- Le METTRE A JOUR apres toute modification de regle metier (credits, premium, limites, quota)
- NE PAS mettre a jour pour du CSS, du style ou du rename

## Stack

- Frontend : React + Vite + Tailwind + Framer Motion
- Backend : Base44 (Deno functions dans `base44/functions/`)
- Design tokens : `src/lib/colorPalette.js`, `src/lib/animations.js`
- Animations : `src/lib/animations.js` (spring, springUI, springSnappy, springSoft, springGentle)
