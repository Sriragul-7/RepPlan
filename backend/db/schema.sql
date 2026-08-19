-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.exercises (
  id text NOT NULL,
  name text NOT NULL,
  category text,
  body_part text,
  equipment text,
  target_muscle text,
  secondary_muscles jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions_en text,
  thumbnail_url text,
  gif_url text,
  slug text,
  CONSTRAINT exercises_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  age integer,
  weight_kg numeric,
  height_cm numeric,
  sex text,
  experience_years numeric,
  goal text,
  days_per_week integer,
  equipment_access text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  split_preference text,
  full_name text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.weekly_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  split_type text NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT weekly_plans_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.plan_days (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  weekly_plan_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  target_muscles jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_rest_day boolean NOT NULL DEFAULT false,
  CONSTRAINT plan_days_pkey PRIMARY KEY (id),
  CONSTRAINT plan_days_weekly_plan_id_fkey FOREIGN KEY (weekly_plan_id) REFERENCES public.weekly_plans(id)
);
CREATE TABLE public.plan_day_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_day_id uuid NOT NULL,
  exercise_id text NOT NULL,
  prescribed_sets integer NOT NULL DEFAULT 3,
  prescribed_reps text,
  CONSTRAINT plan_day_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT plan_day_exercises_plan_day_id_fkey FOREIGN KEY (plan_day_id) REFERENCES public.plan_days(id),
  CONSTRAINT plan_day_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.workout_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_day_id uuid,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT workout_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT workout_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT workout_sessions_plan_day_id_fkey FOREIGN KEY (plan_day_id) REFERENCES public.plan_days(id)
);
CREATE TABLE public.logged_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  exercise_id text NOT NULL,
  set_number integer NOT NULL,
  weight_kg numeric,
  reps integer,
  logged_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT logged_sets_pkey PRIMARY KEY (id),
  CONSTRAINT logged_sets_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.workout_sessions(id),
  CONSTRAINT logged_sets_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.cardio_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  activity_type text NOT NULL,
  duration_minutes integer,
  distance_km numeric,
  calories integer,
  CONSTRAINT cardio_logs_pkey PRIMARY KEY (id),
  CONSTRAINT cardio_logs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.workout_sessions(id)
);
CREATE TABLE public.coach_conversations (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  user_id text NOT NULL,
  title text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coach_conversations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.coach_messages (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  conversation_id text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coach_messages_pkey PRIMARY KEY (id),
  CONSTRAINT coach_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.coach_conversations(id)
);