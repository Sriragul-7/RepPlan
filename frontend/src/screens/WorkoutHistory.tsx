import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { CalendarHeatmap, formatDateKey } from "../components/CalendarHeatmap";
import { GlassCard } from "../components/GlassCard";
import { MuscleCategoryPicker } from "../components/MuscleCategoryPicker";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { ChevronRightIcon, CheckIcon, TimerIcon } from "../components/icons";
import { STORAGE_KEYS } from "../lib/constants";
import type { Session } from "../lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function SessionExercises({ sets, exerciseNameMap }: { sets: { exercise_id: string; weight_kg?: number | null; reps?: number | null }[]; exerciseNameMap: Map<string, string> }) {
  const exerciseMap = useMemo(() => {
    const map = new Map<string, { name: string; sets: number; weight: number }>();
    for (const set of sets) {
      const existing = map.get(set.exercise_id) ?? {
        name: exerciseNameMap.get(set.exercise_id) ?? set.exercise_id,
        sets: 0,
        weight: 0,
      };
      existing.sets += 1;
      existing.weight = set.weight_kg ?? existing.weight;
      map.set(set.exercise_id, existing);
    }
    return Array.from(map.entries()).slice(0, 4);
  }, [sets, exerciseNameMap]);

  const totalExercises = useMemo(() => {
    const map = new Set(sets.map((s) => s.exercise_id));
    return map.size;
  }, [sets]);

  return (
    <>
      {exerciseMap.map(([id, data]) => (
        <div key={id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
          <span className="truncate text-sm text-ivory">{data.name}</span>
          <span className="font-data ml-2 shrink-0 text-xs text-stone">
            {data.sets} × {data.weight}kg
          </span>
        </div>
      ))}
      {totalExercises > 4 && (
        <p className="text-center text-xs text-ash">
          +{totalExercises - 4} more exercises
        </p>
      )}
    </>
  );
}

export function WorkoutHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const exercisesQuery = useQuery({
    queryKey: ["exercises-all"],
    queryFn: () => api.searchExercises(),
    placeholderData: (prev) => prev,
  });

  const exerciseNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ex of exercisesQuery.data ?? []) {
      map.set(ex.id, ex.name);
    }
    return map;
  }, [exercisesQuery.data]);

  const startDate = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
  }, [selectedYear, selectedMonth]);

  const endDate = useMemo(() => {
    const days = getDaysInMonth(selectedYear, selectedMonth);
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
  }, [selectedYear, selectedMonth]);

  const sessionsQuery = useQuery({
    queryKey: ["workout-history", startDate, endDate],
    queryFn: () => api.workoutHistory(startDate, endDate).catch(() => []),
    placeholderData: (prev) => prev,
  });

  const workoutData = useMemo(() => {
    const map = new Map<string, { sets: number; volume: number; sessions: Session[] }>();
    const sessions = sessionsQuery.data ?? [];

    for (const session of sessions) {
      const dateKey = session.started_at.slice(0, 10);
      const existing = map.get(dateKey) ?? { sets: 0, volume: 0, sessions: [] };
      existing.sets += session.sets?.length ?? 0;
      existing.volume += (session.sets ?? []).reduce(
        (acc, s) => acc + (s.weight_kg ?? 0) * (s.reps ?? 0),
        0,
      );
      existing.sessions.push(session);
      map.set(dateKey, existing);
    }

    return map;
  }, [sessionsQuery.data]);

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return workoutData.get(selectedDate) ?? null;
  }, [selectedDate, workoutData]);

  const [musclePickerOpen, setMusclePickerOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const startForDate = useMutation({
    mutationFn: async ({ dateStr, muscle: _muscle }: { dateStr: string; muscle: string }) => {
      return api.startSession(undefined, dateStr);
    },
    onSuccess: (session, variables) => {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, session.id);
      queryClient.invalidateQueries({ queryKey: ["workout-history"] });
      navigate(`/app/log?muscle=${variables.muscle}&date=${variables.dateStr}`, { replace: true });
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

  const monthStats = useMemo(() => {
    const sessions = sessionsQuery.data ?? [];
    const totalWorkouts = new Set(sessions.map((s) => s.started_at.slice(0, 10))).size;
    const totalSets = sessions.reduce((acc, s) => acc + (s.sets?.length ?? 0), 0);
    const totalVolume = sessions.reduce(
      (acc, s) => acc + (s.sets ?? []).reduce((a, set) => a + (set.weight_kg ?? 0) * (set.reps ?? 0), 0),
      0,
    );
    return { totalWorkouts, totalSets, totalVolume };
  }, [sessionsQuery.data]);

  const goToPrevMonth = useCallback(() => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [selectedMonth]);

  const goToNextMonth = useCallback(() => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [selectedMonth]);

  const goToToday = useCallback(() => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSelectedDate(formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()));
  }, []);

  if (sessionsQuery.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-44" />
        <CardSkeleton />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-5">
      <header className="flex items-end justify-between pt-2">
        <div>
          <p className="font-data text-[10px] uppercase tracking-[0.26em] text-stone">
            Calendar
          </p>
          <h1 className="font-display mt-1 text-[34px] leading-tight text-ivory">
            Workout history
          </h1>
        </div>
        <button
          onClick={goToToday}
          className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-ivory transition-all hover:bg-white/[0.08] active:scale-95"
        >
          Today
        </button>
      </header>

      {/* Month Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Workouts", value: monthStats.totalWorkouts },
          { label: "Sets", value: monthStats.totalSets },
          { label: "Volume", value: `${(monthStats.totalVolume / 1000).toFixed(1)}k` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card flex flex-col items-center py-3"
          >
            <span className="font-data text-xl text-ivory">{stat.value}</span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wider text-stone">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <GlassCard className="p-4">
        {/* Month navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-ivory transition-all hover:bg-white/[0.08] active:scale-95"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="text-center">
            <h2 className="font-display text-lg font-bold text-ivory">
              {MONTH_NAMES[selectedMonth]}
            </h2>
            <p className="text-xs text-stone">{selectedYear}</p>
          </div>
          <button
            onClick={goToNextMonth}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-ivory transition-all hover:bg-white/[0.08] active:scale-95"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <CalendarHeatmap
          year={selectedYear}
          month={selectedMonth}
          workoutData={workoutData}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Heatmap Legend */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-[10px] text-ash">Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-3 w-3 rounded-sm ${
                level === 0
                  ? "bg-white/[0.03]"
                  : level === 1
                    ? "bg-white/[0.08]"
                    : level === 2
                      ? "bg-white/[0.15]"
                      : level === 3
                        ? "bg-white/[0.25]"
                        : "bg-ivory"
              }`}
            />
          ))}
          <span className="text-[10px] text-ash">More</span>
        </div>
      </GlassCard>

      {/* Selected Day Details */}
      {selectedDate && (
        <div className="animate-slide-up space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ivory">
              {formatDateDisplay(selectedDate)}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-sm text-stone hover:text-ivory transition-colors"
            >
              Clear
            </button>
          </div>

          {selectedDayData && (
            <>
              {/* Day Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="glass-card flex flex-col items-center py-3">
                  <span className="font-data text-xl text-ivory">{selectedDayData.sets}</span>
                  <span className="mt-0.5 text-[10px] uppercase tracking-wider text-stone">Sets</span>
                </div>
                <div className="glass-card flex flex-col items-center py-3">
                  <span className="font-data text-xl text-ivory">
                    {selectedDayData.volume > 0 ? `${(selectedDayData.volume / 1000).toFixed(1)}k` : "0"}
                  </span>
                  <span className="mt-0.5 text-[10px] uppercase tracking-wider text-stone">Volume</span>
                </div>
              </div>

              {/* Sessions */}
              {selectedDayData.sessions.map((session) => (
                <GlassCard key={session.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06]">
                        <CheckIcon className="h-4 w-4 text-ivory" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ivory">
                          {session.completed_at ? "Completed" : "In progress"}
                        </p>
                        <p className="text-xs text-stone">
                          {new Date(session.started_at).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-ash" />
                  </div>

                  {/* Sets summary */}
                  {session.sets && session.sets.length > 0 && (
                    <div className="space-y-1.5">
                      <SessionExercises sets={session.sets} exerciseNameMap={exerciseNameMap} />
                    </div>
                  )}

                  {/* Cardio summary */}
                  {session.cardio && session.cardio.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                      <TimerIcon className="h-4 w-4 text-stone" />
                      <span className="text-sm text-ivory">
                        {session.cardio.map((c) => c.activity_type).join(", ")}
                      </span>
                      <span className="font-data text-xs text-stone">
                        {session.cardio.reduce((acc, c) => acc + (c.duration_minutes ?? 0), 0)} min
                      </span>
                    </div>
                  )}
                </GlassCard>
              ))}
            </>
          )}

          {!selectedDayData && (
            <GlassCard className="py-6 text-center">
              <p className="text-sm text-stone">No workouts logged on this day</p>
            </GlassCard>
          )}

          <button
            onClick={() => handleLogWorkout(selectedDate!)}
            disabled={startForDate.isPending}
            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.06] px-5 py-3 text-[13px] font-semibold text-ivory backdrop-blur-xl transition-all duration-200 hover:bg-white/[0.12] hover:border-white/[0.15] active:scale-95 disabled:opacity-40"
          >
            {startForDate.isPending ? "Starting..." : "Log workout for this day"}
          </button>
        </div>
      )}

      {/* No selection hint */}
      {!selectedDate && (
        <p className="text-center text-sm text-ash">
          Tap any day to see workout details
        </p>
      )}

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
