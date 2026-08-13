-- RepPlan schema
-- Applied via Supabase SQL editor (or `supabase db push`).

-- ============================================================
-- exercises (seeded from exercises-dataset)
-- ============================================================
create table if not exists public.exercises (
  id text primary key,
  name text not null,
  category text,
  body_part text,
  equipment text,
  target_muscle text,
  secondary_muscles jsonb not null default '[]'::jsonb,
  instructions_en text,
  thumbnail_url text,
  gif_url text
);

create index if not exists exercises_body_part_idx on public.exercises (body_part);
create index if not exists exercises_equipment_idx on public.exercises (equipment);
create index if not exists exercises_target_muscle_idx on public.exercises (target_muscle);

-- ============================================================
-- users
-- ============================================================
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  age int,
  weight_kg numeric,
  height_cm numeric,
  sex text,
  experience_years numeric,
  goal text,
  days_per_week int,
  equipment_access text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- weekly_plans
-- ============================================================
create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  split_type text not null,
  generated_at timestamptz not null default now()
);

create index if not exists weekly_plans_user_idx on public.weekly_plans (user_id);

-- ============================================================
-- plan_days
-- ============================================================
create table if not exists public.plan_days (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references public.weekly_plans (id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 7),
  target_muscles jsonb not null default '[]'::jsonb,
  is_rest_day boolean not null default false
);

create index if not exists plan_days_plan_idx on public.plan_days (weekly_plan_id);

-- ============================================================
-- plan_day_exercises
-- ============================================================
create table if not exists public.plan_day_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.plan_days (id) on delete cascade,
  exercise_id text not null references public.exercises (id),
  prescribed_sets int not null default 3,
  prescribed_reps text
);

create index if not exists plan_day_exercises_day_idx on public.plan_day_exercises (plan_day_id);

-- ============================================================
-- workout_sessions
-- ============================================================
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan_day_id uuid references public.plan_days (id),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists workout_sessions_user_idx on public.workout_sessions (user_id);

-- ============================================================
-- logged_sets
-- ============================================================
create table if not exists public.logged_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id text not null references public.exercises (id),
  set_number int not null,
  weight_kg numeric,
  reps int,
  logged_at timestamptz not null default now()
);

create index if not exists logged_sets_session_idx on public.logged_sets (session_id);
create index if not exists logged_sets_exercise_idx on public.logged_sets (exercise_id);

-- ============================================================
-- cardio_logs
-- ============================================================
create table if not exists public.cardio_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  activity_type text not null,
  duration_minutes int,
  distance_km numeric,
  calories int
);

create index if not exists cardio_logs_session_idx on public.cardio_logs (session_id);

-- ============================================================
-- Row Level Security
-- Users may only read/write their own rows.
-- ============================================================
alter table public.users enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.plan_day_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.logged_sets enable row level security;
alter table public.cardio_logs enable row level security;
alter table public.exercises enable row level security;

-- exercises is public reference data
create policy "exercises public read" on public.exercises
  for select using (true);

-- users: own row only
create policy "users own" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- plans & children scoped via user_id join
create policy "plans own" on public.weekly_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plan_days own" on public.plan_days
  for all using (
    auth.uid() in (select user_id from public.weekly_plans where id = weekly_plan_id)
  ) with check (
    auth.uid() in (select user_id from public.weekly_plans where id = weekly_plan_id)
  );

create policy "plan_day_exercises own" on public.plan_day_exercises
  for all using (
    auth.uid() in (
      select w.user_id from public.plan_days d
      join public.weekly_plans w on w.id = d.weekly_plan_id
      where d.id = plan_day_id
    )
  ) with check (
    auth.uid() in (
      select w.user_id from public.plan_days d
      join public.weekly_plans w on w.id = d.weekly_plan_id
      where d.id = plan_day_id
    )
  );

create policy "sessions own" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "logged_sets own" on public.logged_sets
  for all using (
    auth.uid() in (select user_id from public.workout_sessions where id = session_id)
  ) with check (
    auth.uid() in (select user_id from public.workout_sessions where id = session_id)
  );

create policy "cardio_logs own" on public.cardio_logs
  for all using (
    auth.uid() in (select user_id from public.workout_sessions where id = session_id)
  ) with check (
    auth.uid() in (select user_id from public.workout_sessions where id = session_id)
  );
