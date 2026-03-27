---
phase: 07-flow-fixes
plan: "02"
subsystem: profile, sante, activite
tags: [bug-fix, error-handling, rollback, toast, api-guard]
dependency_graph:
  requires: []
  provides: [FIX-16, FIX-17, FIX-18]
  affects: [WalkReminderSettings, NotebookContent, Activite]
tech_stack:
  added: []
  patterns: [optimistic-ui-rollback, pseudo-record-guard, pull-to-refresh-error-boundary]
key_files:
  created: []
  modified:
    - src/components/profile/WalkReminderSettings.jsx
    - src/components/sante/NotebookContent.jsx
    - src/pages/Activite.jsx
decisions:
  - "Rollback on catch rather than disabling optimistic updates — preserves UX speed while guaranteeing consistency"
  - "Guard ge- added inline alongside dl- guard — single condition, no separate early-return"
  - "toast imported from sonner in Activite.jsx — consistent with other pages, no new dependency"
metrics:
  duration: "8 minutes"
  completed: "2026-03-27"
  tasks: 3
  files: 3
requirements_completed:
  - FIX-16
  - FIX-17
  - FIX-18
---

# Phase 07 Plan 02: Flow Fixes — Santé/Activité/Profile P0 Summary

**One-liner:** Rollback optimiste + toast.error sur WalkReminderSettings, guard ge- dans NotebookContent, try/catch dans Activite.refreshLogs — zéro état incohérent, zéro appel API invalide, zéro crash silencieux.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | WalkReminderSettings rollback + toast.error | 700e1cd | src/components/profile/WalkReminderSettings.jsx |
| 2 | NotebookContent guard ge-* | 9568e01 | src/components/sante/NotebookContent.jsx |
| 3 | Activite refreshLogs try/catch | 7184959 | src/pages/Activite.jsx |

## Changes par fichier

### Task 1 — WalkReminderSettings.jsx (FIX-16)

**Avant :**
```javascript
const handleToggle = async (val) => {
  setEnabled(val);
  setSaving(true);
  try {
    await onSave({ walk_reminder_enabled: val, walk_reminder_time: time });
    toast.success(val ? `Rappel activé à ${time}` : "Rappel désactivé");
  } finally {
    setSaving(false);
  }
};
```

**Après :**
```javascript
const handleToggle = async (val) => {
  const prevEnabled = enabled;
  setEnabled(val);
  setSaving(true);
  try {
    await onSave({ walk_reminder_enabled: val, walk_reminder_time: time });
    toast.success(val ? `Rappel activé à ${time}` : "Rappel désactivé");
  } catch {
    setEnabled(prevEnabled); // rollback
    toast.error("Impossible de modifier le rappel. Réessaie.");
  } finally {
    setSaving(false);
  }
};
```

Même pattern appliqué à `handleTimeChange` (rollback `prevTime`).

### Task 2 — NotebookContent.jsx (FIX-17)

**Avant (ligne 117) :**
```javascript
if (typeof id === "string" && id.startsWith("dl-")) return;
```

**Après :**
```javascript
if (typeof id === "string" && (id.startsWith("dl-") || id.startsWith("ge-"))) return;
```

Guard ge- confirmé présent. Les pseudo-records GrowthEntry (`ge-${g.id}`, ligne 172) sont maintenant protégés contre un appel `HealthRecord.delete` invalide.

### Task 3 — Activite.jsx (FIX-18)

**Import ajouté (était absent) :**
```javascript
import { toast } from "sonner";
```

**Avant :**
```javascript
const refreshLogs = async () => {
  if (!dog || !user) return;
  const l = await DailyLog.filter({ dog_id: dog.id }, "-date", 30);
  setLogs(l || []);
  invalidateHome();
};
```

**Après :**
```javascript
const refreshLogs = async () => {
  if (!dog || !user) return;
  try {
    const l = await DailyLog.filter({ dog_id: dog.id }, "-date", 30);
    setLogs(l || []);
    invalidateHome();
  } catch {
    toast.error("Impossible de rafraîchir les activités. Vérifie ta connexion.");
  }
};
```

## Deviations from Plan

None — plan executed exactly as written.

Note: `toast` was confirmed absent in Activite.jsx before this fix (as the plan anticipated). Import ajouté conformément aux instructions Task 3.

## Known Stubs

None.

## Self-Check: PASSED

- src/components/profile/WalkReminderSettings.jsx — FOUND (prevEnabled, prevTime, 2x catch blocks)
- src/components/sante/NotebookContent.jsx — FOUND (startsWith("ge-") guard at line 117)
- src/pages/Activite.jsx — FOUND (try/catch in refreshLogs, toast imported)
- Commits: 700e1cd, 9568e01, 7184959 — all present in git log
- src/components/ui/ — unmodified (0 grep hits)
