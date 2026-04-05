-- ============================================================================
-- compute_health_score(p_dog_id UUID) RETURNS JSONB
-- Formule 40/30/30 :
--   Vaccins  40% — % de vaccins a jour dans health_records (type=vaccine)
--   Poids    30% — ecart entre dernier poids mesure et poids reference du chien
--   Activite 30% — streak current + daily_logs des 30 derniers jours
--
-- Retour attendu par le frontend (HealthScoreData) :
--   { total, vaccine_score, weight_score, activity_score,
--     next_vaccine_title, next_vaccine_date }
--
-- Appliquee via migrations :
--   20260405144919_compute_health_score_function
--   20260405162849_fix_compute_health_score_division_by_zero
--   20260405xxxxxx_fix_compute_health_score_return_shape  (ce fix)
-- ============================================================================

create or replace function compute_health_score(p_dog_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score_vaccins   numeric;
  v_score_poids     numeric;
  v_score_activite  numeric;
  v_score_total     numeric;

  v_total_vaccins   integer;
  v_vaccins_a_jour  integer;

  v_dog_weight      numeric;
  v_last_weight     numeric;
  v_weight_diff_pct numeric;

  v_current_streak  integer;
  v_logs_30j        integer;

  v_next_vaccine_title  text;
  v_next_vaccine_date   date;
begin
  -- ------------------------------------------------
  -- 40% VACCINS
  -- "a jour" = next_date IS NULL OR next_date >= CURRENT_DATE
  -- ------------------------------------------------
  select
    count(*),
    count(*) filter (where next_date is null or next_date >= current_date)
  into v_total_vaccins, v_vaccins_a_jour
  from health_records
  where dog_id = p_dog_id and type = 'vaccine';

  if v_total_vaccins = 0 then
    v_score_vaccins := 0;
  else
    v_score_vaccins := (v_vaccins_a_jour::numeric / v_total_vaccins) * 100;
  end if;

  -- ------------------------------------------------
  -- 30% POIDS
  -- Compare dernier poids mesure vs poids reference (dogs.weight)
  -- Donnees manquantes -> score neutre 50
  -- Plages : <=5% ecart = 100, <=10% = 75, <=15% = 50, <=20% = 25, >20% = 0
  -- ------------------------------------------------
  select weight into v_dog_weight from dogs where id = p_dog_id;

  select value into v_last_weight
  from health_records
  where dog_id = p_dog_id
    and type = 'weight'
    and value is not null
  order by date desc
  limit 1;

  if v_dog_weight is null or v_dog_weight = 0 or v_last_weight is null then
    v_score_poids := 50;
  else
    v_weight_diff_pct := abs(v_last_weight - v_dog_weight) / v_dog_weight * 100;
    if v_weight_diff_pct <= 5 then
      v_score_poids := 100;
    elsif v_weight_diff_pct <= 10 then
      v_score_poids := 75;
    elsif v_weight_diff_pct <= 15 then
      v_score_poids := 50;
    elsif v_weight_diff_pct <= 20 then
      v_score_poids := 25;
    else
      v_score_poids := 0;
    end if;
  end if;

  -- ------------------------------------------------
  -- 30% ACTIVITE
  -- streak >= 7 -> 100, 3-6 -> 75, 1-2 -> 50
  -- streak = 0 mais logs_30j > 0 -> 25, sinon 0
  -- ------------------------------------------------
  select current_streak into v_current_streak
  from streaks
  where dog_id = p_dog_id;

  select count(*) into v_logs_30j
  from daily_logs
  where dog_id = p_dog_id
    and date >= current_date - interval '30 days'
    and (walk_minutes is not null or weight_kg is not null);

  if v_current_streak is null then
    v_current_streak := 0;
  end if;

  if v_current_streak >= 7 then
    v_score_activite := 100;
  elsif v_current_streak >= 3 then
    v_score_activite := 75;
  elsif v_current_streak >= 1 then
    v_score_activite := 50;
  elsif v_logs_30j > 0 then
    v_score_activite := 25;
  else
    v_score_activite := 0;
  end if;

  -- ------------------------------------------------
  -- SCORE TOTAL (40/30/30)
  -- ------------------------------------------------
  v_score_total := round(
    (v_score_vaccins  * 0.40) +
    (v_score_poids    * 0.30) +
    (v_score_activite * 0.30)
  );

  -- ------------------------------------------------
  -- PROCHAIN VACCIN (pour alerte dashboard)
  -- Prend le vaccin dont next_date est le plus proche dans le futur
  -- ------------------------------------------------
  select title, next_date
  into v_next_vaccine_title, v_next_vaccine_date
  from health_records
  where dog_id = p_dog_id
    and type = 'vaccine'
    and next_date >= current_date
  order by next_date asc
  limit 1;

  return jsonb_build_object(
    'total',              v_score_total,
    'vaccine_score',      round(v_score_vaccins),
    'weight_score',       round(v_score_poids),
    'activity_score',     round(v_score_activite),
    'next_vaccine_title', v_next_vaccine_title,
    'next_vaccine_date',  v_next_vaccine_date
  );
end;
$$;
