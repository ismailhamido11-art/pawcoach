-- ============================================================================
-- PawCoach — Schema Fixes (applique APRES 001_schema.sql)
-- Corrections issues de l'audit CTO vs CODEBASE_KNOWLEDGE.md
-- Date: 2026-04-01
-- ============================================================================

-- ============================================================================
-- FIX 1: health_record_type manque 'allergy'
-- Le code cree des HealthRecord avec type='allergy' (ex: allergies detectees)
-- Sans ce fix: INSERT echoue avec enum violation
-- ============================================================================

alter type health_record_type add value if not exists 'allergy';

-- ============================================================================
-- FIX 2: bookmark_source manque 'chat' et 'nutrition'
-- Chat.jsx:   Bookmark.create({ source: 'chat', ... })
-- Nutri.jsx:  Bookmark.create({ source: 'nutrition', ... })
-- Sans ce fix: INSERT echoue avec enum violation
-- ============================================================================

alter type bookmark_source add value if not exists 'chat';
alter type bookmark_source add value if not exists 'nutrition';

-- ============================================================================
-- FIX 3: diet_type enum ne matche pas les valeurs francaises du code
-- Code utilise: 'croquettes', 'barf', 'mixte', 'fait_maison', 'ration_menagere'
-- Schema avait: 'kibble', 'barf', 'mixed', 'homemade'
-- Solution: DROP l'enum et utiliser TEXT avec CHECK
-- (les enums sont rigides pour des valeurs i18n susceptibles de changer)
-- ============================================================================

-- On ne peut pas drop un enum utilise par une colonne, donc:
-- 1. Changer la colonne en TEXT
-- 2. Drop l'ancien enum
-- 3. Ajouter un CHECK constraint souple

alter table dogs alter column diet_type type text using diet_type::text;
drop type if exists diet_type;

-- CHECK souple: on accepte les valeurs connues + null
alter table dogs add constraint dogs_diet_type_check
  check (diet_type is null or diet_type in (
    'croquettes', 'barf', 'mixte', 'fait_maison', 'ration_menagere'
  ));

-- ============================================================================
-- FIX 4: vet_notes.vet_user_id doit etre nullable
-- Les vetos peuvent ne pas avoir de compte Supabase (notes creees via
-- vetAccess backend avec service role, identifiees par vet_email)
-- Sans ce fix: INSERT echoue si vet_user_id est null
-- ============================================================================

alter table vet_notes alter column vet_user_id drop not null;

-- RLS vet_notes: ajouter policy pour vetos sans compte (via shared_vet_access)
-- Un veto avec un compte mais aussi via email
create policy "vet_notes_select_vet_by_email" on vet_notes for select
  using (
    exists (
      select 1 from shared_vet_access sva
      where sva.dog_id = vet_notes.dog_id
        and sva.vet_email = vet_notes.vet_email
        and sva.status = 'active'
        and sva.vet_user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX 5: health_records manque reminder_sent_date
-- Utilise par vaccineReminders, medicationReminders, vetVisitReminders
-- pour eviter d'envoyer le meme rappel 2 fois
-- Sans ce fix: les CRONs n'ont pas de dedup → spam email
-- ============================================================================

alter table health_records add column if not exists reminder_sent_date date;

-- Index partiel pour les rappels actifs (next_date futur, pas encore envoye)
create index if not exists idx_health_records_reminders
  on health_records(next_date, type)
  where next_date is not null;

-- ============================================================================
-- FIX 6: profiles manque walk_reminder_enabled et walk_reminder_time
-- Utilise par walkReminder CRON pour filtrer qui recoit les rappels
-- et a quelle heure les envoyer
-- Sans ce fix: walkReminder CRON ne peut pas fonctionner
-- ============================================================================

alter table profiles add column if not exists walk_reminder_enabled boolean not null default false;
alter table profiles add column if not exists walk_reminder_time text; -- format "HH:00"

-- ============================================================================
-- FIX 7: Vet read policies manquantes pour tables liees au chien
-- Le VetPortal affiche le dossier complet du chien (checkins, scans, growth)
-- Seul health_records a une policy vet — les autres tables sont invisibles
-- ============================================================================

-- Vets can read daily_checkins for shared dogs
create policy "daily_checkins_select_vet" on daily_checkins for select
  using (
    exists (
      select 1 from shared_vet_access sva
      where sva.dog_id = daily_checkins.dog_id
        and sva.vet_user_id = auth.uid()
        and sva.status = 'active'
    )
  );

-- Vets can read food_scans for shared dogs
create policy "food_scans_select_vet" on food_scans for select
  using (
    exists (
      select 1 from shared_vet_access sva
      where sva.dog_id = food_scans.dog_id
        and sva.vet_user_id = auth.uid()
        and sva.status = 'active'
    )
  );

-- Vets can read growth_entries for shared dogs
create policy "growth_entries_select_vet" on growth_entries for select
  using (
    exists (
      select 1 from shared_vet_access sva
      where sva.dog_id = growth_entries.dog_id
        and sva.vet_user_id = auth.uid()
        and sva.status = 'active'
    )
  );

-- Vets can read daily_logs for shared dogs
create policy "daily_logs_select_vet" on daily_logs for select
  using (
    exists (
      select 1 from shared_vet_access sva
      where sva.dog_id = daily_logs.dog_id
        and sva.vet_user_id = auth.uid()
        and sva.status = 'active'
    )
  );

-- ============================================================================
-- VERIFICATION: Lister toutes les tables et leur statut RLS
-- ============================================================================
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
-- order by tablename;

-- ============================================================================
-- END OF FIXES
-- ============================================================================
