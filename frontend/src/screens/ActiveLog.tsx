import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "../components/BottomSheet";
import { Button } from "../components/Button";
import { GlassCard } from "../components/GlassCard";
import { CheckIcon, ChevronDownIcon, CloseIcon, PlusIcon, TimerIcon } from "../components/icons";
import { ExerciseImage } from "../components/ExerciseImage";
import { NumberKeypad } from "../components/NumberKeypad";
import { RestTimer } from "../components/RestTimer";
import { Skeleton } from "../components/Skeleton";
import { Stepper } from "../components/Stepper";
import { SwipeRow } from "../components/SwipeRow";
import { api } from "../lib/api";
import { STORAGE_KEYS } from "../lib/constants";
import type { CardioLog, DayExercise, LiftPoint, LoggedSet, Profile } from "../lib/types";

const COMPOUND_RE = /squat|bench|deadlift|row|press|pull-up|chin-up|push-up|dip|lunge|clean|snatch|thruster|overhead|hip thrust|good morning|farmer/i;

function restSecondsFor(exercise: DayExercise | undefined): number {
  const name = exercise?.exercise?.name ?? exercise?.name ?? "";
  if (COMPOUND_RE.test(name)) return 150;
  const target = exercise?.exercise?.target_muscle ?? "";
  if (/abs|calves|forearms/.test(target)) return 60;
  return 90;
}

function roundToPlate(n: number): number {
  return Math.max(0, Math.round(n / 2.5) * 2.5);
}

function defaultWeightFor(exercise: DayExercise, profile?: Profile | null, lastWeight?: number | null): number {
  if (lastWeight && lastWeight > 0) return lastWeight;
  const name = exercise?.exercise?.name ?? exercise?.name ?? "";
  const equipment = exercise?.exercise?.equipment ?? "";
  const bw = profile?.weight_kg;
  if (bw) {
    if (/bodyweight/i.test(equipment) || /bodyweight/i.test(name)) return bw;
    if (COMPOUND_RE.test(name)) return roundToPlate(bw * 0.4);
    return roundToPlate(bw * 0.2);
  }
  const stored = Number(localStorage.getItem(STORAGE_KEYS.LAST_WEIGHT) ?? 0);
  return stored > 0 ? stored : 20;
}

export function ActiveLog() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const dayId = params.get("day");
  const muscle = params.get("muscle");
  const calendarDate = params.get("date");

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: api.getProfile,
    enabled: false,
    placeholderData: (prev) => prev,
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [resolvedDayId, setResolvedDayId] = useState<string | null>(null);
  const [exerciseList, setExerciseList] = useState<DayExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<DayExercise | null>(null);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [cardioLogs, setCardioLogs] = useState<CardioLog[]>([]);
  const [cardioOpen, setCardioOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [weightCheckinOpen, setWeightCheckinOpen] = useState(false);
  const [checkinWeight, setCheckinWeight] = useState(70);

  const latestMetricQuery = useQuery({
    queryKey: ["body-metric-latest"],
    queryFn: api.getLatestBodyMetric,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    const metric = latestMetricQuery.data;
    if (metric && metric.logged_at) {
      const lastDate = new Date(metric.logged_at);
      const now = new Date();
      const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince >= 14) {
        setCheckinWeight(Math.round(metric.weight_kg ?? 70));
        setWeightCheckinOpen(true);
      }
    }
  }, [latestMetricQuery.data]);

  const weightCheckinMutation = useMutation({
    mutationFn: () => api.logBodyMetric({ weight_kg: checkinWeight }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["body-metric-latest"] });
      setWeightCheckinOpen(false);
    },
  });

  const exercisesQuery = useQuery({
    queryKey: ["exercises-all"],
    queryFn: () => api.searchExercises(),
    enabled: searchOpen || !!muscle,
    placeholderData: (prev) => prev,
  });

  const muscleSearchResults = useMemo(() => {
    if (!muscle || !exercisesQuery.data) return [];
    const m = muscle.toLowerCase();
    return exercisesQuery.data.filter(
      (ex) => (ex.target_muscle ?? "").toLowerCase().includes(m) ||
              (ex.body_part ?? "").toLowerCase().includes(m),
    );
  }, [muscle, exercisesQuery.data]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return exercisesQuery.data ?? [];
    const q = searchQuery.toLowerCase();
    return (exercisesQuery.data ?? []).filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        (ex.body_part ?? "").toLowerCase().includes(q) ||
        (ex.target_muscle ?? "").toLowerCase().includes(q) ||
        (ex.equipment ?? "").toLowerCase().includes(q),
    );
  }, [searchQuery, exercisesQuery.data]);

  const addExercise = (exercise: (typeof searchResults)[number]) => {
    const existing = exerciseList.find((e) => e.exercise_id === exercise.id);
    if (existing) return;
    const newEntry: DayExercise = {
      id: crypto.randomUUID(),
      exercise_id: exercise.id,
      name: exercise.name,
      target_muscle: exercise.target_muscle ?? undefined,
      equipment: exercise.equipment ?? undefined,
      thumbnail_url: exercise.thumbnail_url ?? undefined,
      gif_url: exercise.gif_url ?? undefined,
      prescribed_sets: 3,
      prescribed_reps: "8-12",
      exercise,
    };
    setExerciseList((prev) => [...prev, newEntry]);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const [rest, setRest] = useState<{ seconds: number; active: boolean; id: number }>({
    seconds: 0,
    active: false,
    id: 0,
  });

  const loadInit = useCallback(async () => {
    try {
      let list: DayExercise[] = [];
      let session: Awaited<ReturnType<typeof api.startSession>> | null = null;
      let effectiveDayId = dayId;
      let planDayExercises: DayExercise[] | null = null;

      const existing = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);

      const loadSession = existing
        ? api.getSession(existing).catch(() => null).then((s) => {
            if (!s || s.completed_at) {
              localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
              return null;
            }
            const sessionDate = s.started_at.slice(0, 10);
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            const targetDate = calendarDate ?? todayStr;
            if (sessionDate !== targetDate) {
              localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
              return null;
            }
            return s;
          })
        : Promise.resolve(null);

      const loadPlan = !effectiveDayId && !muscle && !calendarDate
        ? api.getPlan(true).catch(() => null)
        : Promise.resolve(null);

      const [sessionResult, plan] = await Promise.all([loadSession, loadPlan]);
      session = sessionResult;

      if (plan) {
        const today = ((new Date().getDay() + 6) % 7) + 1;
        const day = plan.days.find((d) => d.day_of_week === today && !d.is_rest_day);
        if (day) {
          effectiveDayId = day.id;
          planDayExercises = day.exercises as DayExercise[];
        }
      }

      if (!effectiveDayId && !muscle && session?.plan_day_id) {
        effectiveDayId = session.plan_day_id;
      }

      let listPromise: Promise<DayExercise[]> | null = null;
      if (planDayExercises) {
        listPromise = Promise.resolve(planDayExercises);
      } else if (effectiveDayId) {
        listPromise = api.getPlanDay(effectiveDayId, true).then((d) => d.exercises);
      } else if (muscle && !calendarDate) {
        const profile = await api.getProfile();
        listPromise = api.muscleFocus(muscle, profile?.equipment_access ?? "full gym", profile?.goal ?? "hypertrophy");
      } else if (session?.plan_day_id) {
        listPromise = api.getPlanDay(session.plan_day_id, true).then((d) => d.exercises);
      }

      const sessionDate = calendarDate ?? new Date().toISOString().slice(0, 10);

      const [listResult, newSession] = await Promise.all([
        listPromise ?? Promise.resolve([]),
        session
          ? Promise.resolve(session)
          : (() => {
              return api.startSession(effectiveDayId ?? undefined, sessionDate).then((s) => {
                localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, s.id);
                return s;
              });
            })(),
      ]);

      session = newSession;
      list = listResult;

      setSessionId(session.id);
      setResolvedDayId(effectiveDayId);
      setExerciseList(list);
      setLoggedSets(session.sets ?? []);
      setCardioLogs(session.cardio ?? []);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session");
      setLoading(false);
    }
  }, [dayId, muscle, calendarDate]);

  useEffect(() => {
    loadInit();
  }, [loadInit]);

  const totalPrescribed = exerciseList.reduce((acc, e) => acc + e.prescribed_sets, 0);
  const totalLogged = exerciseList.reduce(
    (acc, e) => acc + loggedSets.filter((s) => s.exercise_id === e.exercise_id).length,
    0,
  );

  const logSet = async (exercise: DayExercise, setNumber: number, weight: number, reps: number) => {
    if (!sessionId) return;
    const row = await api.logSet(sessionId, {
      exercise_id: exercise.exercise_id,
      set_number: setNumber,
      weight_kg: weight,
      reps,
    });
    localStorage.setItem(STORAGE_KEYS.LAST_WEIGHT, String(weight));
    setLoggedSets((s) => [...s, row]);
    setRest((r) => ({ seconds: restSecondsFor(exercise), active: true, id: r.id + 1 }));
  };

  const complete = useMutation({
    mutationFn: async () => {
      if (!sessionId) return;
      await api.completeSession(sessionId);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions-week"] });
      queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
      queryClient.invalidateQueries({ queryKey: ["session-history"] });
      queryClient.invalidateQueries({ queryKey: ["lifts"] });
      navigate("/app", { replace: true });
    },
  });

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-44" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-card flex items-center gap-4 p-5">
            <Skeleton variant="circle" className="h-16 w-16" />
            <div className="flex-1 space-y-3">
              <Skeleton className="w-3/5" />
              <Skeleton className="w-2/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-ivory text-lg font-semibold">Something went wrong</p>
        <p className="mt-2 text-sm text-stone">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            loadInit();
          }}
          className="mt-6 rounded-full bg-ivory px-6 py-3 text-sm font-semibold text-ink transition active:scale-95"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-5 pb-8">
      {/* Premium Header */}
      <header className="flex items-end justify-between pt-3">
        <div className="flex-1">
          <p className="font-accent text-[10px] font-semibold uppercase tracking-[0.3em] text-stone">
            {resolvedDayId ? "Today's session" : muscle ? `${muscle} focus` : "Session"}
          </p>
          <h1 className="font-display mt-1.5 text-[40px] font-bold leading-[1.05] text-ivory">
            Log
            <br />
            workout
          </h1>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => navigate("/app/history")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.06] text-silver backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.1] active:scale-95"
            aria-label="Workout history"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="5" width="18" height="16" rx="3" />
              <path d="M8 3v4M16 3v4M3 10h18" />
              <path d="M8 15h.01M12 15h.01M16 15h.01" />
            </svg>
          </button>
          <button
            onClick={() => complete.mutate()}
            disabled={complete.isPending}
            className="flex h-10 items-center rounded-full border border-white/[0.1] bg-white/[0.06] px-5 text-[13px] font-semibold text-silver backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.1] active:scale-95"
          >
            {complete.isPending ? "…" : "End session"}
          </button>
        </div>
      </header>

      {/* Premium Progress Bar */}
      <div className="glass-card glass-shine overflow-hidden px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="font-accent text-[10px] font-semibold uppercase tracking-[0.25em] text-stone">
            Progress
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-[28px] font-bold leading-none text-ivory">
              {totalLogged}
            </span>
            <span className="font-data text-sm text-ash">/ {totalPrescribed} sets</span>
          </div>
        </div>
        <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-ivory shadow-glow transition-all duration-700 ease-out"
            style={{ width: `${totalPrescribed ? (totalLogged / totalPrescribed) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-2 text-right font-data text-[10px] text-ash">
          {totalPrescribed ? Math.round((totalLogged / totalPrescribed) * 100) : 0}% complete
        </p>
      </div>

      {/* Muscle Search UI - shown when coming from calendar with muscle */}
      {muscle && calendarDate && exerciseList.length === 0 && (
        <div className="space-y-4">
          <div className="glass-card px-5 py-4">
            <p className="font-accent text-[10px] font-semibold uppercase tracking-[0.25em] text-stone">
              Training
            </p>
            <p className="font-display mt-1 text-[24px] font-bold capitalize text-ivory">
              {muscle}
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${muscle} exercises...`}
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 pl-11 text-[15px] text-ivory placeholder-ash outline-none backdrop-blur-xl transition-all focus:border-white/[0.15] focus:bg-white/[0.06]"
            />
            <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          <div className="ios-list">
            {exercisesQuery.isLoading ? (
              <div className="ios-row justify-center py-8">
                <p className="text-sm text-ash">Loading exercises...</p>
              </div>
            ) : (searchQuery.trim() ? searchResults : muscleSearchResults).length === 0 ? (
              <div className="ios-row justify-center py-8">
                <p className="text-sm text-ash">No exercises found for {muscle}</p>
              </div>
            ) : (
              (searchQuery.trim() ? searchResults : muscleSearchResults).map((ex) => {
                const alreadyAdded = exerciseList.some((e) => e.exercise_id === ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => !alreadyAdded && addExercise(ex)}
                    disabled={alreadyAdded}
                    className={`ios-row ${alreadyAdded ? "opacity-40" : "ios-tap"}`}
                  >
                    <ExerciseImage
                      thumbnailUrl={ex.thumbnail_url}
                      gifUrl={ex.gif_url}
                      alt={ex.name}
                      className="h-12 w-12 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.03]"
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-[15px] font-semibold text-ivory">{ex.name}</p>
                      <p className="mt-0.5 text-[11px] text-stone">
                        {ex.target_muscle ?? ex.body_part ?? ""}
                        {ex.equipment ? ` · ${ex.equipment}` : ""}
                      </p>
                    </div>
                    {alreadyAdded ? (
                      <span className="text-[11px] text-ash">Added</span>
                    ) : (
                      <PlusIcon className="h-4 w-4 text-silver" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Exercise Cards */}
      {exerciseList.length > 0 && (
      <section>
        <h3 className="font-accent text-[10px] font-semibold uppercase tracking-[0.25em] text-stone px-1 pt-2 pb-2.5">
          {exerciseList.length} exercises
        </h3>
        <div className="ios-list">
          {exerciseList.map((item) => {
            const ex = item.exercise ?? item;
            const done = loggedSets.filter((s) => s.exercise_id === item.exercise_id).length;
            return (
              <button
                key={item.exercise_id}
                onClick={() => setActive(item)}
                className="ios-row ios-tap group"
              >
                <ExerciseImage
                  thumbnailUrl={ex?.thumbnail_url}
                  gifUrl={ex?.gif_url}
                  alt={ex?.name ?? ""}
                  className="h-[68px] w-[68px] shrink-0 rounded-[20px] border border-white/[0.08] bg-white/[0.03]"
                />
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-display truncate text-[17px] font-semibold text-ivory leading-tight">
                    {ex?.name ?? item.exercise_id}
                  </p>
                  <p className="mt-1 font-data text-[11px] text-stone">
                    {item.prescribed_sets} sets{" "}
                    <span className="text-ash/60">·</span>{" "}
                    {item.prescribed_reps ?? "8-12"} reps
                  </p>
                  <div className="mt-2.5 flex gap-1.5">
                    {Array.from({ length: item.prescribed_sets }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-[6px] rounded-full transition-all duration-500 ${
                          i < done
                            ? "w-[6px] bg-ivory shadow-glow"
                            : "w-[6px] bg-white/[0.08]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-center gap-1">
                  {done > 0 && (
                    <span className="font-data text-[11px] font-semibold text-ivory">
                      {done}/{item.prescribed_sets}
                    </span>
                  )}
                  <ChevronDownIcon className="h-4 w-4 text-ash/60 transition-transform group-hover:text-silver group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
      )}

      {/* Add Exercise */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex w-full items-center justify-center gap-2.5 rounded-[20px] border border-dashed border-white/[0.1] bg-white/[0.03] py-5 text-[13px] font-medium text-silver backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.06] active:scale-[0.98]"
      >
        <PlusIcon className="h-4 w-4" />
        Add exercise
      </button>

      {/* Cardio Section */}
      <section>
        <h3 className="font-accent text-[10px] font-semibold uppercase tracking-[0.25em] text-stone px-1 pt-2 pb-2.5">
          Cardio
        </h3>
        <div className="ios-list">
          {cardioLogs.length === 0 ? (
            <div className="ios-row justify-center py-8">
              <p className="font-accent text-center text-sm text-ash">Nothing logged yet this session</p>
            </div>
          ) : (
            cardioLogs.map((c) => (
              <div key={c.id} className="ios-row">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-silver border border-white/[0.06]">
                  <TimerIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-semibold capitalize text-ivory">{c.activity_type}</p>
                  <p className="mt-0.5 font-data text-[11px] text-stone">
                    {c.duration_minutes ?? 0} min
                    {c.distance_km != null ? ` · ${c.distance_km} km` : ""}
                    {c.calories != null ? ` · ${c.calories} kcal` : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => setCardioOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-[20px] border border-dashed border-white/[0.1] bg-white/[0.03] py-5 text-[13px] font-medium text-silver backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.06] active:scale-[0.98]"
        >
          <PlusIcon className="h-4 w-4" />
          Add cardio
        </button>
      </section>

      <BottomSheet open={!!active} onClose={() => setActive(null)} title={active?.exercise?.name ?? ""}>
        {active ? (
          <SetSheet
            exercise={active}
            loggedSets={loggedSets}
            profile={profileQuery.data}
            onLog={logSet}
          />
        ) : null}
      </BottomSheet>

      <CardioSheet
        open={cardioOpen}
        onClose={() => setCardioOpen(false)}
        sessionId={sessionId}
        onLog={(log) => setCardioLogs((prev) => [...prev, log])}
      />

      <BottomSheet open={searchOpen} onClose={() => { setSearchOpen(false); setSearchQuery(""); }} title="Add exercise">
        <div className="space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            autoFocus
            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[15px] text-ivory placeholder-ash outline-none backdrop-blur-xl transition-all focus:border-white/[0.15] focus:bg-white/[0.06]"
          />
          <div className="max-h-[50vh] overflow-y-auto space-y-1">
            {exercisesQuery.isLoading ? (
              <div className="py-8 text-center text-sm text-ash">Loading exercises...</div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center text-sm text-ash">No exercises found</div>
            ) : (
              searchResults.map((ex) => {
                const alreadyAdded = exerciseList.some((e) => e.exercise_id === ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => !alreadyAdded && addExercise(ex)}
                    disabled={alreadyAdded}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                      alreadyAdded
                        ? "opacity-40"
                        : "hover:bg-white/[0.04] active:scale-[0.98]"
                    }`}
                  >
                    <ExerciseImage
                      thumbnailUrl={ex.thumbnail_url}
                      gifUrl={ex.gif_url}
                      alt={ex.name}
                      className="h-12 w-12 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.03]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ivory">{ex.name}</p>
                      <p className="mt-0.5 text-[11px] text-stone">
                        {ex.target_muscle ?? ex.body_part ?? ""}
                        {ex.equipment ? ` · ${ex.equipment}` : ""}
                      </p>
                    </div>
                    {alreadyAdded ? (
                      <span className="text-[11px] text-ash">Added</span>
                    ) : (
                      <PlusIcon className="h-4 w-4 text-silver" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </BottomSheet>

      <RestTimer
        seconds={rest.seconds}
        active={rest.active}
        id={rest.id}
        onFinish={() => setRest((r) => ({ ...r, active: false }))}
        onSkip={() => setRest((r) => ({ ...r, active: false }))}
      />

      <BottomSheet open={weightCheckinOpen} onClose={() => setWeightCheckinOpen(false)} title="Weight check-in">
        <div className="space-y-5">
          <p className="text-[14px] text-stone">
            It's been a while since your last weight entry. Log your current weight to keep your coach up to date.
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-display text-[56px] font-bold text-ivory">{checkinWeight}</span>
            <span className="font-data text-sm text-ash">kg</span>
          </div>
          <Stepper value={checkinWeight} min={30} max={300} onChange={setCheckinWeight} />
          <div className="flex gap-3">
            <Button variant="chrome" full onClick={() => setWeightCheckinOpen(false)}>
              Skip
            </Button>
            <Button full onClick={() => weightCheckinMutation.mutate()} disabled={weightCheckinMutation.isPending}>
              {weightCheckinMutation.isPending ? "Saving…" : "Log weight"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

/* ---------------------------------------------------------------- Set sheet */

function lastPoint(points: LiftPoint[] | undefined): { weight: number | null; reps: number | null } {
  const last = points && points.length > 0 ? points[points.length - 1] : undefined;
  return { weight: last?.weight_kg ?? null, reps: last?.reps ?? null };
}

function SetSheet({
  exercise,
  loggedSets,
  profile,
  onLog,
}: {
  exercise: DayExercise;
  loggedSets: LoggedSet[];
  profile?: Profile | null;
  onLog: (e: DayExercise, setNumber: number, weight: number, reps: number) => void;
}) {
  const done = loggedSets.filter((s) => s.exercise_id === exercise.exercise_id);
  const last = done[done.length - 1];

  const historyQuery = useQuery({
    queryKey: ["lift-progress", exercise.exercise_id],
    queryFn: () => api.progressForExercise(exercise.exercise_id),
    enabled: !last,
  });
  const lastLog = lastPoint(historyQuery.data);
  const suggestedWeight = defaultWeightFor(
    exercise,
    profile,
    last?.weight_kg ?? lastLog.weight,
  );
  const suggestedReps = last?.reps ?? lastLog.reps ?? Number.parseInt(
    (exercise.prescribed_reps ?? "10").split("-")[1] ?? "10",
  );

  const [inputs, setInputs] = useState<Record<number, { weight: number; reps: number }>>({});
  const [keypadFor, setKeypadFor] = useState<{ setNumber: number; field: "weight" | "reps" } | null>(null);

  const nextPending = exercise.prescribed_sets;
  const repeatLast = () => {
    if (!last || !last.weight_kg || !last.reps) return;
    setInputs((s) => ({ ...s, [nextPending]: { weight: last.weight_kg!, reps: last.reps! } }));
  };

  const keypadValue = keypadFor ? inputs[keypadFor.setNumber]?.[keypadFor.field] : undefined;

  return (
    <div className="space-y-3.5">
      <ExerciseImage
        thumbnailUrl={exercise.exercise?.thumbnail_url ?? exercise.thumbnail_url}
        gifUrl={exercise.exercise?.gif_url ?? exercise.gif_url}
        alt={exercise.exercise?.name ?? ""}
        className="h-44 w-full rounded-[24px] border border-white/[0.08] bg-white/[0.03]"
      />
      {last ? (
        <button
          onClick={repeatLast}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3.5 text-[13px] font-semibold text-silver backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.08] active:scale-[0.98]"
        >
          <span className="text-ivory">↻</span>
          Repeat last set
        </button>
      ) : null}

      {/* Set Counter Header */}
      <div className="flex items-baseline justify-between px-1 pt-1">
        <p className="font-accent text-[10px] font-semibold uppercase tracking-[0.25em] text-stone">
          Sets
        </p>
        <p className="font-data text-[11px] text-ash">
          {done.length} / {exercise.prescribed_sets} logged
        </p>
      </div>

      {Array.from({ length: exercise.prescribed_sets }).map((_, i) => {
        const n = i + 1;
        const logged = done.find((s) => s.set_number === n);
        if (logged) {
          return (
            <GlassCard key={n} className="flex items-center justify-between border-white/[0.08] !p-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ivory text-ink shadow-glow">
                  <CheckIcon className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">
                    SET {n}
                  </p>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="font-display text-[22px] font-bold text-ivory">
                      {logged.weight_kg ?? 0}
                    </span>
                    <span className="font-data text-[11px] text-ash">kg</span>
                    <span className="mx-1 text-ash/40">×</span>
                    <span className="font-display text-[22px] font-bold text-ivory">
                      {logged.reps ?? 0}
                    </span>
                    <span className="font-data text-[11px] text-ash">reps</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        }

        const value = inputs[n] ?? { weight: suggestedWeight, reps: suggestedReps };

        const setValue = (field: "weight" | "reps", v: number) =>
          setInputs((s) => ({ ...s, [n]: { ...(s[n] ?? value), [field]: v } }));

        const editing = keypadFor?.setNumber === n;

        return (
          <div key={n}>
            {editing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">
                    SET {n}
                  </p>
                  <button
                    onClick={() => setKeypadFor(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-ash transition-all hover:bg-white/[0.1]"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-display text-[56px] font-bold leading-none text-ivory">
                    {keypadValue ?? (keypadFor.field === "weight" ? value.weight : value.reps)}
                  </span>
                  <span className="font-data text-sm font-medium text-ash">
                    {keypadFor.field === "weight" ? "kg" : "reps"}
                  </span>
                </div>
                <NumberKeypad
                  decimals={keypadFor.field === "weight" ? 1 : 0}
                  onDigit={(d) =>
                    setInputs((s) => {
                      const cur = s[n] ?? value;
                      const field = keypadFor.field;
                      const current = String(cur[field]);
                      const next = current === "0" && d !== "." ? d : current + d;
                      return { ...s, [n]: { weight: s[n]?.weight ?? value.weight, reps: s[n]?.reps ?? value.reps, [field]: Number(next) } };
                    })
                  }
                  onBackspace={() =>
                    setInputs((s) => {
                      const cur = s[n] ?? value;
                      const field = keypadFor.field;
                      const next = String(cur[field]).slice(0, -1);
                      return { ...s, [n]: { weight: s[n]?.weight ?? value.weight, reps: s[n]?.reps ?? value.reps, [field]: Number(next || 0) } };
                    })
                  }
                  onClear={() =>
                    setInputs((s) => ({ ...s, [n]: { weight: s[n]?.weight ?? value.weight, reps: s[n]?.reps ?? value.reps, [keypadFor.field]: 0 } }))
                  }
                  onDone={() => setKeypadFor(null)}
                />
              </div>
            ) : (
              <SwipeRow onConfirm={() => onLog(exercise, n, value.weight, value.reps)}>
                <GlassCard className="space-y-3.5 !p-4 border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <p className="font-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">
                      SET {n}
                    </p>
                    <span className="font-accent text-[10px] text-ash/60">
                      <span className="lg:hidden">swipe →</span>
                      <span className="hidden lg:inline">tap below to log</span>
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {/* Weight Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-accent text-[10px] font-semibold uppercase tracking-wider text-ash">kg</span>
                        <Stepper
                          value={value.weight}
                          step={2.5}
                          decimals={1}
                          min={0}
                          max={400}
                          onChange={(v) => setValue("weight", v)}
                          onValueTap={() => setKeypadFor({ setNumber: n, field: "weight" })}
                        />
                      </div>
                      <button
                        onClick={() => setKeypadFor({ setNumber: n, field: "weight" })}
                        aria-label="Type weight"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-silver backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.08] active:scale-90"
                      >
                        <span className="font-data text-xs">⌨</span>
                      </button>
                    </div>
                    {/* Reps Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-accent text-[10px] font-semibold uppercase tracking-wider text-ash">reps</span>
                        <Stepper
                          value={value.reps}
                          step={1}
                          min={0}
                          max={100}
                          onChange={(v) => setValue("reps", v)}
                          onValueTap={() => setKeypadFor({ setNumber: n, field: "reps" })}
                        />
                      </div>
                      <button
                        onClick={() => setKeypadFor({ setNumber: n, field: "reps" })}
                        aria-label="Type reps"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-silver backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.08] active:scale-90"
                      >
                        <span className="font-data text-xs">⌨</span>
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </SwipeRow>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- Cardio sheet */

const CARDIO_TYPES = ["Running", "Cycling", "Rowing", "Stair climber", "Elliptical", "Walk"];

function CardioSheet({
  open,
  onClose,
  sessionId,
  onLog,
}: {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
  onLog: (log: CardioLog) => void;
}) {
  const queryClient = useQueryClient();
  const [activity, setActivity] = useState(CARDIO_TYPES[0]);
  const [duration, setDuration] = useState(20);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);

  const mutation = useMutation({
    mutationFn: () =>
      api.logCardio(sessionId!, {
        activity_type: activity,
        duration_minutes: duration,
        distance_km: distance || undefined,
        calories: calories || undefined,
      }),
    onSuccess: (log) => {
      queryClient.invalidateQueries({ queryKey: ["sessions-week"] });
      queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
      onLog(log);
      onClose();
    },
  });

  return (
    <BottomSheet open={open} onClose={onClose} title="Cardio">
      <div className="space-y-5">
        {/* Activity Type Pills */}
        <div className="flex flex-wrap gap-2">
          {CARDIO_TYPES.map((c) => (
            <button
              key={c}
              onClick={() => setActivity(c)}
              className={`rounded-full border px-4 py-2.5 text-[13px] font-medium transition-all duration-300 active:scale-95 ${
                activity === c
                  ? "border-ivory/20 bg-ivory text-ink shadow-glow"
                  : "border-white/[0.08] bg-white/[0.04] text-silver backdrop-blur-xl hover:bg-white/[0.08]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Cardio Steppers */}
        <GlassCard className="space-y-4 border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="font-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">Duration</span>
            <span className="font-display text-[18px] font-bold text-ivory">{duration} <span className="font-data text-xs text-ash">min</span></span>
          </div>
          <Stepper label="mins" value={duration} min={1} max={300} onChange={setDuration} />
          <div className="h-px bg-white/[0.06]" />
          <div className="flex items-center justify-between">
            <span className="font-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">Distance</span>
            <span className="font-display text-[18px] font-bold text-ivory">{distance || 0} <span className="font-data text-xs text-ash">km</span></span>
          </div>
          <Stepper label="km" value={distance} step={0.5} decimals={1} min={0} max={100} onChange={setDistance} />
          <div className="h-px bg-white/[0.06]" />
          <div className="flex items-center justify-between">
            <span className="font-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">Calories</span>
            <span className="font-display text-[18px] font-bold text-ivory">{calories || 0} <span className="font-data text-xs text-ash">kcal</span></span>
          </div>
          <Stepper label="kcal" value={calories} step={10} min={0} max={2000} onChange={setCalories} />
        </GlassCard>

        <Button variant="chrome" full onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Logging…" : "Log cardio"}
        </Button>
      </div>
    </BottomSheet>
  );
}
