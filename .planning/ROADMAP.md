# Roadmap: PawCoach Visual Polish

## Overview

Ajouter la couche emotionnelle visuelle sur toute l'app PawCoach: animations Framer Motion, skeletons, empty states, illustrations Storyset, Lottie, micro-interactions.

## Phases

- [ ] **Phase 1: Setup & Fondations** - Completer fondations techniques manquantes
- [ ] **Phase 2: Corrections Coherence** - Unifier couleurs et icones vers design system
- [ ] **Phase 3: Skeletons Restants** - Remplacer tous les spinners restants
- [ ] **Phase 4: Animations Pages** - fadeIn, stagger, card-hover sur 16 pages
- [ ] **Phase 5: Bottom Sheets & Modals** - Polish animations des 7 sheets
- [ ] **Phase 6: Empty States** - Mascottes, illustrations Storyset, Lottie partout
- [ ] **Phase 7: Finitions** - Coherence, audit, polish, harden
- [ ] **Phase 8: Rapport & Push** - Rapport final et push branche

## Phase Details

### Phase 1: Setup & Fondations
**Goal**: Completer les fondations techniques manquantes: useCountUp hook, 12 nouvelles mascottes SVG, cleanup repo
**Depends on**: Nothing
**Success Criteria** (what must be TRUE):
  1. useCountUp hook existe dans src/hooks/useCountUp.js
  2. 12 nouvelles mascottes ajoutees dans PawIllustrations.jsx
  3. EmptyState.jsx mis a jour avec les nouvelles mascottes
  4. Repo clean (pas de fichiers .planning anciens, .argus, etc.)
**Plans**: TBD

### Phase 2: Corrections Coherence
**Goal**: Unifier couleurs hardcodees (slate, purple hors contexte) vers tokens design system, unifier icones vers Lucide
**Depends on**: Phase 1
**Success Criteria** (what must be TRUE):
  1. Zero couleur text-slate/bg-slate hors contexte semantique
  2. Zero import heroicons/react-icons/mui
  3. DogPublicProfile.jsx utilise EmptyState au lieu de brut
**Plans**: TBD

### Phase 3: Skeletons Restants
**Goal**: Remplacer tous les spinners restants par SkeletonPage sur les pages manquantes
**Depends on**: Phase 1
**Success Criteria** (what must be TRUE):
  1. Library.jsx utilise SkeletonPage variant="list"
  2. Zero animate-spin ou Loader2 spin restant dans src/pages/
**Plans**: TBD

### Phase 4: Animations Pages
**Goal**: Ajouter fadeIn contenu, stagger listes, card-hover cartes, active:scale boutons sur les 16 pages + 5 sous-pages Sante
**Depends on**: Phase 2, Phase 3
**Success Criteria** (what must be TRUE):
  1. Chaque page a motion.div fadeIn sur le contenu principal
  2. Listes ont stagger delay 0.04-0.08s
  3. Cartes cliquables ont card-hover
  4. prefers-reduced-motion respecte partout
**Plans**: TBD

### Phase 5: Bottom Sheets & Modals
**Goal**: Polish animations des 7 bottom sheets (PremiumNudge, HealthAssistant, CombinedFAB, MobileSelect, WalkShare, ShareCard, ShareVet)
**Depends on**: Phase 4
**Success Criteria** (what must be TRUE):
  1. Chaque sheet a stagger sur ses items
  2. CTA ont active:scale
  3. WalkShareCard a useCountUp sur stats
**Plans**: TBD

### Phase 6: Empty States
**Goal**: Chaque etat vide a un EmptyState avec mascotte + illustrations Storyset integrees + animations Lottie
**Depends on**: Phase 4
**Success Criteria** (what must be TRUE):
  1. Chaque condition length===0 montre un EmptyState avec mascotte
  2. Illustrations Storyset integrees dans onboarding, home, sante, nutrition, training
  3. Lottie integre sur loading, succes, erreurs, scan
**Plans**: TBD

### Phase 7: Finitions
**Goal**: Coherence durees animations, audit global, polish, harden, simplify
**Depends on**: Phase 5, Phase 6
**Success Criteria** (what must be TRUE):
  1. npm run build zero erreur
  2. Durees coherentes (micro:0.1-0.15s, entrees:0.2-0.35s)
  3. Audit Impeccable passe
**Plans**: TBD

### Phase 8: Rapport & Push
**Goal**: Generer POLISH_REPORT.md et push branche polish/visual-layer
**Depends on**: Phase 7
**Success Criteria** (what must be TRUE):
  1. POLISH_REPORT.md cree avec stats
  2. Branche polish/visual-layer pushee
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Setup & Fondations | 0/TBD | Not started | - |
| 2. Corrections Coherence | 0/TBD | Not started | - |
| 3. Skeletons Restants | 0/TBD | Not started | - |
| 4. Animations Pages | 0/TBD | Not started | - |
| 5. Bottom Sheets & Modals | 0/TBD | Not started | - |
| 6. Empty States | 0/TBD | Not started | - |
| 7. Finitions | 0/TBD | Not started | - |
| 8. Rapport & Push | 0/TBD | Not started | - |
