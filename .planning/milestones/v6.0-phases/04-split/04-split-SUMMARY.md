---
phase: "04"
plan: "split"
subsystem: "refactor"
tags: ["split", "components", "utils", "refactor"]
dependency_graph:
  requires: []
  provides:
    - "src/components/activite/DayCard.jsx"
    - "src/components/notebook/VoiceButton.jsx"
    - "src/components/notebook/RecordReviewPanel.jsx"
    - "src/utils/pdfHelpers.js"
  affects:
    - "src/components/activite/AITrainingProgram.jsx"
    - "src/pages/Nutri.jsx"
    - "src/components/notebook/SmartHealthAssistant.jsx"
    - "src/components/vet/DownloadHealthPDF.jsx"
tech_stack:
  added: []
  patterns:
    - "Grouped useState objects with individual setter wrappers"
    - "Extracted pure functions to utils/ for reuse"
    - "Sub-component extraction for voice/UI logic"
key_files:
  created:
    - "src/components/activite/DayCard.jsx"
    - "src/components/notebook/VoiceButton.jsx"
    - "src/components/notebook/RecordReviewPanel.jsx"
    - "src/utils/pdfHelpers.js"
  modified:
    - "src/components/activite/AITrainingProgram.jsx"
    - "src/pages/Nutri.jsx"
    - "src/components/notebook/SmartHealthAssistant.jsx"
    - "src/components/vet/DownloadHealthPDF.jsx"
decisions:
  - "DayCard extracted from AITrainingProgram.jsx (not Training.jsx as originally described — DayCard was at line 42 of AITrainingProgram)"
  - "Nutri.jsx tabs inline (scan, coach) kept inline — shared handlers make extraction impractical without excessive prop-drilling"
  - "SmartHealthAssistant voice logic extracted as VoiceButton with self-contained state (isListening, recognitionRef)"
  - "pdfHelpers.js exports pure functions usable by any future PDF export component"
metrics:
  duration: "~25 min"
  completed: "2026-03-27"
  tasks_completed: 4
  files_count: 8
---

# Phase 04 Plan split: Code Splitting — Extraction composants et helpers

**One-liner:** Extraction de 4 blocs monolithes en 4 fichiers dédiés — DayCard, VoiceButton, RecordReviewPanel, pdfHelpers.

## Résumé des tâches

| # | Tâche | Statut | Commit |
|---|-------|--------|--------|
| 1 | SPLIT-01 : DayCard extrait de AITrainingProgram | Fait | fb1ba1f |
| 2 | SPLIT-02 : useState consolidés dans Nutri.jsx | Fait | beef55a |
| 3 | SPLIT-03 : VoiceButton + RecordReviewPanel extraits de SmartHealthAssistant | Fait | 7c7c25e |
| 4 | SPLIT-04 : PDF helpers extraits dans pdfHelpers.js | Fait | 85337b6 |

## Ce qui a été fait

### SPLIT-01 — DayCard
- `DayCard` (composant de carte par jour pour les programmes d'entraînement) déplacé de `AITrainingProgram.jsx` vers `src/components/activite/DayCard.jsx`
- Helper `isSameDay` co-localisé dans DayCard.jsx
- AITrainingProgram réduit de ~119 lignes

### SPLIT-02 — Nutri.jsx useState
- 20 useState individuels regroupés en 2 objets :
  - `dogDataState` : 10 champs (dog, user, scans, dietPrefs, checkins, healthRecords, dailyLogs, activePlan, monthlyPlanCount, allPlans)
  - `coachState` : 9 champs (messages, input, loading, isStreaming, streamingText, showScrollBtn, messagesRemaining, bookmarked, lastFailedInput)
- Wrappers setters individuels générés pour chaque champ — compatibilité totale avec le code existant
- Pattern identique à ce qui avait été fait sur Home.jsx en v5.0

### SPLIT-03 — SmartHealthAssistant
- `VoiceButton.jsx` : encapsule SpeechRecognition, `isListening` state, `recognitionRef`, gestion des erreurs navigateur
- `RecordReviewPanel.jsx` : CTA "Enregistrer N entrées" avec animation framer-motion
- SmartHealthAssistant réduit de ~60 lignes

### SPLIT-04 — DownloadHealthPDF
- `pdfHelpers.js` : 7 exports (fmtShortDate, sanitize, computeAge, COLORS, drawTable, drawSectionHeader, drawScoreBadge)
- DownloadHealthPDF réduit de ~735 à ~480 lignes
- pdfHelpers.js réutilisable pour tout futur composant export PDF

## Deviations from Plan

**1. [Rule 1 - Bug / Clarification] DayCard était dans AITrainingProgram.jsx, pas Training.jsx**
- **Found during:** SPLIT-01
- **Issue:** La description disait "Training.jsx ~line 42" mais DayCard n'existe pas dans Training.jsx. Il se trouve dans `AITrainingProgram.jsx` ligne 42.
- **Fix:** Extrait depuis le bon fichier sans impact fonctionnel.
- **Files modified:** src/components/activite/AITrainingProgram.jsx, src/components/activite/DayCard.jsx

**2. [Rule 2 - Qualité] Tabs inline de Nutri.jsx non extraits**
- **Found during:** SPLIT-02
- **Issue:** Les tabs "scan" et "coach" (200+ lignes chacun) partagent trop de handlers (setMessages, sendMessage, startStreaming, bookmarked, etc.) pour être extraits en composants séparés sans prop-drilling massif ou Context.
- **Fix:** Conservés inline, avec note dans le code. La consolidation useState améliore déjà la lisibilité significativement.

## Known Stubs

Aucun stub introduit par ces modifications.

## Self-Check: PASSED

- DayCard.jsx : FOUND (fb1ba1f)
- VoiceButton.jsx : FOUND (7c7c25e)
- RecordReviewPanel.jsx : FOUND (7c7c25e)
- pdfHelpers.js : FOUND (85337b6)
- AITrainingProgram.jsx importe DayCard : VERIFIED
- SmartHealthAssistant.jsx importe VoiceButton et RecordReviewPanel : VERIFIED
- DownloadHealthPDF.jsx importe depuis pdfHelpers : VERIFIED
