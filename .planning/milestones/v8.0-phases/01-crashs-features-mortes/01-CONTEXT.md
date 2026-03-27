# Phase 1: Crashs & Features Mortes - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Auto-generated (crash fix phase — discuss skipped)

<domain>
## Phase Boundary

Toutes les features critiques sont accessibles et fonctionnent sans erreur JavaScript. 4 requirements (CRASH-01 a CRASH-04).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — crash fix phase.

**SFA source files (MUST READ before planning):**
- `.planning/audit/SFA-HOME-NAV.md` — RUPTURE 1 (quick checkin) + RUPTURE 2 (scanner)
- `.planning/audit/SFA-PROFILE.md` — C2 (DogPublicProfile crash)
- `.planning/audit/SFA-ACTIVITE.md` — Rupture #15 (CombinedFAB dead code)

**CGC commands:**
```bash
cd "C:/Users/smalt/Desktop/app-chien-ia/pawcoach"
# CRASH-01: Quick checkin guard
cgc find content "handleQuickCheckin" 2>&1
cgc find content "handleCheckin" 2>&1
# CRASH-02: labelResult in Scan
cgc find content "labelResult" 2>&1
cgc analyze deps src/pages/Scan.jsx 2>&1
# CRASH-03: Missing imports DogPublicProfile
cgc find content "Stethoscope" 2>&1
cgc find content "Pill" 2>&1
# CRASH-04: CombinedFAB usage
cgc find content "CombinedFAB" 2>&1
cgc analyze callers src/components/CombinedFAB.jsx 2>&1
```

</decisions>

<code_context>
## Existing Code Insights

### CRASH-01: Quick checkin mort (regression v7.0)
- Home.jsx:446 — handleQuickCheckin appelle handleCheckin avec seulement {mood}
- Home.jsx:271 — handleCheckin guard: `if (!mood || !energy || !appetite)` return
- DailyBriefing.jsx:107 — handleMoodTap envoie {mood} seulement (fix v7.0 DATA-04)
- Fix SFA: valeurs par defaut pour energy/appetite dans handleQuickCheckin

### CRASH-02: Scanner crash
- Scan.jsx:351,356,409 — labelResult reference mais declare dans LabelScanMode (enfant)
- Fix SFA: declarer labelResult state dans Scan.jsx, passer via callback

### CRASH-03: DogPublicProfile crash
- DogPublicProfile.jsx:19 — Stethoscope et Pill dans TYPE_CONFIG mais pas importes
- Fix SFA: ajouter les imports manquants

### CRASH-04: CombinedFAB dead code
- CombinedFAB.jsx existe mais n'est importe dans aucune page
- Fix SFA: importer dans Home.jsx ou Layout.jsx

</code_context>

<specifics>
## Specific Ideas

No specific requirements.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
