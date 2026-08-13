export type Exercise = {
  id: string;
  name: string;
  category?: string | null;
  body_part?: string | null;
  equipment?: string | null;
  target_muscle?: string | null;
  secondary_muscles: string[];
  instructions_en?: string | null;
  thumbnail_url?: string | null;
  gif_url?: string | null;
};

export type DayExercise = {
  id: string;
  exercise_id: string;
  prescribed_sets: number;
  prescribed_reps?: string | null;
  exercise: Exercise | null;
};

export type PlanDay = {
  id: string;
  day_of_week: number;
  label: string;
  target_muscles: string[];
  is_rest_day: boolean;
  recovery_nudges: string[];
  exercises: DayExercise[];
};

export type Plan = {
  id: string;
  user_id: string;
  split_type: string;
  generated_at: string;
  days: PlanDay[];
};

export type Profile = {
  id: string;
  age: number;
  weight_kg?: number | null;
  height_cm?: number | null;
  sex?: string | null;
  experience_years: number;
  goal: string;
  days_per_week: number;
  equipment_access: string;
  split_preference: string;
  created_at: string;
};

export type ProfileInput = Omit<Profile, "id" | "created_at">;

export type Session = {
  id: string;
  user_id: string;
  plan_day_id?: string | null;
  started_at: string;
  completed_at?: string | null;
  sets: LoggedSet[];
  cardio: CardioLog[];
};

export type LoggedSet = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg?: number | null;
  reps?: number | null;
  logged_at: string;
};

export type CardioLog = {
  id: string;
  session_id: string;
  activity_type: string;
  duration_minutes?: number | null;
  distance_km?: number | null;
  calories?: number | null;
};

export type LiftPoint = {
  date: string;
  weight_kg?: number | null;
  volume: number;
};

export type MuscleBalance = {
  muscle: string;
  sets: number;
};
