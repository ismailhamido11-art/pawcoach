---
phase: "03"
plan: "sec"
type: "auto"
---

# Phase 03 — SEC: Securite backend

## Objectif
Corriger 3 failles de securite dans les fonctions backend: manque de verification quota, manque d'ownership check, et cascade de suppression incomplete.

## Tasks

### SEC-01: finalDiagnosis — verification quota
- Ajouter une verification que l'utilisateur a des credits disponibles (ou a deja fait un preDiagnosis recemment)
- Prevenir l'appel direct a finalDiagnosis sans avoir passe par preDiagnosis (pas de credit decremente autrement)
- Implementation: verifier dans DiagnosisReport ou via credits utilisateur

### SEC-02: finalDiagnosis + generateDiagnosisPDF — ownership check dog_id
- Ajouter `dog_id` comme parametre dans le body de chaque fonction
- Verifier que le chien appartient bien a l'utilisateur authentifie avant traitement
- Rejeter avec 403 si le chien n'appartient pas a l'utilisateur

### SEC-03: deleteUser — ajouter ParkReview dans la cascade
- Ajouter `ParkReview.deleteMany({ dog_id: dogId })` dans la boucle de suppression des entites liees au chien

## Fichiers
- `base44/functions/finalDiagnosis/entry.ts`
- `base44/functions/generateDiagnosisPDF/entry.ts`
- `base44/functions/deleteUser/entry.ts`
