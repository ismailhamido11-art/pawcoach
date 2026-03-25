# Roadmap: PawCoach Visual Layer (Partie Visible)

## Overview

Integrer les illustrations Storyset, animations Lottie, et mascottes sur les ecrans principaux pour un changement visuel concret et immediat.

## Phases

- [ ] **Phase 1: Illustrations Storyset** - Ajouter les 23 SVG sur les ecrans principaux
- [ ] **Phase 2: Animations Lottie** - Integrer Lottie sur loading, succes, erreurs, scan
- [ ] **Phase 3: Push & Verification** - Build, push, verification visuelle browser

## Phase Details

### Phase 1: Illustrations Storyset
**Goal**: Integrer les illustrations SVG Storyset sur les ecrans principaux — changement visuel immediat et concret
**Depends on**: Nothing
**Success Criteria** (what must be TRUE):
  1. Chat.jsx hero utilise illustration Storyset au lieu du CDN actuel ou en complement
  2. Scan.jsx etat initial affiche illustration search ou feeding
  3. Activite.jsx section vide balade affiche illustration walking ou playing
  4. Training.jsx hero utilise illustration training
  5. Premium.jsx hero enrichi avec illustration premium
  6. Sante symptomes utilise illustration examination ou diagnosis
  7. Nutrition scanner utilise illustration feeding ou healthy-food
  8. Dashboard section poids vide utilise illustration growth
  9. Library vide utilise illustration search ou no-results
**Plans**: TBD

### Phase 2: Animations Lottie
**Goal**: Integrer les animations Lottie CDN sur les moments cles (loading IA, succes actions, scan en cours)
**Depends on**: Phase 1
**Success Criteria** (what must be TRUE):
  1. Chat.jsx typing indicator utilise Lottie loading.dots au lieu des divs bounce
  2. Scan.jsx etat scanning utilise Lottie loading.general
  3. Succes check-in/actions affiche Lottie success.checkmark
  4. Dashboard useCountUp sur les 4 stat cards
**Plans**: TBD

### Phase 3: Push & Verification
**Goal**: Build final, push, verification visuelle dans le browser
**Depends on**: Phase 2
**Success Criteria** (what must be TRUE):
  1. npm run build zero erreur
  2. git push origin main reussi
  3. Verification visuelle de chaque page modifiee dans le browser
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Illustrations Storyset | 0/TBD | Not started | - |
| 2. Animations Lottie | 0/TBD | Not started | - |
| 3. Push & Verification | 0/TBD | Not started | - |
