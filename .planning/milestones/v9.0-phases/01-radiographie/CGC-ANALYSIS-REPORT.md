# CGC Analysis Report — PawCoach v9.0 Radiographie

**Date:** 2026-03-27
**Source:** CGC (CodeGraphContext) post-v8.0 re-index

---

## Dead Code

50 items flagged. Note CGC : peut inclure des entry points, callbacks, ou appels dynamiques — a valider manuellement.

| Fonction | Fichier | Ligne | Categorie |
|----------|---------|-------|-----------|
| `validateImageUrl` | `base44/functions/analyzeGrowthPhoto/entry.ts` | 45 | Backend helper |
| `sanitize` | `base44/functions/dailyCheckinProcess/entry.ts` | 9 | Backend helper |
| `sanitize` | `base44/functions/finalDiagnosis/entry.ts` | 67 | Backend helper |
| `validateImageUrl` | `base44/functions/finalDiagnosis/entry.ts` | 70 | Backend helper |
| `addText` | `base44/functions/generateDiagnosisPDF/entry.ts` | 50 | Backend helper |
| `sanitize` | `base44/functions/generateTrainingProgram/entry.ts` | 52 | Backend helper |
| `sanitize` | `base44/functions/parseHealthFile/entry.ts` | 13 | Backend helper |
| `sanitize` | `base44/functions/pawcoachChat/entry.ts` | 14 | Backend helper |
| `verdictFr` | `base44/functions/pawcoachChat/entry.ts` | 212 | Backend helper |
| `sanitize` | `base44/functions/preDiagnosis/entry.ts` | 38 | Backend helper |
| `validateImageUrl` | `base44/functions/preDiagnosis/entry.ts` | 41 | Backend helper |
| `sanitize` | `base44/functions/processHealthInput/entry.ts` | 38 | Backend helper |
| `validateImageUrl` | `base44/functions/processHealthInput/entry.ts` | 41 | Backend helper |
| `resolveVaccineName` | `base44/functions/vaccineReminders/entry.ts` | 21 | Backend helper |
| `buildHealthSummaryHTML` | `base44/functions/vetAccess/entry.ts` | 13 | Backend helper |
| `sanitize` | `base44/functions/weeklyInsightGenerate/entry.ts` | 165 | Backend helper |
| `getAge` | `base44/functions/weeklyInsightGenerate/entry.ts` | 205 | Backend helper |
| `LayoutWrapper` | `src/App.jsx` | 20 | App shell |
| `AuthenticatedApp` | `src/App.jsx` | 26 | App shell |
| `App` | `src/App.jsx` | 76 | App shell |
| `Layout` | `src/Layout.jsx` | 9 | App shell |
| `wrapEntity` | `src/api/entities.js` | 9 | API layer |
| `getNavUrl` | `src/components/BottomNav.jsx` | 29 | Navigation |
| `BottomNav` | `src/components/BottomNav.jsx` | 40 | Navigation |
| `handleTabClick` | `src/components/BottomNav.jsx` | 53 | Navigation |
| `ChatFAB` | `src/components/ChatFAB.jsx` | 6 | UI widget |
| `CombinedFAB` | `src/components/CombinedFAB.jsx` | 17 | UI widget |
| `handleSave` | `src/components/CombinedFAB.jsx` | 38 | UI widget |
| `constructor` | `src/components/ErrorBoundary.jsx` | 14 | Error handling |
| `getDerivedStateFromError` | `src/components/ErrorBoundary.jsx` | 20 | Error handling |
| `componentDidCatch` | `src/components/ErrorBoundary.jsx` | 24 | Error handling |
| `handleRetry` | `src/components/ErrorBoundary.jsx` | 31 | Error handling |
| `render` | `src/components/ErrorBoundary.jsx` | 37 | Error handling |
| `PawIcon` | `src/components/PawLoader.jsx` | 3 | UI widget |
| `PawLoader` | `src/components/PawLoader.jsx` | 16 | UI widget |
| `PawMascot` | `src/components/PawMascot.jsx` | 37 | UI widget |
| `PawMascotInline` | `src/components/PawMascot.jsx` | 91 | UI widget |
| `PullToRefresh` | `src/components/PullToRefresh.jsx` | 7 | PWA |
| `handleTouchStart` | `src/components/PullToRefresh.jsx` | 18 | PWA |
| `handleTouchMove` | `src/components/PullToRefresh.jsx` | 22 | PWA |
| `handleTouchEnd` | `src/components/PullToRefresh.jsx` | 28 | PWA |
| `UserNotRegisteredError` | `src/components/UserNotRegisteredError.jsx` | 4 | Error handling |
| `handleLogout` | `src/components/UserNotRegisteredError.jsx` | 5 | Error handling |
| `WellnessBanner` | `src/components/WellnessBanner.jsx` | 3 | UI widget |
| `timeAgo` | `src/components/achievements/AchievementFeed.jsx` | 38 | Feature |
| `AchievementFeed` | `src/components/achievements/AchievementFeed.jsx` | 48 | Feature |
| `renderBadgeIcon` | `src/components/achievements/badgeUtils.jsx` | 20 | Feature |
| `AITrainingProgram` | `src/components/activite/AITrainingProgram.jsx` | 36 | Feature |
| `loadSaved` | `src/components/activite/AITrainingProgram.jsx` | 62 | Feature |
| `saveProgram` | `src/components/activite/AITrainingProgram.jsx` | 139 | Feature |

**Analyse :** La majorite des faux positifs vient des composants React (entry points JSX) et des helpers Deno (utilises dans le scope local de chaque fonction). Les items a inspecter en priorite sont `verdictFr` dans pawcoachChat et `buildHealthSummaryHTML` dans vetAccess (aussi le plus complexe).

---

## Complexity Hotspots

Seuil CGC : complexite cyclomatique > 10.

| Fonction | Complexite | Fichier | Ligne |
|----------|-----------|---------|-------|
| `buildHealthSummaryHTML` | **28** | `base44/functions/vetAccess/entry.ts` | 13 |
| `getAge` | **17** | `base44/functions/pawcoachChat/entry.ts` | 438 |
| `getAge` | **17** | `base44/functions/weeklyInsightGenerate/entry.ts` | 205 |
| `formatDateFr` | **11** | `base44/functions/pawcoachChat/entry.ts` | 129 |

**Analyse :** 4 fonctions depassent le seuil.
- `buildHealthSummaryHTML` (28) est le hotspot critique — presque 3x le seuil. C'est un generateur HTML pour l'acces veterinaire, probablement une longue chaine de if/else sur les champs sante.
- `getAge` dupliquee avec complexite 17 dans deux backends differents — duplication a factoriser en utilitaire partage.
- `formatDateFr` (11) dans pawcoachChat — logique de formatage de date avec beaucoup de cas.

---

## Coupling Hubs (Most Called — Incoming)

| Rang | Fonction | Callers | Signal |
|------|----------|---------|--------|
| 1 | `createPageUrl` | **60** | Hub de navigation critique |
| 2 | `setLoading` | 38 | State management UI |
| 3 | `isUserPremium` | 36 | Gating premium — tres sollicite |
| 4 | `cn` | 36 | Utilitaire CSS (shadcn) — normal |
| 5 | `update` | 24 | Mutation entite generique |
| 6 | `setUser` | 21 | Auth state |
| 7 | `getTodayString` | 14 | Utilitaire date |
| 8 | `sanitize` | 14 | Securite input |
| 9 | `parseDate` | 13 | Utilitaire date |
| 10 | `setMessages` | 13 | State chat |

**Analyse :** `createPageUrl` (60 callers) est le hub le plus critique de l'app — toute modification est a haut risque. `isUserPremium` (36 callers) confirme que le gating premium est fortement distribue dans le code ; une regression ici impacte 36 points d'acces.

---

## Outgoing Hubs (Calls Most — Outgoing)

| Rang | Fonction | Appels sortants | Signal |
|------|----------|----------------|--------|
| 1 | `handleDownload` | **50** | Fonction tres dependante |
| 2 | `init` | 15 | Initialisation (normal) |
| 3 | `sendMessage` | 15 | Chat — version 1 |
| 4 | `computeHealthScore` | 14 | Calcul score sante |
| 5 | `computeAlerts` | 12 | Calcul alertes |
| 6 | `sendMessage` | 12 | Chat — version 2 (doublon ?) |
| 7 | `Dashboard` | 10 | Page principale |
| 8 | `fetchAndCache` | 10 | Cache layer |
| 9 | `Training` | 10 | Page entrainement |
| 10 | `loadData` | 8 | Chargement donnees |

**Analyse :** `handleDownload` (50 appels sortants) est anormalement couplé — a inspecter, probablement une fonction qui orchestre trop de choses. Deux instances de `sendMessage` avec des comptages differents (15 et 12) suggerent deux fonctions distinctes avec le meme nom dans des fichiers differents.

---

## Summary

| Metrique | Valeur |
|----------|--------|
| Items dead code signales | 50 |
| Dont faux positifs probables (React/Deno entry points) | ~35 |
| Dont a inspecter reellement | ~15 |
| Fonctions complexite > 10 | **4** |
| Hotspot max (buildHealthSummaryHTML) | **28** |
| Hub le plus appele (createPageUrl) | **60 callers** |
| Hub le plus couplant (handleDownload) | **50 appels sortants** |
| Doublons detectes (getAge, sendMessage) | **2 patterns** |

### Recommandations — Priorite v9.0

1. **[PRIORITE 1] Factoriser `getAge`** — meme fonction avec complexite 17 dans deux backends. Creer un utilitaire partage dans `base44/functions/_shared/` et importer depuis les deux.

2. **[PRIORITE 2] Refactoriser `buildHealthSummaryHTML`** (complexite 28) — decomposer en sous-fonctions thematiques (vaccins, poids, alertes, etc.). Risque actuel : code fragile, difficile a maintenir.

3. **[PRIORITE 3] Auditer `handleDownload`** (50 appels sortants) — une fonction qui en appelle 50 autres est un God Function. Identifier les responsabilites et decomposer.

4. **[ATTENTION] Ne pas modifier `createPageUrl`** sans blast radius complet — 60 callers, moindre regression = navigation cassee partout.

5. **[ATTENTION] `isUserPremium`** (36 callers) — tout changement au gating premium impacte 36 points. Toujours lancer SFA apres modification.

6. **[INFO] Dead code backend** — les `sanitize` et `validateImageUrl` dans chaque fonction Deno sont probablement des helpers locaux utilises dans le scope de la meme fonction mais non detectes comme appels par CGC. Verifier avant de supprimer.
