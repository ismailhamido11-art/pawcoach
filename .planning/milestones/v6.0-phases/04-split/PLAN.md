---
phase: "04"
plan: "split"
type: "refactor"
autonomous: true
---

# Phase 04 — SPLIT : Extraction des composants et helpers

## Objectif

Réduire la taille des fichiers monolithes en extrayant des blocs de code réutilisables et autonomes dans des fichiers dédiés.

## Tâches

### SPLIT-01 : DayCard — AITrainingProgram.jsx
- Extraire `DayCard` (lignes 42-150) de `AITrainingProgram.jsx`
- Créer `src/components/activite/DayCard.jsx`
- Co-localiser `isSameDay` helper dans DayCard.jsx
- Import dans AITrainingProgram

### SPLIT-02 : Nutri.jsx — Consolidation useState
- Grouper les ~20 useState en 2 objets groupés :
  - `dogDataState` : dog, user, recentScans, dietPrefs, checkins, healthRecords, dailyLogs, activePlan, monthlyPlanCount, allPlans
  - `coachState` : messages, input, loading, isStreaming, streamingText, showScrollBtn, messagesRemaining, bookmarked, lastFailedInput
- Wrappers setter individuels pour compatibilité descendante

### SPLIT-03 : SmartHealthAssistant.jsx — Voice + ReviewPanel
- Extraire logique SpeechRecognition → `src/components/notebook/VoiceButton.jsx`
- Extraire le CTA de sauvegarde des records → `src/components/notebook/RecordReviewPanel.jsx`
- SmartHealthAssistant importe les deux composants

### SPLIT-04 : DownloadHealthPDF.jsx — PDF helpers
- Extraire fonctions pures PDF vers `src/utils/pdfHelpers.js`
  - `fmtShortDate`, `sanitize`, `computeAge`, `COLORS`, `drawTable`, `drawSectionHeader`, `drawScoreBadge`
- DownloadHealthPDF importe depuis pdfHelpers

## Règles
- Ne pas modifier `pawcoach/src/components/ui/` (shadcn)
- L'original ne doit plus contenir le code déplacé — seulement import + render
- Vérifier mentalement que les props passées sont correctes
