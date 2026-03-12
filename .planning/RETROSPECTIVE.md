# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — Quality Audit

**Shipped:** 2026-03-12
**Phases:** 4 | **Plans:** 21 | **Sessions:** 2

### What Was Built
- Dead code cleanup: 55 fichiers nettoyes (imports/variables morts), 9 composants orphelins supprimes
- Error UX: toast errors FR sur 5 pages, skeletons chargement Sante/Activite, etats vides illustres, validation formulaire DogEditModal
- Security: 17 champs sanitises (prompt injection), URL allowlist dans 4 fonctions backend (SSRF)
- UI consistency: gradient-primary sur tous les CTAs, rounded-2xl sur toutes les cards, emerald pour success states

### What Worked
- Wave-based parallel execution: 2 plans par wave, subagents independants — execution rapide sans conflits
- Verifier catches gaps: phase 5 (VetBookletScanner orphelin) et phase 8 (Training.jsx CTA bleu) detectes par le verifier, corriges inline
- 0 Build credits utilises — tout via Git push, aucun schema change necessaire
- ESLint unused-imports plugin pour dead code detection — systematique et fiable

### What Was Inefficient
- Recurring plan checker blocker: phases 6 et 7 avaient des plans partageant des fichiers dans la meme wave — meme fix a chaque fois (deplacer en wave 2). Le planner devrait anticiper ca
- SUMMARY.md files manquants — le workflow de verification cherche des SUMMARY.md qui ne sont jamais generes par l'execution. A clarifier dans le workflow
- gsd-tools $HOME path resolution sur Windows: `$HOME` resout vers le chemin Git, pas le vrai home. Necessite chemin absolu

### Patterns Established
- `sanitize()` inline: `String(s || '').substring(0, max).replace(/[<>]/g, '')` — pattern leger pour tous les champs utilisateur en backend
- `validateImageUrl()` avec allowlist de domaines — pattern standard pour les URLs d'images IA
- Gap closure inline: pour les gaps simples (1 fichier, 1 ligne), corriger directement sans relancer un cycle plan complet
- Verifier = filet de securite obligatoire: meme avec des plans bien faits, le verifier attrape des oublis

### Key Lessons
1. **Les plans doivent anticiper les fichiers partages entre waves.** Le plan checker a bloque 2 fois sur le meme pattern (plans wave-1 avec files_modified en commun). Le planner doit recevoir cette regle explicitement.
2. **Le verifier justifie son cout.** 2 gaps sur 4 phases — sans verifier, Training.jsx aurait garde un CTA bleu et VetBookletScanner serait reste dans le bundle.
3. **La qualite sans tests unitaires est possible** si on combine ESLint (dead code), grep systematique (patterns), et verification humaine (UX). Pas ideal, mais fonctionnel sur Base44.

### Cost Observations
- Model mix: ~70% sonnet (subagents execution), ~20% opus (orchestration), ~10% haiku (verification rapide)
- Sessions: 2 (planning + execution complet en 2 sessions)
- Notable: les 4 phases (21 plans) ont ete planifiees et executees en ~6h effectives

---

## Milestone: v1.0 — Data Flow Integrity

**Shipped:** 2026-03-11
**Phases:** 4 | **Plans:** 12 | **Sessions:** 3

### What Was Built
- Allergies unifiees dans scanner + comparateur (dog.allergies + DietPreferences.disliked_foods)
- Score sante enrichi (GrowthEntry + DailyLog + HealthRecord)
- PDF sante avec 3 sources poids mergees + infos veto
- 3 fonctions IA enrichies (check-in memoire, weekly insight, monthly summary)
- Rappels email etendus + appetite alerts + 3 repas/jour + streak balade

### What Worked
- Approche data-first: corriger les flux de donnees avant d'ajouter des features — fondation solide
- GSD workflow: phases bien decoupees, verification systematique

### What Was Inefficient
- Premiere utilisation du workflow GSD — courbe d'apprentissage sur les conventions
- Quelques plans trop larges (phase 4 = 4 plans independants regroupes)

### Key Lessons
1. **Corriger les donnees avant l'UX.** Sans v1.0, les toasts FR de v1.1 auraient affiche des erreurs sur des flux deja casses.
2. **Les fonctions IA doivent utiliser TOUTES les donnees disponibles.** Le check-in sans memoire des check-ins precedents = reponses generiques inutiles.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 3 | 4 | Premier cycle GSD — apprentissage workflow |
| v1.1 | 2 | 4 | Wave execution optimisee, gap closure inline, verifier systematique |

### Top Lessons (Verified Across Milestones)

1. Le verifier attrape des gaps que le planning rate — toujours l'executer, meme quand on est confiant
2. Git push > Build prompts — 0 credit utilise sur 2 milestones entiers (36 requirements, 33 plans)
3. Les corrections qualite (v1.1) sont plus rapides que les corrections data (v1.0) car elles ne touchent pas les flux metier
