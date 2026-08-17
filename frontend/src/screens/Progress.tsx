import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { CalendarHeatmap } from "../components/CalendarHeatmap";
import { MuscleCategoryPicker } from "../components/MuscleCategoryPicker";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";
import { STORAGE_KEYS } from "../lib/constants";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function Progress() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: ["progress-overview"],
    queryFn: api.progressOverview,
    placeholderData: (prev) => prev,
  });

  const exercisesQuery = useQuery({
    queryKey: ["exercises-all"],
    queryFn: () => api.searchExercises(),
    placeholderData: (prev) => prev,
  });

  const exerciseMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ex of exercisesQuery.data ?? []) {
      map.set(ex.id, ex.name);
    }
    return map;
  }, [exercisesQuery.data]);

  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  const historyQuery = useQuery({
    queryKey: ["session-history", monthStart, monthEnd],
    queryFn: () => api.workoutHistory(monthStart, monthEnd),
    placeholderData: (prev) => prev,
  });

  const calendarData = useMemo(() => {
    const map = new Map<string, { sets: number; volume: number }>();
    const sessions = historyQuery.data ?? [];
    for (const s of sessions) {
      const key = s.started_at.slice(0, 10);
      const existing = map.get(key);
      const sessionSets = s.sets?.length ?? 0;
      const sessionVolume = (s.sets ?? []).reduce(
        (acc, set) => acc + (set.weight_kg ?? 0) * (set.reps ?? 0),
        0,
      );
      if (existing) {
        existing.sets += sessionSets;
        existing.volume += sessionVolume;
      } else {
        map.set(key, { sets: sessionSets, volume: sessionVolume });
      }
    }
    return map;
  }, [historyQuery.data]);

  const selectedSessions = useMemo(() => {
    if (!selectedDate) return [];
    const allSessions = historyQuery.data ?? [];
    return allSessions.filter((s) => s.started_at.slice(0, 10) === selectedDate);
  }, [selectedDate, historyQuery.data]);

  const sessionExercises = useMemo(() => {
    return selectedSessions.map((session) => {
      const byExercise = new Map<string, { weight: number | null; reps: number | null }[]>();
      for (const set of session.sets ?? []) {
        const exName = exerciseMap.get(set.exercise_id) ?? set.exercise_id;
        const existing = byExercise.get(exName) ?? [];
        existing.push({ weight: set.weight_kg ?? null, reps: set.reps ?? null });
        byExercise.set(exName, existing);
      }
      return Array.from(byExercise.entries()).map(([name, sets]) => ({ name, sets }));
    });
  }, [selectedSessions, exerciseMap]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  }

  const monthlyWorkouts = useMemo(() => {
    const weeks = overviewQuery.data?.weekly ?? [];
    return weeks.slice(-4);
  }, [overviewQuery.data]);

  const [musclePickerOpen, setMusclePickerOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const startForDate = useMutation({
    mutationFn: async ({ dateStr, muscle }: { dateStr: string; muscle: string }) => {
      const session = await api.startSession(undefined, dateStr);
      return session;
    },
    onSuccess: (session, variables) => {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, session.id);
      queryClient.invalidateQueries({ queryKey: ["session-history"] });
      navigate(`/log?muscle=${variables.muscle}&date=${variables.dateStr}`, { replace: true });
    },
  });

  const handleLogWorkout = (dateStr: string) => {
    setPendingDate(dateStr);
    setMusclePickerOpen(true);
  };

  const handleMuscleSelect = (muscle: string) => {
    if (pendingDate) {
      startForDate.mutate({ dateStr: pendingDate, muscle });
    }
    setPendingDate(null);
  };

  const maxMonthly = Math.max(1, ...monthlyWorkouts.map((w) => w.workouts));

  if (overviewQuery.isLoading && !overviewQuery.data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-7 w-44" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const overview = overviewQuery.data;

  return (
    <div className="animate-slide-up space-y-6">
      <header className="flex items-end justify-between pt-4">
        <div>
          <p className="font-data text-[11px] uppercase tracking-[0.28em] text-stone">Analytics</p>
          <h1 className="font-display mt-1.5 text-[38px] font-semibold leading-[1.1] text-white">Monthly report</h1>
        </div>
        {overview && overview.streak_weeks > 0 ? (
          <span className="mb-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 font-data text-[11px] text-chrome backdrop-blur-xl">
            {overview.streak_weeks}-week streak
          </span>
        ) : null}
      </header>

      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="text-stone hover:text-white transition-colors px-2 py-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h3 className="font-data text-[11px] uppercase tracking-[0.22em] text-stone">
            {monthNames[month]} {year}
          </h3>
          <button onClick={nextMonth} className="text-stone hover:text-white transition-colors px-2 py-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-xl">
          <CalendarHeatmap
            year={year}
            month={month}
            workoutData={calendarData}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>
      </div>

      {selectedDate && (
        <div className="animate-slide-up">
          <h3 className="ios-section-label">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </h3>
          {selectedSessions.length === 0 ? (
            <div className="ios-list">
              <div className="ios-row justify-center py-4">
                <p className="text-center text-sm text-stone">No workouts logged on this day.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSessions.map((session, sessionIndex) => (
                <div key={session.id} className="ios-list">
                  {session.completed_at && (
                    <div className="ios-row">
                      <svg className="h-4 w-4 text-stone" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="ml-2 text-sm text-stone">
                        {formatTime(session.started_at)} — {formatTime(session.completed_at)}
                      </span>
                    </div>
                  )}
                  {sessionExercises[sessionIndex]?.map((ex) => (
                    <div key={ex.name} className="ios-row flex-col items-start !py-3">
                      <span className="text-sm font-semibold text-white">{ex.name}</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {ex.sets.map((set, i) => (
                          <span
                            key={i}
                            className="rounded-lg bg-white/[0.06] px-2 py-1 font-data text-[11px] text-chrome"
                          >
                            {set.weight != null ? `${set.weight}kg` : "—"} × {set.reps ?? "—"}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {session.cardio && session.cardio.length > 0 && (
                    <div className="ios-row">
                      <span className="text-sm text-stone">Cardio</span>
                      <div className="flex-1" />
                      <span className="font-data text-sm text-chrome">
                        {session.cardio
                          .map((c) =>
                            [
                              c.activity_type,
                              c.duration_minutes ? `${c.duration_minutes}min` : null,
                              c.distance_km ? `${c.distance_km}km` : null,
                              c.calories ? `${c.calories}cal` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          )
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => handleLogWorkout(selectedDate)}
            disabled={startForDate.isPending}
            className="mt-3 w-full rounded-2xl border border-white/[0.08] bg-white/[0.06] px-5 py-3 text-[13px] font-semibold text-ivory backdrop-blur-xl transition-all duration-200 hover:bg-white/[0.12] hover:border-white/[0.15] active:scale-95 disabled:opacity-40"
          >
            {startForDate.isPending ? "Starting..." : "Log workout for this day"}
          </button>
        </div>
      )}

      <div>
        <h3 className="ios-section-label">Monthly rhythm</h3>
        <div className="ios-list">
          {monthlyWorkouts.length > 0 ? (
            monthlyWorkouts.map((w, i) => (
              <div key={w.week} className="ios-row">
                <span className={`w-16 shrink-0 text-sm ${i === monthlyWorkouts.length - 1 ? "font-semibold text-white" : "text-stone"}`}>
                  {w.week}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${(w.workouts / maxMonthly) * 100}%` }}
                  />
                </div>
                <span className="font-data w-8 shrink-0 text-right text-sm text-stone">{w.workouts}</span>
              </div>
            ))
          ) : (
            <div className="ios-row justify-center py-8">
              <p className="text-center text-sm text-stone">
                {overview && overview.total_workouts === 0
                  ? "Complete your first workout to unlock progress."
                  : "No data yet this month."}
              </p>
            </div>
          )}
        </div>
      </div>

      <MuscleCategoryPicker
        open={musclePickerOpen}
        onClose={() => {
          setMusclePickerOpen(false);
          setPendingDate(null);
        }}
        onSelect={handleMuscleSelect}
      />
    </div>
  );
}
