-- ============================================================================
-- PawCoach — Schema Supabase PostgreSQL
-- Migration Base44 → Supabase
-- Genere le 2026-04-01 par CTO Skoolora Agency
--
-- USAGE : Copier-coller dans Supabase SQL Editor et executer.
-- Prerequis : projet Supabase avec auth active.
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================

create extension if not exists "uuid-ossp";      -- gen_random_uuid() fallback
create extension if not exists "pg_cron";         -- scheduled functions
create extension if not exists "pg_net";          -- http calls from pg_cron

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

create type dog_sex as enum ('male', 'female');
create type activity_level as enum ('faible', 'modere', 'eleve', 'tres_eleve');
create type dog_environment as enum ('appartement', 'maison_sans_jardin', 'maison_avec_jardin');
create type diet_type as enum ('kibble', 'barf', 'mixed', 'homemade');
create type dog_status as enum ('healthy', 'recovering', 'traveling');

create type health_record_type as enum ('vaccine', 'weight', 'vet_visit', 'medication', 'note');
create type scan_verdict as enum ('safe', 'caution', 'toxic');
create type scan_mode as enum ('food', 'label');
create type urgency_level as enum ('low', 'medium', 'high', 'emergency');
create type chat_role as enum ('user', 'assistant');
create type coach_tone as enum ('encouraging', 'direct', 'pedagogical');
create type budget_level as enum ('low', 'medium', 'high');
create type growth_stage as enum ('puppy', 'adolescent', 'adult', 'senior');
create type growth_source as enum ('photo_ai', 'manual');
create type vet_access_status as enum ('pending', 'active', 'revoked');
create type vet_note_category as enum ('observation', 'prescription', 'diagnosis', 'followup', 'note');
create type bookmark_source as enum ('training', 'behavior_program', 'compare', 'video', 'fitness_program');
create type achievement_category as enum ('walk', 'training', 'streak', 'milestone');

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Trigger function: auto-set updated_at on UPDATE
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Helper: get current user's UUID from JWT
-- (Supabase provides auth.uid() natively, this is for documentation)

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- 3.1 profiles (extends auth.users)
-- --------------------------------------------------------------------------
-- Supabase convention : auth.users is managed by Supabase Auth.
-- We store custom app fields in a public.profiles table linked 1:1.

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  is_premium      boolean not null default false,
  premium_since   date,
  trial_expires_at timestamptz,

  -- RevenueCat (remplace Stripe)
  revenuecat_app_user_id  text,
  subscription_id         text,
  subscription_status     text,       -- active, expired, billing_issue, etc.

  -- Quotas IA
  messages_remaining      integer not null default 10,
  messages_daily_reset    date,
  actions_remaining       integer not null default 3,
  actions_daily_reset     date,
  scans_this_week         integer not null default 0,
  scans_week_start        date,

  -- Preferences coach IA
  coach_tone              coach_tone default 'encouraging',
  coach_topics            jsonb default '["health","nutrition","training","behavior"]'::jsonb,

  -- Points & gamification
  points                  integer not null default 0,

  -- Onboarding flags
  premium_onboarding_nudge_shown  boolean not null default false,
  premium_welcome_seen            boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create profile on auth.users insert
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- --------------------------------------------------------------------------
-- 3.2 dogs
-- --------------------------------------------------------------------------

create table dogs (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references profiles(id) on delete cascade,

  name                  text not null,
  photo                 text,                    -- Storage URL
  breed                 text,
  birth_date            date,
  sex                   dog_sex,
  neutered              boolean,
  weight                numeric(5,2),            -- kg, ex: 32.50
  activity_level        activity_level,
  environment           dog_environment,
  allergies             text,
  health_issues         text,

  -- Diet
  diet_type             diet_type,
  diet_brand            text,
  diet_restrictions     text,

  -- Vet info
  vet_name              text,
  vet_city              text,
  next_vet_appointment  date,
  chip_number           text,

  -- Profile enrichment
  personality_tags      jsonb default '[]'::jsonb,
  owner_goal            text,
  status                dog_status default 'healthy',
  behavior_summary      text,
  onboarding_completed  boolean not null default false,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger dogs_updated_at
  before update on dogs
  for each row execute function set_updated_at();

create index idx_dogs_owner_id on dogs(owner_id);

-- --------------------------------------------------------------------------
-- 3.3 health_records
-- --------------------------------------------------------------------------

create table health_records (
  id          uuid primary key default gen_random_uuid(),
  dog_id      uuid not null references dogs(id) on delete cascade,
  owner_id    uuid not null references profiles(id) on delete cascade,

  type        health_record_type not null,
  title       text not null,
  date        date not null,
  next_date   date,                    -- rappel vaccin, prochain RDV
  value       numeric(5,2),            -- poids en kg (type=weight)
  details     text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger health_records_updated_at
  before update on health_records
  for each row execute function set_updated_at();

create index idx_health_records_dog_id on health_records(dog_id);
create index idx_health_records_owner_id on health_records(owner_id);
create index idx_health_records_type_date on health_records(dog_id, type, date);

-- --------------------------------------------------------------------------
-- 3.4 daily_checkins
-- --------------------------------------------------------------------------

create table daily_checkins (
  id              uuid primary key default gen_random_uuid(),
  dog_id          uuid not null references dogs(id) on delete cascade,
  owner_id        uuid not null references profiles(id) on delete cascade,

  date            date not null,
  mood            smallint not null check (mood between 1 and 4),
  energy          smallint not null check (energy between 1 and 3),
  appetite        smallint not null check (appetite between 1 and 3),
  symptoms        text[] default '{}',
  notes           text,
  behavior_notes  text,
  ai_response     text,

  created_at      timestamptz not null default now(),

  -- 1 seul check-in par chien par jour
  unique (dog_id, date)
);

create index idx_daily_checkins_dog_id on daily_checkins(dog_id);
create index idx_daily_checkins_owner_id on daily_checkins(owner_id);
create index idx_daily_checkins_date on daily_checkins(dog_id, date desc);

-- --------------------------------------------------------------------------
-- 3.5 daily_logs
-- --------------------------------------------------------------------------

create table daily_logs (
  id                uuid primary key default gen_random_uuid(),
  dog_id            uuid not null references dogs(id) on delete cascade,
  owner_id          uuid not null references profiles(id) on delete cascade,

  date              date not null,
  walk_minutes      integer,
  walk_distance_km  numeric(5,2),
  walk_mood         text,
  walk_tags         jsonb default '[]'::jsonb,
  notes             text,
  water_bowls       integer,
  weight_kg         numeric(5,2),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger daily_logs_updated_at
  before update on daily_logs
  for each row execute function set_updated_at();

create index idx_daily_logs_dog_id on daily_logs(dog_id);
create index idx_daily_logs_owner_id on daily_logs(owner_id);
create index idx_daily_logs_date on daily_logs(dog_id, date desc);

-- --------------------------------------------------------------------------
-- 3.6 streaks
-- --------------------------------------------------------------------------

create table streaks (
  id                    uuid primary key default gen_random_uuid(),
  dog_id                uuid not null references dogs(id) on delete cascade,
  owner_id              uuid not null references profiles(id) on delete cascade,

  current_streak        integer not null default 0,
  longest_streak        integer not null default 0,
  last_activity_date    date,
  grace_days_used       integer not null default 0,
  grace_days_remaining  integer not null default 1,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- 1 streak par chien
  unique (dog_id)
);

create trigger streaks_updated_at
  before update on streaks
  for each row execute function set_updated_at();

create index idx_streaks_owner_id on streaks(owner_id);

-- --------------------------------------------------------------------------
-- 3.7 food_scans
-- --------------------------------------------------------------------------

create table food_scans (
  id              uuid primary key default gen_random_uuid(),
  dog_id          uuid not null references dogs(id) on delete cascade,
  owner_id        uuid not null references profiles(id) on delete cascade,

  photo_url       text,                    -- Supabase Storage URL
  food_name       text,
  verdict         scan_verdict,
  score           smallint check (score is null or score between 0 and 10),
  summary         text,
  details         text,
  recommendation  text,
  allergen_alerts jsonb,                   -- bool ou array selon contexte
  mode            scan_mode default 'food',
  timestamp       timestamptz not null default now(),

  created_at      timestamptz not null default now()
);

create index idx_food_scans_dog_id on food_scans(dog_id);
create index idx_food_scans_owner_id on food_scans(owner_id);
create index idx_food_scans_timestamp on food_scans(dog_id, timestamp desc);

-- --------------------------------------------------------------------------
-- 3.8 user_progress (exercices dressage)
-- --------------------------------------------------------------------------

create table user_progress (
  id              uuid primary key default gen_random_uuid(),
  dog_id          uuid not null references dogs(id) on delete cascade,
  owner_id        uuid not null references profiles(id) on delete cascade,

  exercise_id     text not null,
  completed       boolean not null default false,
  completed_date  date,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- 1 progress par exercice par chien
  unique (dog_id, exercise_id)
);

create trigger user_progress_updated_at
  before update on user_progress
  for each row execute function set_updated_at();

create index idx_user_progress_dog_id on user_progress(dog_id);
create index idx_user_progress_owner_id on user_progress(owner_id);

-- --------------------------------------------------------------------------
-- 3.9 diagnosis_reports
-- --------------------------------------------------------------------------

create table diagnosis_reports (
  id              uuid primary key default gen_random_uuid(),
  dog_id          uuid not null references dogs(id) on delete cascade,
  owner_id        uuid not null references profiles(id) on delete cascade,

  dog_name        text,
  dog_breed       text,
  dog_weight      numeric(5,2),
  symptoms        text not null,
  duration        text,
  additional_info text,
  diagnosis_text  jsonb not null,          -- rapport complet structure
  urgency_level   urgency_level not null default 'low',
  report_date     date not null default current_date,

  created_at      timestamptz not null default now()
);

create index idx_diagnosis_reports_dog_id on diagnosis_reports(dog_id);
create index idx_diagnosis_reports_owner_id on diagnosis_reports(owner_id);
create index idx_diagnosis_reports_date on diagnosis_reports(dog_id, report_date desc);

-- --------------------------------------------------------------------------
-- 3.10 nutrition_plans
-- --------------------------------------------------------------------------

create table nutrition_plans (
  id                        uuid primary key default gen_random_uuid(),
  dog_id                    uuid not null references dogs(id) on delete cascade,
  owner_id                  uuid not null references profiles(id) on delete cascade,

  plan_text                 jsonb not null,          -- plan structure genere par LLM
  is_active                 boolean not null default false,
  dog_weight_at_generation  numeric(5,2),
  notes                     text,
  generated_at              timestamptz not null default now(),

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create trigger nutrition_plans_updated_at
  before update on nutrition_plans
  for each row execute function set_updated_at();

create index idx_nutrition_plans_dog_id on nutrition_plans(dog_id);
create index idx_nutrition_plans_owner_id on nutrition_plans(owner_id);
create index idx_nutrition_plans_active on nutrition_plans(dog_id) where is_active = true;

-- --------------------------------------------------------------------------
-- 3.11 bookmarks
-- --------------------------------------------------------------------------

create table bookmarks (
  id              uuid primary key default gen_random_uuid(),
  dog_id          uuid references dogs(id) on delete cascade,   -- nullable (some bookmarks are user-level)
  owner_id        uuid not null references profiles(id) on delete cascade,

  source          bookmark_source not null,
  title           text,
  content         text not null,           -- JSON ou Markdown selon source
  completed_days  text[] default '{}',     -- ["d0","d1",...] pour programmes

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger bookmarks_updated_at
  before update on bookmarks
  for each row execute function set_updated_at();

create index idx_bookmarks_owner_id on bookmarks(owner_id);
create index idx_bookmarks_dog_id on bookmarks(dog_id);

-- --------------------------------------------------------------------------
-- 3.12 weekly_insights
-- --------------------------------------------------------------------------

create table weekly_insights (
  id                    uuid primary key default gen_random_uuid(),
  dog_id                uuid not null references dogs(id) on delete cascade,
  owner_id              uuid not null references profiles(id) on delete cascade,

  week_start            date not null,
  checkin_count         integer not null default 0,
  avg_mood              numeric(3,2),
  avg_energy            numeric(3,2),
  avg_appetite          numeric(3,2),
  exercises_completed   integer not null default 0,
  scans_done            integer not null default 0,
  summary               text,
  highlights            jsonb default '[]'::jsonb,
  recommendations       jsonb default '[]'::jsonb,
  is_read               boolean not null default false,

  created_at            timestamptz not null default now(),

  -- 1 insight par chien par semaine
  unique (dog_id, week_start)
);

create index idx_weekly_insights_dog_id on weekly_insights(dog_id);
create index idx_weekly_insights_owner_id on weekly_insights(owner_id);

-- --------------------------------------------------------------------------
-- 3.13 shared_vet_access
-- --------------------------------------------------------------------------

create table shared_vet_access (
  id                uuid primary key default gen_random_uuid(),
  dog_id            uuid not null references dogs(id) on delete cascade,
  owner_id          uuid not null references profiles(id) on delete cascade,

  vet_email         text not null,
  vet_name          text,
  vet_user_id       uuid references profiles(id),   -- si le veto a un compte
  status            vet_access_status not null default 'pending',
  shared_sections   jsonb not null default '["vaccine","weight","vet_visit","medication","note"]'::jsonb,
  invite_code       text not null,
  invite_expires_at timestamptz not null,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger shared_vet_access_updated_at
  before update on shared_vet_access
  for each row execute function set_updated_at();

create index idx_shared_vet_access_dog_id on shared_vet_access(dog_id);
create index idx_shared_vet_access_owner_id on shared_vet_access(owner_id);
create index idx_shared_vet_access_vet_email on shared_vet_access(vet_email);
create unique index idx_shared_vet_access_invite_code on shared_vet_access(invite_code);

-- --------------------------------------------------------------------------
-- 3.14 dog_achievements
-- --------------------------------------------------------------------------

create table dog_achievements (
  id              uuid primary key default gen_random_uuid(),
  dog_id          uuid not null references dogs(id) on delete cascade,
  owner_id        uuid not null references profiles(id) on delete cascade,

  badge_id        text not null,
  badge_name      text not null,
  badge_emoji     text,
  points_awarded  integer not null default 0,
  category        achievement_category not null,
  unlocked_at     timestamptz not null default now(),

  created_at      timestamptz not null default now(),

  -- 1 badge par type par chien
  unique (dog_id, badge_id)
);

create index idx_dog_achievements_dog_id on dog_achievements(dog_id);
create index idx_dog_achievements_owner_id on dog_achievements(owner_id);

-- --------------------------------------------------------------------------
-- 3.15 diet_preferences
-- --------------------------------------------------------------------------

create table diet_preferences (
  id                  uuid primary key default gen_random_uuid(),
  dog_id              uuid not null references dogs(id) on delete cascade,
  owner_id            uuid not null references profiles(id) on delete cascade,

  preferred_brands    jsonb default '[]'::jsonb,
  disliked_foods      text,
  meal_times          jsonb,                   -- {"morning": "08:00", "noon": "12:00", "evening": "19:00"}
  portions_per_day    smallint,
  budget_monthly      budget_level,
  organic_preference  boolean default false,
  notes               text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- 1 preference par chien
  unique (dog_id)
);

create trigger diet_preferences_updated_at
  before update on diet_preferences
  for each row execute function set_updated_at();

create index idx_diet_preferences_owner_id on diet_preferences(owner_id);

-- --------------------------------------------------------------------------
-- 3.16 growth_entries
-- --------------------------------------------------------------------------

create table growth_entries (
  id                    uuid primary key default gen_random_uuid(),
  dog_id                uuid not null references dogs(id) on delete cascade,
  owner_id              uuid not null references profiles(id) on delete cascade,

  date                  date not null,
  weight_kg             numeric(5,2),
  height_cm             numeric(5,1),
  body_condition_score  smallint check (body_condition_score is null or body_condition_score between 1 and 9),
  growth_stage          growth_stage,
  source                growth_source default 'manual',
  photo_url             text,
  ai_notes              text,

  created_at            timestamptz not null default now()
);

create index idx_growth_entries_dog_id on growth_entries(dog_id);
create index idx_growth_entries_owner_id on growth_entries(owner_id);
create index idx_growth_entries_date on growth_entries(dog_id, date desc);

-- --------------------------------------------------------------------------
-- 3.17 park_reviews
-- --------------------------------------------------------------------------

create table park_reviews (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id) on delete cascade,

  park_osm_id text not null,
  park_name   text not null,
  park_lat    numeric(9,6) not null,
  park_lng    numeric(9,6) not null,
  dog_name    text,
  dog_breed   text,
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  tags        text[] default '{}',

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger park_reviews_updated_at
  before update on park_reviews
  for each row execute function set_updated_at();

create index idx_park_reviews_owner_id on park_reviews(owner_id);
create index idx_park_reviews_park_osm_id on park_reviews(park_osm_id);

-- --------------------------------------------------------------------------
-- 3.18 place_favorites
-- --------------------------------------------------------------------------

create table place_favorites (
  id              uuid primary key default gen_random_uuid(),
  dog_id          uuid references dogs(id) on delete cascade,   -- nullable
  owner_id        uuid not null references profiles(id) on delete cascade,

  place_name      text not null,
  place_type      text,
  address         text,
  phone           text,
  google_maps_url text,
  website         text,
  rating          numeric(2,1),
  notes           text,
  lat             numeric(9,6),
  lng             numeric(9,6),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger place_favorites_updated_at
  before update on place_favorites
  for each row execute function set_updated_at();

create index idx_place_favorites_owner_id on place_favorites(owner_id);

-- --------------------------------------------------------------------------
-- 3.19 chat_messages
-- --------------------------------------------------------------------------

create table chat_messages (
  id          uuid primary key default gen_random_uuid(),
  dog_id      uuid not null references dogs(id) on delete cascade,
  owner_id    uuid not null references profiles(id) on delete cascade,

  role        chat_role not null,
  content     text not null,
  has_image   boolean default false,
  image_url   text,
  timestamp   timestamptz not null default now(),

  created_at  timestamptz not null default now()
);

create index idx_chat_messages_dog_id on chat_messages(dog_id);
create index idx_chat_messages_owner_id on chat_messages(owner_id);
create index idx_chat_messages_timestamp on chat_messages(dog_id, timestamp desc);

-- --------------------------------------------------------------------------
-- 3.20 vet_notes
-- --------------------------------------------------------------------------

create table vet_notes (
  id          uuid primary key default gen_random_uuid(),
  dog_id      uuid not null references dogs(id) on delete cascade,
  vet_user_id uuid not null references profiles(id) on delete cascade,

  vet_email   text not null,
  vet_name    text,
  title       text not null,
  content     text not null,
  category    vet_note_category not null default 'observation',
  is_urgent   boolean not null default false,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger vet_notes_updated_at
  before update on vet_notes
  for each row execute function set_updated_at();

create index idx_vet_notes_dog_id on vet_notes(dog_id);
create index idx_vet_notes_vet_user_id on vet_notes(vet_user_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on ALL tables
alter table profiles enable row level security;
alter table dogs enable row level security;
alter table health_records enable row level security;
alter table daily_checkins enable row level security;
alter table daily_logs enable row level security;
alter table streaks enable row level security;
alter table food_scans enable row level security;
alter table user_progress enable row level security;
alter table diagnosis_reports enable row level security;
alter table nutrition_plans enable row level security;
alter table bookmarks enable row level security;
alter table weekly_insights enable row level security;
alter table shared_vet_access enable row level security;
alter table dog_achievements enable row level security;
alter table diet_preferences enable row level security;
alter table growth_entries enable row level security;
alter table park_reviews enable row level security;
alter table place_favorites enable row level security;
alter table chat_messages enable row level security;
alter table vet_notes enable row level security;

-- --------------------------------------------------------------------------
-- 4.1 profiles — user can only read/update their own profile
-- --------------------------------------------------------------------------

create policy "profiles_select_own"
  on profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid());

-- No insert policy — handled by trigger on auth.users
-- No delete policy — handled by auth.users cascade

-- --------------------------------------------------------------------------
-- 4.2 dogs — owner can CRUD their own dogs
-- --------------------------------------------------------------------------

create policy "dogs_select_own"
  on dogs for select
  using (owner_id = auth.uid());

create policy "dogs_insert_own"
  on dogs for insert
  with check (owner_id = auth.uid());

create policy "dogs_update_own"
  on dogs for update
  using (owner_id = auth.uid());

create policy "dogs_delete_own"
  on dogs for delete
  using (owner_id = auth.uid());

-- Vets can read dogs they have active access to
create policy "dogs_select_vet"
  on dogs for select
  using (
    exists (
      select 1 from shared_vet_access sva
      where sva.dog_id = dogs.id
        and sva.vet_user_id = auth.uid()
        and sva.status = 'active'
    )
  );

-- --------------------------------------------------------------------------
-- 4.3 Generic pattern: dog-owned tables (owner_id = auth.uid())
-- --------------------------------------------------------------------------

-- health_records
create policy "health_records_select_own" on health_records for select using (owner_id = auth.uid());
create policy "health_records_insert_own" on health_records for insert with check (owner_id = auth.uid());
create policy "health_records_update_own" on health_records for update using (owner_id = auth.uid());
create policy "health_records_delete_own" on health_records for delete using (owner_id = auth.uid());

-- Vet read access to health_records (only shared sections)
create policy "health_records_select_vet" on health_records for select
  using (
    exists (
      select 1 from shared_vet_access sva
      where sva.dog_id = health_records.dog_id
        and sva.vet_user_id = auth.uid()
        and sva.status = 'active'
        and sva.shared_sections ? health_records.type::text
    )
  );

-- daily_checkins
create policy "daily_checkins_select_own" on daily_checkins for select using (owner_id = auth.uid());
create policy "daily_checkins_insert_own" on daily_checkins for insert with check (owner_id = auth.uid());
create policy "daily_checkins_update_own" on daily_checkins for update using (owner_id = auth.uid());
create policy "daily_checkins_delete_own" on daily_checkins for delete using (owner_id = auth.uid());

-- daily_logs
create policy "daily_logs_select_own" on daily_logs for select using (owner_id = auth.uid());
create policy "daily_logs_insert_own" on daily_logs for insert with check (owner_id = auth.uid());
create policy "daily_logs_update_own" on daily_logs for update using (owner_id = auth.uid());
create policy "daily_logs_delete_own" on daily_logs for delete using (owner_id = auth.uid());

-- streaks
create policy "streaks_select_own" on streaks for select using (owner_id = auth.uid());
create policy "streaks_insert_own" on streaks for insert with check (owner_id = auth.uid());
create policy "streaks_update_own" on streaks for update using (owner_id = auth.uid());
create policy "streaks_delete_own" on streaks for delete using (owner_id = auth.uid());

-- food_scans
create policy "food_scans_select_own" on food_scans for select using (owner_id = auth.uid());
create policy "food_scans_insert_own" on food_scans for insert with check (owner_id = auth.uid());
create policy "food_scans_delete_own" on food_scans for delete using (owner_id = auth.uid());

-- user_progress
create policy "user_progress_select_own" on user_progress for select using (owner_id = auth.uid());
create policy "user_progress_insert_own" on user_progress for insert with check (owner_id = auth.uid());
create policy "user_progress_update_own" on user_progress for update using (owner_id = auth.uid());
create policy "user_progress_delete_own" on user_progress for delete using (owner_id = auth.uid());

-- diagnosis_reports
create policy "diagnosis_reports_select_own" on diagnosis_reports for select using (owner_id = auth.uid());
create policy "diagnosis_reports_insert_own" on diagnosis_reports for insert with check (owner_id = auth.uid());
create policy "diagnosis_reports_delete_own" on diagnosis_reports for delete using (owner_id = auth.uid());

-- nutrition_plans
create policy "nutrition_plans_select_own" on nutrition_plans for select using (owner_id = auth.uid());
create policy "nutrition_plans_insert_own" on nutrition_plans for insert with check (owner_id = auth.uid());
create policy "nutrition_plans_update_own" on nutrition_plans for update using (owner_id = auth.uid());
create policy "nutrition_plans_delete_own" on nutrition_plans for delete using (owner_id = auth.uid());

-- bookmarks
create policy "bookmarks_select_own" on bookmarks for select using (owner_id = auth.uid());
create policy "bookmarks_insert_own" on bookmarks for insert with check (owner_id = auth.uid());
create policy "bookmarks_update_own" on bookmarks for update using (owner_id = auth.uid());
create policy "bookmarks_delete_own" on bookmarks for delete using (owner_id = auth.uid());

-- weekly_insights
create policy "weekly_insights_select_own" on weekly_insights for select using (owner_id = auth.uid());
create policy "weekly_insights_insert_own" on weekly_insights for insert with check (owner_id = auth.uid());
create policy "weekly_insights_update_own" on weekly_insights for update using (owner_id = auth.uid());

-- shared_vet_access — owner manages, vet reads
create policy "shared_vet_access_select_own" on shared_vet_access for select using (owner_id = auth.uid());
create policy "shared_vet_access_insert_own" on shared_vet_access for insert with check (owner_id = auth.uid());
create policy "shared_vet_access_update_own" on shared_vet_access for update using (owner_id = auth.uid());
create policy "shared_vet_access_delete_own" on shared_vet_access for delete using (owner_id = auth.uid());
create policy "shared_vet_access_select_vet" on shared_vet_access for select using (vet_user_id = auth.uid());

-- dog_achievements
create policy "dog_achievements_select_own" on dog_achievements for select using (owner_id = auth.uid());
create policy "dog_achievements_insert_own" on dog_achievements for insert with check (owner_id = auth.uid());

-- diet_preferences
create policy "diet_preferences_select_own" on diet_preferences for select using (owner_id = auth.uid());
create policy "diet_preferences_insert_own" on diet_preferences for insert with check (owner_id = auth.uid());
create policy "diet_preferences_update_own" on diet_preferences for update using (owner_id = auth.uid());

-- growth_entries
create policy "growth_entries_select_own" on growth_entries for select using (owner_id = auth.uid());
create policy "growth_entries_insert_own" on growth_entries for insert with check (owner_id = auth.uid());
create policy "growth_entries_delete_own" on growth_entries for delete using (owner_id = auth.uid());

-- park_reviews — public read, owner write
create policy "park_reviews_select_all" on park_reviews for select using (true);
create policy "park_reviews_insert_own" on park_reviews for insert with check (owner_id = auth.uid());
create policy "park_reviews_update_own" on park_reviews for update using (owner_id = auth.uid());
create policy "park_reviews_delete_own" on park_reviews for delete using (owner_id = auth.uid());

-- place_favorites
create policy "place_favorites_select_own" on place_favorites for select using (owner_id = auth.uid());
create policy "place_favorites_insert_own" on place_favorites for insert with check (owner_id = auth.uid());
create policy "place_favorites_update_own" on place_favorites for update using (owner_id = auth.uid());
create policy "place_favorites_delete_own" on place_favorites for delete using (owner_id = auth.uid());

-- chat_messages
create policy "chat_messages_select_own" on chat_messages for select using (owner_id = auth.uid());
create policy "chat_messages_insert_own" on chat_messages for insert with check (owner_id = auth.uid());
create policy "chat_messages_delete_own" on chat_messages for delete using (owner_id = auth.uid());

-- vet_notes — vet writes, owner reads via dog ownership
create policy "vet_notes_select_vet" on vet_notes for select using (vet_user_id = auth.uid());
create policy "vet_notes_insert_vet" on vet_notes for insert with check (vet_user_id = auth.uid());
create policy "vet_notes_update_vet" on vet_notes for update using (vet_user_id = auth.uid());
create policy "vet_notes_delete_vet" on vet_notes for delete using (vet_user_id = auth.uid());
create policy "vet_notes_select_owner" on vet_notes for select
  using (
    exists (
      select 1 from dogs d
      where d.id = vet_notes.dog_id
        and d.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. STORAGE BUCKETS
-- ============================================================================

-- Execute via Supabase Dashboard or Storage API:
-- Bucket: dog-photos     (public read, auth write)
-- Bucket: food-scans     (private, auth write)
-- Bucket: growth-photos  (private, auth write)
-- Bucket: health-docs    (private, auth write)
-- Bucket: chat-images    (private, auth write)

-- Storage RLS example (apply via Dashboard):
-- INSERT: auth.uid()::text = (storage.foldername(name))[1]
-- SELECT: auth.uid()::text = (storage.foldername(name))[1]
-- Convention: store files as {user_uuid}/{filename}

-- ============================================================================
-- 6. QUOTA ENFORCEMENT FUNCTIONS (server-side)
-- ============================================================================

-- Check and consume message credit (called by Edge Functions)
create or replace function check_and_consume_message_credit()
returns boolean as $$
declare
  profile_row profiles%rowtype;
begin
  select * into profile_row from profiles where id = auth.uid() for update;

  -- Premium users: unlimited
  if profile_row.is_premium or (profile_row.trial_expires_at is not null and profile_row.trial_expires_at > now()) then
    return true;
  end if;

  -- Reset if new day
  if profile_row.messages_daily_reset is null or profile_row.messages_daily_reset < current_date then
    update profiles set
      messages_remaining = 9,  -- 10 - 1 (consuming this one)
      messages_daily_reset = current_date
    where id = auth.uid();
    return true;
  end if;

  -- Check quota
  if profile_row.messages_remaining <= 0 then
    return false;
  end if;

  -- Consume
  update profiles set messages_remaining = messages_remaining - 1
  where id = auth.uid();
  return true;
end;
$$ language plpgsql security definer;

-- Check and consume action credit
create or replace function check_and_consume_action_credit()
returns boolean as $$
declare
  profile_row profiles%rowtype;
begin
  select * into profile_row from profiles where id = auth.uid() for update;

  if profile_row.is_premium or (profile_row.trial_expires_at is not null and profile_row.trial_expires_at > now()) then
    return true;
  end if;

  if profile_row.actions_daily_reset is null or profile_row.actions_daily_reset < current_date then
    update profiles set
      actions_remaining = 2,
      actions_daily_reset = current_date
    where id = auth.uid();
    return true;
  end if;

  if profile_row.actions_remaining <= 0 then
    return false;
  end if;

  update profiles set actions_remaining = actions_remaining - 1
  where id = auth.uid();
  return true;
end;
$$ language plpgsql security definer;

-- Check scan limit (weekly)
create or replace function check_and_consume_scan_credit()
returns boolean as $$
declare
  profile_row profiles%rowtype;
  week_start date;
begin
  select * into profile_row from profiles where id = auth.uid() for update;

  if profile_row.is_premium or (profile_row.trial_expires_at is not null and profile_row.trial_expires_at > now()) then
    return true;
  end if;

  -- Calculate week start (Monday)
  week_start := date_trunc('week', current_date)::date;

  if profile_row.scans_week_start is null or profile_row.scans_week_start < week_start then
    update profiles set
      scans_this_week = 1,
      scans_week_start = week_start
    where id = auth.uid();
    return true;
  end if;

  if profile_row.scans_this_week >= 3 then
    return false;
  end if;

  update profiles set scans_this_week = scans_this_week + 1
  where id = auth.uid();
  return true;
end;
$$ language plpgsql security definer;

-- Dog count enforcement
create or replace function check_dog_limit()
returns trigger as $$
declare
  dog_count integer;
  is_prem boolean;
  trial_exp timestamptz;
begin
  select is_premium, trial_expires_at into is_prem, trial_exp
  from profiles where id = new.owner_id;

  select count(*) into dog_count from dogs where owner_id = new.owner_id;

  -- Premium: max 3, Free: max 1
  if is_prem or (trial_exp is not null and trial_exp > now()) then
    if dog_count >= 3 then
      raise exception 'Premium dog limit reached (max 3)';
    end if;
  else
    if dog_count >= 1 then
      raise exception 'Free dog limit reached (max 1). Upgrade to premium.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_dog_limit
  before insert on dogs
  for each row execute function check_dog_limit();

-- ============================================================================
-- 7. CRON JOBS (pg_cron)
-- ============================================================================
-- Note: les cron jobs appellent des Edge Functions via pg_net.
-- Configurer apres le deploiement des Edge Functions.
-- Syntaxe de reference:

-- select cron.schedule('vaccine-reminders',  '0 9 * * *',   $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/vaccine-reminders',   headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
-- select cron.schedule('streak-reminder',    '0 20 * * *',  $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/streak-reminder',    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
-- select cron.schedule('walk-reminder',      '0 10 * * *',  $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/walk-reminder',      headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
-- select cron.schedule('weekly-insight',     '0 8 * * 1',   $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/weekly-insight',     headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
-- select cron.schedule('monthly-summary',    '0 8 1 * *',   $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/monthly-summary',    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
-- select cron.schedule('trial-expiry',       '0 10 * * *',  $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/trial-expiry',       headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
-- select cron.schedule('medication-reminder','0 9 * * *',   $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/medication-reminder', headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
-- select cron.schedule('vet-visit-reminder', '0 9 * * *',   $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/vet-visit-reminder', headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
