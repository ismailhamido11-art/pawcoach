---
phase: 02-cron
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - base44/functions/monthlySummary/entry.ts
  - base44/functions/streakReminder/entry.ts
autonomous: true
requirements:
  - CRON-01
  - CRON-02

must_haves:
  truths:
    - "monthlySummary ne charge jamais la table User ou Dog complete — seuls les users premium/trial sont charges"
    - "streakReminder documente explicitement pourquoi Streak.list() est acceptable et alerte si la table depasse le seuil"
    - "Les deux fonctions CRON passent un grep sans aucun appel .list() non garde"
  artifacts:
    - path: "base44/functions/monthlySummary/entry.ts"
      provides: "CRON mensuel envoie des rapports uniquement aux users premium/trial"
      contains: "User.filter({ is_premium: true })"
    - path: "base44/functions/streakReminder/entry.ts"
      provides: "CRON quotidien rappel streaks actifs avec garde sur volume"
      contains: "console.warn"
  key_links:
    - from: "monthlySummary"
      to: "User.filter({ is_premium: true })"
      via: "base44.asServiceRole.entities.User.filter"
      pattern: "User\\.filter\\(\\{\\s*is_premium"
    - from: "streakReminder"
      to: "cap warning"
      via: "console.warn si length > 500"
      pattern: "streaks\\.length > 500"
---

<objective>
Rendre les deux fonctions CRON backend scalables en remplacant les requetes globales sans filtre.

Purpose: A ~500 users, Dog.list() + User.list() dans monthlySummary causent des timeouts. Streak.list() dans streakReminder n'a pas de garde contre la croissance.
Output: monthlySummary utilise User.filter + Dog.filter cibles. streakReminder conserve Streak.list() avec un cap et un log d'alerte.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@base44/functions/monthlySummary/entry.ts
@base44/functions/streakReminder/entry.ts
</context>

<tasks>

<task type="auto" id="CRON-01">
  <name>Task 1: monthlySummary — remplacer Dog.list() + User.list() par des filtres cibles</name>
  <files>base44/functions/monthlySummary/entry.ts</files>

  <read_first>
    Lire base44/functions/monthlySummary/entry.ts en entier avant toute modification.
    Identifier les lignes contenant .list() et noter le contexte exact (lignes 14-15 selon CONCERNS.md).
  </read_first>

  <action>
    Remplacer les deux requetes globales par des requetes filtrees.

    AVANT (a supprimer) :
    ```typescript
    const users = await base44.asServiceRole.entities.User.list();
    const dogs = await base44.asServiceRole.entities.Dog.list();
    ```

    APRES (a implementer) :
    1. Charger uniquement les users premium :
       ```typescript
       const premiumUsers = await base44.asServiceRole.entities.User.filter({ is_premium: true });
       const trialUsers = await base44.asServiceRole.entities.User.filter({ is_trial: true }).catch(() => []);
       ```
    2. Deduplication pour ne pas envoyer deux emails aux users premium+trial :
       ```typescript
       const allEligibleUsers = [...(premiumUsers || []), ...(trialUsers || [])].filter(
         (u, i, arr) => u.email && arr.findIndex(x => x.email === u.email) === i
       ).filter(u => u.is_premium || (u.trial_expires_at && new Date(u.trial_expires_at) > new Date()));
       ```
    3. Charger les chiens uniquement pour les users eligibles en parallele (Promise.all) :
       ```typescript
       const dogsByUser = await Promise.all(
         allEligibleUsers.map(u => base44.asServiceRole.entities.Dog.filter({ owner: u.email }).catch(() => []))
       );
       const userMap = new Map(allEligibleUsers.map(u => [u.email, u]));
       const dogs = dogsByUser.flat();
       ```
    4. Dans la boucle `for (const dog of dogs)`, recuperer le user via `userMap.get(dog.owner)` — ne plus filtrer depuis la liste globale.
    5. Supprimer tout code qui reference la variable `dogs` ou `users` de l'ancien Dog.list()/User.list().
    6. Le reste de la fonction (calcul stats, envoi email) reste inchange.

    Protections :
    - Ne JAMAIS appeler .list() sans filtre dans ce fichier.
    - Les .catch(() => []) sont obligatoires pour eviter un crash si un filtre ne retourne rien.
    - La response finale doit inclure `eligible_users: allEligibleUsers.length` en plus de `processed`.
  </action>

  <verify>
    <automated>grep -n "\.list()" base44/functions/monthlySummary/entry.ts | grep -v "//" || echo "PASS: no unguarded .list() found"</automated>
  </verify>

  <done>
    - Aucun appel `.list()` non commente dans monthlySummary/entry.ts
    - `User.filter({ is_premium: true })` present dans le fichier (ligne verifiable par grep)
    - `Dog.filter({ owner:` present dans le fichier
    - La fonction retourne `{ ok: true, processed: N, eligible_users: N }`
  </done>
</task>

<task type="auto" id="CRON-02">
  <name>Task 2: streakReminder — ajouter cap et log warning sur Streak.list()</name>
  <files>base44/functions/streakReminder/entry.ts</files>

  <read_first>
    Lire base44/functions/streakReminder/entry.ts en entier avant toute modification.
    Localiser la ligne `Streak.list()` (ligne 9 selon CONCERNS.md) et le contexte exact.
  </read_first>

  <action>
    Conserver `Streak.list()` (justifie : 1 streak par chien, table naturellement petite, ~1 ligne par utilisateur actif).
    Ajouter immediatement apres le .list() un guard de volume avec log d'alerte :

    ```typescript
    const streaks = await base44.asServiceRole.entities.Streak.list();
    // 1 streak per dog — table stays small unless usage explodes.
    // Cap: warn at 500 rows so we know when to switch to filtered queries.
    if ((streaks || []).length > 500) {
      console.warn(`streakReminder: Streak table has ${streaks.length} rows — consider switching to filtered queries if this keeps growing.`);
    }
    ```

    Le filtrage en-memoire qui suit (current_streak >= 3 && last_activity_date !== today) reste inchange — il est correct.

    Ne pas modifier la logique d'envoi des emails ni la deduplication par user.
  </action>

  <verify>
    <automated>grep -n "console.warn" base44/functions/streakReminder/entry.ts | grep -i "500" || echo "FAIL: cap warning not found"</automated>
  </verify>

  <done>
    - `console.warn` avec reference au seuil 500 present dans streakReminder/entry.ts
    - Un commentaire explique pourquoi .list() est acceptable ici (1 streak par chien)
    - La logique de filtrage et d'envoi d'emails est intacte
  </done>
</task>

</tasks>

<verification>
Apres execution des deux tasks :

1. Aucun `.list()` non commente dans monthlySummary/entry.ts :
   `grep -n "\.list()" base44/functions/monthlySummary/entry.ts`
   Resultat attendu : zero ligne (ou uniquement dans des commentaires)

2. Filter premium present dans monthlySummary :
   `grep -n "is_premium" base44/functions/monthlySummary/entry.ts`
   Resultat attendu : au moins une ligne avec `User.filter({ is_premium: true })`

3. Cap warning present dans streakReminder :
   `grep -n "500" base44/functions/streakReminder/entry.ts`
   Resultat attendu : une ligne de garde avec console.warn

4. Les deux fichiers sont syntaxiquement valides TypeScript (pas de lint error visible).
</verification>

<success_criteria>
- monthlySummary n'appelle plus Dog.list() ni User.list() sans filtre — uniquement User.filter({ is_premium: true }) et Dog.filter({ owner: email })
- streakReminder conserve Streak.list() avec un cap explicite a 500 lignes et un console.warn d'alerte
- Les deux fonctions passent le code review : grep de ".list()" dans monthlySummary retourne 0 resultats non commentes
</success_criteria>

<output>
Apres completion, creer `.planning/phases/02-cron/02-cron-01-SUMMARY.md` avec :
- Ce qui a ete fait (CRON-01, CRON-02)
- Deviations du plan si applicable
- Commits effectues
- Self-check : fichiers lus apres edit, grep de verification execute
</output>
