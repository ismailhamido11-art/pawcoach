---
phase: 05
plan: 01
subsystem: accessibility
tags: [a11y, aria, keyboard-nav, screen-reader]
dependency_graph:
  requires: []
  provides: [A11Y-01, A11Y-02]
  affects: [BottomNav, Chat, DogProfile, Training, NearbyParks, Notebook, Premium]
tech_stack:
  added: []
  patterns: [aria-label, tabIndex, role=button, onKeyDown]
key_files:
  created:
    - .planning/phases/05-a11y/05-01-PLAN.md
    - .planning/phases/05-a11y/05-01-SUMMARY.md
  modified:
    - src/pages/DogProfile.jsx
    - src/pages/Chat.jsx
    - src/pages/Training.jsx
    - src/components/activite/AITrainingProgram.jsx
    - src/components/dogprofile/DogEditModal.jsx
    - src/components/home/CoachHomeHeader.jsx
    - src/components/notebook/SectionPoids.jsx
    - src/components/notebook/SectionVaccins.jsx
    - src/components/notebook/VaccineCard.jsx
    - src/components/notebook/WeightCard.jsx
    - src/components/premium/PostTrialSheet.jsx
    - src/components/premium/PremiumNudgeSheet.jsx
    - src/components/tracker/NearbyParks.jsx
    - src/components/training/CelebrationScreen.jsx
    - src/components/vet/AIDiagnosisModal.jsx
decisions:
  - "Overlays/backdrops (motion.div fermant un dialog) exclus de A11Y-02 car le bouton Fermer explicite est toujours présent dans le dialog"
  - "aria-label en français pour tous les labels (Fermer, Supprimer, Modifier, etc.)"
  - "aria-expanded ajouté aux toggles NearbyParks pour meilleure semantique"
metrics:
  duration: "~45 minutes"
  completed: "2026-03-27"
  tasks: 2
  files: 15
---

# Phase 05 Plan 01: A11Y — Boutons Icon-Only & Motion Elements Summary

**One-liner:** Audit complet et correction A11Y des boutons icon-only (aria-label FR) et des motion.div interactifs (tabIndex + onKeyDown) sur 15 fichiers.

## Ce qui a été fait

### A11Y-01 — Boutons icon-only

14 boutons icon-only sans aria-label identifiés et corrigés :

| Fichier | Bouton | aria-label |
|---------|--------|-----------|
| `DogProfile.jsx` | `<Pencil>` (modifier profil) | "Modifier le profil" |
| `DogEditModal.jsx` | `<X>` (fermer modal) | "Fermer" |
| `AIDiagnosisModal.jsx` | `<X>` (fermer dialog) | "Fermer" |
| `AIDiagnosisModal.jsx` | `<X>` (supprimer image) | "Supprimer l'image" |
| `PremiumNudgeSheet.jsx` | `<X>` (fermer sheet) | "Fermer" |
| `PostTrialSheet.jsx` | `<X>` (fermer sheet) | "Fermer" |
| `WeightCard.jsx` | `<X>` (fermer form poids) | "Fermer" |
| `VaccineCard.jsx` | `<X>` (fermer form vaccin) | "Fermer" |
| `SectionVaccins.jsx` (RecordRow) | `<X>` (supprimer enregistrement) | "Supprimer" |
| `SectionPoids.jsx` | `<X>` (supprimer pesée) | "Supprimer" |
| `AITrainingProgram.jsx` (DayCard) | Checkbox rond (marquer fait) | "Marquer comme fait" / "Marquer comme non fait" |
| `AITrainingProgram.jsx` (DayCard) | `<ChevronDown/Up>` (toggle) | "Réduire" / "Développer" |
| `CoachHomeHeader.jsx` | `motion.button` photo chien | "Voir le profil du chien" |
| `Chat.jsx` | `motion.button` scroll FAB | "Défiler vers le bas" |

### A11Y-02 — motion.div interactifs

3 `motion.div` avec `onClick` sans accessibilité clavier identifiés et corrigés :

| Fichier | Description | Correction |
|---------|-------------|-----------|
| `Training.jsx` | Carte guide comportement (navigation) | `tabIndex={0}` + `role="button"` + `onKeyDown` Enter/Space |
| `NearbyParks.jsx` | Ligne parc (expand/collapse) | `tabIndex={0}` + `role="button"` + `aria-expanded` + `onKeyDown` |
| `CelebrationScreen.jsx` | Backdrop screen (dismiss) | `tabIndex={0}` + `role="button"` + `aria-label="Continuer"` + `onKeyDown` |

### Exclusions justifiées

Les `motion.div` suivants avec `onClick` ont été délibérément exclus de A11Y-02 :
- **Overlays/backdrops** (CombinedFAB, NotificationCenter, PremiumNudgeSheet, PostTrialSheet, HealthAssistantSheet, QRCodeCard) : ce sont des patterns de fermeture optionnels. Le bouton "Fermer" explicite est toujours présent et accessible dans chaque dialog.
- **`onClick={e => e.stopPropagation()}`** (DogEditModal content, WalkShareCard) : pas d'action utilisateur, juste blocage de la propagation.

## Déviations du plan

Aucune — plan exécuté exactement comme spécifié.

## Commit

- `34ca600` — feat(05-a11y): add aria-labels to icon-only buttons and keyboard nav to interactive motion.div

## Self-Check

### Fichiers créés
- `.planning/phases/05-a11y/05-01-PLAN.md` — FOUND (créé dans cette session)
- `.planning/phases/05-a11y/05-01-SUMMARY.md` — ce fichier

### Commits
- `34ca600` — vérifié via `git log --oneline`

## Self-Check: PASSED
