import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "../components/BottomSheet";
import { Button } from "../components/Button";
import { GlassCard } from "../components/GlassCard";
import { CheckIcon, ChevronDownIcon, CloseIcon, PlusIcon } from "../components/icons";
import { NumberKeypad } from "../components/NumberKeypad";
import { RestTimer } from "../components/RestTimer";
import { Skeleton } from "../components/Skeleton";
import { Stepper } from "../components/Stepper";
import { SwipeRow } from "../components/SwipeRow";
import { api } from "../lib/api";
import type { DayExercise, LoggedSet } from "../lib/types";

const COMPOUND_RE = /squat|bench|deadlift|row|press|pull-up|chin-up|push-up|dip|lunge|clean|snatch|thruster|overhead|hip thrust|good morning|farmer/i;

function restSecondsFor(exercise: DayExercise | undefined): number {
  const name = exercise?.exercise?.name ?? exercise?.name ?? "";
  if (COMPOUND_RE.test(name)) return 150;
  const target = exercise?.exercise?.target_muscle ?? "";
  if (/abs|calves|forearms/.test(target)) return 60;
  return 90;
}

function defaultWeight(): number {
  const prev = Number(localStorage.getItem("repplan_last_weight") ?? 60);
  return prev > 0 ? prev : 60;
}

export function ActiveLog() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const dayId = params.get("day");
  const muscle = params.get("muscle");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exerciseList, setExerciseList] = useState<DayExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<DayExercise | null>(null);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [cardioOpen, setCardioOpen] = useState(false);

  const [rest, setRest] = useState<{ seconds: number; active: boolean; id: number }>({
    seconds: 0,
    active: false,
    id: 0,
  });

  const loadInit = useCallback(async () => {
    let list: DayExercise[] = [];
    let session: Awaited<ReturnType<typeof api.startSession>> | null = null;

    const existing = localStorage.getItem("repplan_active_session");
    if (existing) {
      session = await api.getSession(existing).catch(() => null);
    }
    if (session?.completed_at) {
      localStorage.removeItem("repplan_active_session");
      session = null;
    }

    if (dayId) {
      const day = await api.getPlanDay(dayId);
      list = day.exercises;
    } else if (muscle) {
      const profile = await api.getProfile();
      list = await api.muscleFocus(muscle, profile?.equipment_access ?? "full gym", profile?.goal ?? "hypertrophy");
    } else if (session?.plan_day_id) {
      const day = await api.getPlanDay(session.plan_day_id);
      list = day.exercises;
    }

    if (!session) {
      session = await api.startSession(dayId ?? undefined);
      localStorage.setItem("repplan_active_session", session.id);
    }

    setSessionId(session.id);
    setExerciseList(list);
    setLoggedSets(session.sets ?? []);
    setLoading(false);
  }, [dayId, muscle]);

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
    localStorage.setItem("repplan_last_weight", String(weight));
    setLoggedSets((s) => [...s, row]);
    setRest((r) => ({ seconds: restSecondsFor(exercise), active: true, id: r.id + 1 }));
  };

  const complete = useMutation({
    mutationFn: async () => {
      if (!sessionId) return;
      await api.completeSession(sessionId);
      localStorage.removeItem("repplan_active_session");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions-week"] });
      navigate("/", { replace: true });
    },
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-card flex items-center gap-4 p-4">
            <Skeleton variant="circle" className="h-14 w-14" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-1/2" />
              <Skeleton className="w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ash">
            {dayId ? "Today's session" : muscle ? `${muscle} focus` : "Session"}
          </p>
          <h1 className="font-display text-3xl font-semibold text-bone">Log workout</h1>
        </div>
        <button
          onClick={() => complete.mutate()}
          disabled={complete.isPending}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-ash transition active:scale-95"
        >
          {complete.isPending ? "…" : "End"}
        </button>
      </header>

      {/* Progress summary */}
      <div className="flex items-center gap-3">
        <div className="glass-card flex-1 px-4 py-3">
          <span className="font-data text-2xl text-bone">
            {totalLogged}
            <span className="text-base text-ash">/{totalPrescribed}</span>
          </span>
          <p className="text-xs text-ash">sets logged</p>
        </div>
      </div>

      {/* Exercise cards */}
      <div className="space-y-3">
        {exerciseList.map((item) => {
          const ex = item.exercise ?? item;
          const done = loggedSets.filter((s) => s.exercise_id === item.exercise_id).length;
          return (
            <GlassCard
              key={item.exercise_id}
              className="flex items-center gap-4"
              onClick={() => setActive(item)}
              active={false}
            >
              <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-white/5">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={ex?.name ?? ""} className="h-full w-full object-contain" loading="lazy" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-bone">{ex?.name ?? item.exercise_id}</p>
                <p className="mt-0.5 text-xs text-ash">
                  {item.prescribed_sets} sets · {item.prescribed_reps ?? "8-12"} reps
                </p>
                <div className="mt-1.5 flex gap-1">
                  {Array.from({ length: item.prescribed_sets }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-5 rounded-full ${i < done ? "bg-ember" : "bg-white/10"}`}
                    />
                  ))}
                </div>
              </div>
              <ChevronDownIcon className="h-4 w-4 shrink-0 rotate-[-90deg] text-ash" />
            </GlassCard>
          );
        })}
      </div>

      {/* Cardio */}
      <button
        onClick={() => setCardioOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-glacier/40 bg-glacier/5 py-4 text-sm font-medium text-glacier transition active:scale-[0.98]"
      >
        <PlusIcon className="h-4 w-4" />
        Add cardio
      </button>

      <BottomSheet open={!!active} onClose={() => setActive(null)} title={active?.exercise?.name ?? ""}>
        {active ? <SetSheet exercise={active} loggedSets={loggedSets} onLog={logSet} /> : null}
      </BottomSheet>

      <CardioSheet open={cardioOpen} onClose={() => setCardioOpen(false)} sessionId={sessionId} />

      <RestTimer
        seconds={rest.seconds}
        active={rest.active}
        id={rest.id}
        onFinish={() => setRest((r) => ({ ...r, active: false }))}
        onSkip={() => setRest((r) => ({ ...r, active: false }))}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- Set sheet */

function SetSheet({
  exercise,
  loggedSets,
  onLog,
}: {
  exercise: DayExercise;
  loggedSets: LoggedSet[];
  onLog: (e: DayExercise, setNumber: number, weight: number, reps: number) => void;
}) {
  const done = loggedSets.filter((s) => s.exercise_id === exercise.exercise_id);
  const last = done[done.length - 1];

  const [inputs, setInputs] = useState<Record<number, { weight: number; reps: number }>>({});
  const [keypadFor, setKeypadFor] = useState<{ setNumber: number; field: "weight" | "reps" } | null>(null);

  const nextPending = exercise.prescribed_sets;
  const repeatLast = () => {
    if (!last || !last.weight_kg || !last.reps) return;
    setInputs((s) => ({ ...s, [nextPending]: { weight: last.weight_kg!, reps: last.reps! } }));
  };

  const keypadValue = keypadFor ? inputs[keypadFor.setNumber]?.[keypadFor.field] : undefined;

  return (
    <div className="space-y-3">
      {last ? (
        <button
          onClick={repeatLast}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-ember/30 bg-ember/10 py-3 text-sm font-semibold text-ember transition active:scale-[0.98]"
        >
          Repeat last set
        </button>
      ) : null}

      {Array.from({ length: exercise.prescribed_sets }).map((_, i) => {
        const n = i + 1;
        const logged = done.find((s) => s.set_number === n);
        if (logged) {
          return (
            <GlassCard key={n} className="flex items-center justify-between border-ember/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ember text-bone">
                  <CheckIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-ash">SET {n}</p>
                  <p className="font-data text-lg text-bone">
                    {logged.weight_kg ?? 0}kg × {logged.reps ?? 0}
                  </p>
                </div>
              </div>
            </GlassCard>
          );
        }

        const value = inputs[n] ?? {
          weight: last?.weight_kg ?? defaultWeight(),
          reps: last?.reps ?? Number.parseInt((exercise.prescribed_reps ?? "10").split("-")[1] ?? "10"),
        };

        const setValue = (field: "weight" | "reps", v: number) =>
          setInputs((s) => ({ ...s, [n]: { ...(s[n] ?? value), [field]: v } }));

        const editing = keypadFor?.setNumber === n;

        return (
          <div key={n}>
            {editing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.15em] text-ash">SET {n}</p>
                  <button onClick={() => setKeypadFor(null)} className="text-ash">
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-data text-5xl font-medium text-bone">
                    {keypadValue ?? (keypadFor.field === "weight" ? value.weight : value.reps)}
                  </span>
                  <span className="text-sm text-ash">{keypadFor.field === "weight" ? "kg" : "reps"}</span>
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
                <GlassCard className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.15em] text-ash">SET {n}</p>
                    <span className="text-xs text-ash">swipe → to log</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Stepper
                      label="kg"
                      value={value.weight}
                      step={2.5}
                      decimals={1}
                      min={0}
                      max={400}
                      onChange={(v) => setValue("weight", v)}
                    />
                    <button
                      onClick={() => setKeypadFor({ setNumber: n, field: "weight" })}
                      className="h-12 w-12 shrink-0 rounded-full border border-white/10 text-lg text-ash active:scale-90"
                    >
                      ⌨
                    </button>
                    <Stepper
                      label="reps"
                      value={value.reps}
                      step={1}
                      min={0}
                      max={100}
                      onChange={(v) => setValue("reps", v)}
                    />
                    <button
                      onClick={() => setKeypadFor({ setNumber: n, field: "reps" })}
                      className="h-12 w-12 shrink-0 rounded-full border border-white/10 text-lg text-ash active:scale-90"
                    >
                      ⌨
                    </button>
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

function CardioSheet({ open, onClose, sessionId }: { open: boolean; onClose: () => void; sessionId: string | null }) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions-week"] });
      onClose();
    },
  });

  return (
    <BottomSheet open={open} onClose={onClose} title="Cardio">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {CARDIO_TYPES.map((c) => (
            <button
              key={c}
              onClick={() => setActivity(c)}
              className={`rounded-full px-4 py-2 text-sm transition active:scale-95 ${
                activity === c ? "bg-glacier text-void" : "border border-white/10 bg-white/5 text-ash"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <GlassCard className="space-y-3">
          <Stepper label="mins" value={duration} min={1} max={300} onChange={setDuration} />
          <Stepper label="km" value={distance} step={0.5} decimals={1} min={0} max={100} onChange={setDistance} />
          <Stepper label="kcal" value={calories} step={10} min={0} max={2000} onChange={setCalories} />
        </GlassCard>
        <Button variant="glacier" full onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Logging…" : "Log cardio"}
        </Button>
      </div>
    </BottomSheet>
  );
}
