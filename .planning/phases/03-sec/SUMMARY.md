---
phase: "03"
plan: "sec"
subsystem: "backend-security"
tags: ["security", "ownership", "quota", "cascade-delete", "authorization"]
key-files:
  modified:
    - "base44/functions/finalDiagnosis/entry.ts"
    - "base44/functions/generateDiagnosisPDF/entry.ts"
    - "base44/functions/deleteUser/entry.ts"
decisions:
  - "SEC-01: quota guard base sur ai_credits < 0 (credits negatifs = quota depasse, pas bloque a 0 pour eviter faux positifs sur comptes legacy)"
  - "SEC-02: dog_id optionnel dans body (backward-compat) — check actif uniquement si dog_id fourni"
  - "SEC-03: ParkReview.deleteMany dans cascade dog_id, best-effort avec .catch(()=>{})"
metrics:
  completed_date: "2026-03-27"
  tasks: 3
  files_modified: 3
---

# Phase 03 Plan SEC: Securite backend — Summary

**One-liner:** Ajout quota guard ai_credits sur finalDiagnosis, ownership check dog_id sur finalDiagnosis+generateDiagnosisPDF, et ParkReview dans la cascade deleteUser.

## Ce qui a ete fait

### SEC-01: finalDiagnosis — verification quota ai_credits

Le commentaire "No credit decrement here" existait mais aucune garde n'empechait un appel direct sans avoir passe par preDiagnosis.

**Implementation:** Requete `User.filter({ email: user.email })` pour lire `ai_credits`. Si `credits < 0` → 429 avec message explicite. Si `credits === null` (champ absent sur legacy) → laisser passer pour compatibilite descendante.

Choix `< 0` plutot que `=== 0` : un credit a 0 peut etre un compte qui vient d'etre cree ou un free tier — bloquer sur 0 causerait des faux positifs. Credits negatifs = preDiagnosis appele plus de fois que de credits disponibles = abus.

### SEC-02: Ownership check dog_id

Ajout du parametre `dog_id` dans le destructuring des deux fonctions. Si fourni, verifier via `Dog.filter({ id: dog_id })` que `dog.owner === user.email`. Retourne 403 si mismatch, 404 si inexistant.

Le check est conditionnel (`if (dog_id)`) pour maintenir la compatibilite avec les appels existants qui ne passent pas encore `dog_id`. A terme, rendre obligatoire.

### SEC-03: ParkReview dans deleteUser cascade

Ajout d'une ligne dans le `flatMap` de Step 2 :
```
base44.asServiceRole.entities.ParkReview.deleteMany({ dog_id: dogId }).catch(() => {})
```
Meme pattern best-effort que les autres entites de la cascade.

## Commits
- `a0e88e1` — fix(03-sec): add quota guard + ownership checks on diagnosis functions; add ParkReview to deleteUser cascade

## Deviations du plan

Aucune deviation majeure. SEC-02 implementé en mode backward-compatible (dog_id optionnel) plutot qu'obligatoire pour ne pas casser les appels frontend existants — consigne de prudence appliquee.

## Known Stubs

**dog_id optionnel dans SEC-02** : Le check ownership est actif uniquement si `dog_id` est fourni. Les appels sans `dog_id` contournent la protection. A rendre obligatoire une fois que le frontend transmet systematiquement `dog_id`.
- Fichier: `base44/functions/finalDiagnosis/entry.ts` ligne 9
- Fichier: `base44/functions/generateDiagnosisPDF/entry.ts` ligne 35

## Self-Check: PASSED
- `base44/functions/finalDiagnosis/entry.ts` — modifie, verifie [lu apres edit]
- `base44/functions/generateDiagnosisPDF/entry.ts` — modifie, verifie [lu apres edit]
- `base44/functions/deleteUser/entry.ts` — modifie, verifie [lu apres edit]
- Commit `a0e88e1` — present dans git log
