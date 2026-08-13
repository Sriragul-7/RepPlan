import { getUserId } from "./user";
import type {
  CardioLog,
  DayExercise,
  Exercise,
  LiftPoint,
  LoggedSet,
  MuscleBalance,
  Plan,
  PlanDay,
  Profile,
  ProfileInput,
  Session,
} from "./types";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": getUserId(),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, typeof detail === "string" ? detail : res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getProfile: () => request<Profile>("/api/profile").catch((e) => (e.status === 404 ? null : Promise.reject(e))),
  saveProfile: (data: ProfileInput) =>
    request<Profile>("/api/profile", { method: "POST", body: JSON.stringify(data) }),
  generatePlan: () => request<Plan>("/api/plan/generate", { method: "POST" }),
  getPlan: () => request<Plan>("/api/plan/current").catch((e) => (e.status === 404 ? null : Promise.reject(e))),
  getPlanDay: (dayId: string) => request<PlanDay>(`/api/plan/day/${dayId}`),
  replanDay: (dayId: string) => request<Plan>(`/api/plan/day/${dayId}/replan`, { method: "POST" }),
  muscleFocus: (muscle: string, equipmentAccess?: string, goal?: string) =>
    request<DayExercise[]>(`/api/plan/muscle-focus`, {
      method: "POST",
      body: JSON.stringify({ muscle, equipment_access: equipmentAccess ?? "full gym", goal: goal ?? "hypertrophy" }),
    }),

  searchExercises: (filters: { body_part?: string; equipment?: string; target?: string } = {}) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v) params.set(k, v);
    }
    return request<Exercise[]>(`/api/exercises?${params.toString()}`);
  },
  swapExercise: (exerciseId: string, equipmentAccess: string) =>
    request<Exercise>(`/api/exercises/${exerciseId}/swap?equipment_access=${encodeURIComponent(equipmentAccess)}`),

  startSession: (planDayId?: string) =>
    request<Session>("/api/session/start", { method: "POST", body: JSON.stringify({ plan_day_id: planDayId ?? null }) }),
  sessionsThisWeek: () => request<Session[]>("/api/session/week"),
  getSession: (sessionId: string) => request<Session>(`/api/session/${sessionId}`),
  logSet: (sessionId: string, data: { exercise_id: string; set_number: number; weight_kg?: number; reps?: number }) =>
    request<LoggedSet>(`/api/session/${sessionId}/log-set`, { method: "POST", body: JSON.stringify(data) }),
  logCardio: (
    sessionId: string,
    data: { activity_type: string; duration_minutes?: number; distance_km?: number; calories?: number },
  ) => request<CardioLog>(`/api/session/${sessionId}/log-cardio`, { method: "POST", body: JSON.stringify(data) }),
  completeSession: (sessionId: string) =>
    request<Session>(`/api/session/${sessionId}/complete`, { method: "POST" }),

  progressForExercise: (exerciseId: string) => request<LiftPoint[]>(`/api/progress/${exerciseId}`),
  muscleBalance: () => request<MuscleBalance[]>("/api/progress/muscle-balance"),
};
