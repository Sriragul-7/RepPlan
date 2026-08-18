import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "../components/Button";
import { DisciplineRing } from "../components/DisciplineRing";
import { GlassCard } from "../components/GlassCard";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { ChevronRightIcon, DumbbellIcon, GearIcon } from "../components/icons";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { DAY_NAMES } from "../lib/constants";

export function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

export function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function Home() {
  const navigate = useNavigate();
  const { signInWithGoogle, session } = useAuth();
  const [dismissedGuest, setDismissedGuest] = useState(() =>
    localStorage.getItem("repplan_guest_dismissed") === "1"
  );
  const planQuery = useQuery({
    queryKey: ["plan"],
    queryFn: () => api.getPlan(true),
    placeholderData: (prev) => prev,
  });
  const weekQuery = useQuery({
    queryKey: ["sessions-week"],
    queryFn: api.sessionsThisWeek,
    placeholderData: (prev) => prev,
  });
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: api.getProfile,
    placeholderData: (prev) => prev,
  });

  // ALL hooks must be declared before any early returns
  const pastDays = useMemo(() => {
    const days = [];
    const todayDate = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      days.push({
        date: d.toISOString().slice(0, 10),
        dayOfWeek: (d.getDay() + 6) % 7 + 1,
        dayName: DAY_NAMES[(d.getDay() + 6) % 7],
      });
    }
    return days;
  }, []);

  const workoutData = useMemo(() => {
    const map = new Map<string, { sets: number; volume: number }>();
    pastDays.forEach((day) => {
      map.set(day.date, { sets: 0, volume: 0 });
    });
    const sessions = weekQuery.data ?? [];
    sessions.forEach((s) => {
      const dateKey = s.started_at?.slice(0, 10);
      if (map.has(dateKey)) {
        const existing = map.get(dateKey)!;
        const setCount = (s.sets ?? []).length;
        const volume = (s.sets ?? []).reduce(
          (acc, set) => acc + (set.weight_kg ?? 0) * (set.reps ?? 0),
          0,
        );
        existing.sets += setCount;
        existing.volume += volume;
      } else {
        const setCount = (s.sets ?? []).length;
        const volume = (s.sets ?? []).reduce(
          (acc, set) => acc + (set.weight_kg ?? 0) * (set.reps ?? 0),
          0,
        );
        map.set(dateKey, { sets: setCount, volume });
      }
    });
    return map;
  }, [pastDays, weekQuery.data]);

  // NOW safe to early-return
  if (planQuery.isLoading || weekQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-48 w-full rounded-[28px]" />
        <CardSkeleton />
      </div>
    );
  }

  const plan = planQuery.data;
  if (!plan) return null;

  const firstName = profileQuery.data?.full_name?.split(" ")[0] ?? null;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const today = todayIndex() + 1;
  const todayDay = plan.days.find((d) => d.day_of_week === today) ?? null;
  const isWorkout = todayDay && !todayDay.is_rest_day;

  const upcoming = [...plan.days]
    .filter((d) => !d.is_rest_day && d.day_of_week !== today)
    .sort((a, b) => {
      const da = a.day_of_week > today ? a.day_of_week : a.day_of_week + 7;
      const db = b.day_of_week > today ? b.day_of_week : b.day_of_week + 7;
      return da - db;
    })
    .slice(0, 3);

  return (
    <div className="animate-slide-up space-y-6 pb-10">
      {/* ── Greeting ── */}
      <header className="flex items-start justify-between pt-2">
        <div className="space-y-1">
          <p className="font-data text-[10px] uppercase tracking-[0.3em] text-stone">
            {formatDate()}
          </p>
          <h1 className="font-display text-[42px] font-bold leading-[1.0] tracking-tight text-white">
            {greeting}
            {firstName ? (
              <span className="text-silver">, {firstName}</span>
            ) : (
              ""
            )}
          </h1>
        </div>
        <button
          onClick={() => navigate("/app/settings")}
          aria-label="Settings"
          className="mt-1 flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] text-stone backdrop-blur-2xl transition hover:bg-white/[0.08] hover:text-white active:scale-95"
        >
          <GearIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Guest save prompt */}
      {!session && !dismissedGuest && (
        <div className="glass-card border border-white/[0.08] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold text-white">
                Save your plan
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-stone">
                Sign in to save your plan and track progress across devices.
              </p>
            </div>
            <button
              onClick={() => {
                setDismissedGuest(true);
                localStorage.setItem("repplan_guest_dismissed", "1");
              }}
              className="shrink-0 text-[12px] text-ash hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button full onClick={() => signInWithGoogle()} className="py-2.5 text-[13px]">
              Sign in with Google
            </Button>
          </div>
        </div>
      )}

      {/* ── Today's Session ── */}
      {isWorkout ? (
        <div className="glass-active relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-smoke/60 p-6 backdrop-blur-3xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/[0.05] blur-[60px]"
          />
          <div className="relative space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08]">
                  <DumbbellIcon className="h-4.5 w-4.5 text-ivory" />
                </div>
                <div>
                  <p className="font-data text-[10px] uppercase tracking-[0.25em] text-stone">
                    {plan.split_type}
                  </p>
                  <p className="font-data text-[10px] text-ash">
                    {todayDay.target_muscles.length} muscles
                  </p>
                </div>
              </div>
              <DisciplineRing
                value={0.5}
                size={56}
                strokeWidth={5}
                color="#D1D1D6"
              >
                <span className="font-data text-[10px] font-bold text-white">
                  50%
                </span>
              </DisciplineRing>
            </div>

            <div>
              <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-white">
                {todayDay.label}
              </h2>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {todayDay.target_muscles.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 text-[11px] capitalize text-silver backdrop-blur-xl"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {(todayDay.exercises ?? []).slice(0, 3).map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-2.5"
                >
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
                    {ex.exercise?.thumbnail_url ? (
                      <img
                        src={ex.exercise.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-ash">
                        {ex.exercise?.name?.[0] ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ivory">
                      {ex.exercise?.name ?? "Exercise"}
                    </p>
                    <p className="font-data text-[10px] text-ash">
                      {ex.prescribed_sets}×{ex.prescribed_reps ?? "8-12"}
                    </p>
                  </div>
                </div>
              ))}
              {(todayDay.exercises?.length ?? 0) > 3 && (
                <p className="text-center text-[11px] text-ash">
                  +{(todayDay.exercises?.length ?? 0) - 3} more
                </p>
              )}
            </div>

            {session ? (
              <Button
                full
                onClick={() => navigate(`/app/log?day=${todayDay.id}`)}
                className="py-4 text-base"
              >
                Start workout
              </Button>
            ) : (
              <Button
                full
                onClick={() => signInWithGoogle()}
                className="py-4 text-base"
              >
                Sign in to start logging
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-active relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-smoke/60 p-6 backdrop-blur-3xl">
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-silver shadow-[0_0_12px_rgba(255,255,255,0.2)]" />
              <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                Rest day
              </h2>
            </div>
            <p className="text-[13px] leading-relaxed text-stone">
              Recovery is training too.{" "}
              {plan.split_type} resumes on the next scheduled day.
            </p>
            <Button
              variant="chrome"
              full
              onClick={() => navigate("/app/plan")}
            >
              Preview the week
            </Button>
          </div>
        </div>
      )}

      {/* ── Activity Heatmap ── */}
      <GlassCard className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-data text-[10px] uppercase tracking-[0.3em] text-stone">
            Activity
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-ash">Less</span>
            {["rgba(255,255,255,0.04)", "rgba(255,255,255,0.12)", "rgba(255,255,255,0.25)", "rgba(255,255,255,0.45)", "#ffffff"].map(
              (c) => (
                <div key={c} className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }} />
              ),
            )}
            <span className="text-[9px] text-ash">More</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {[...pastDays].reverse().map((day) => {
            const data = workoutData.get(day.date) ?? { sets: 0 };
            const sets = data.sets;
            const heatLevel =
              sets === 0 ? 0 : sets <= 10 ? 1 : sets <= 20 ? 2 : sets <= 30 ? 3 : 4;
            const isToday = day.dayOfWeek === today;
            const opacity = heatLevel === 0 ? 0.04 : heatLevel === 1 ? 0.12 : heatLevel === 2 ? 0.25 : heatLevel === 3 ? 0.45 : 1;
            const textCol = heatLevel >= 3 ? "#000" : heatLevel >= 1 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)";

            return (
              <div
                key={day.date}
                className={`relative flex flex-col items-center justify-center overflow-hidden rounded-xl py-2 transition-all duration-200 ${
                  isToday ? "ring-1 ring-inset ring-white/25" : ""
                }`}
                style={{ backgroundColor: `rgba(255,255,255,${opacity})` }}
              >
                <span className="text-[9px] font-medium" style={{ color: textCol }}>
                  {day.dayName}
                </span>
                <span
                  className="font-display text-[13px] font-bold leading-tight"
                  style={{ color: textCol }}
                >
                  {sets > 0 ? sets : "\u2014"}
                </span>
                {isToday && (
                  <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-ivory shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* ── Coming Up ── */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-data text-[10px] uppercase tracking-[0.3em] text-stone">
            Coming up
          </h3>
          <div className="space-y-1.5">
            {upcoming.map((d) => (
              <button
                key={d.id}
                onClick={() => navigate(`/app/plan/day/${d.id}`)}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 transition hover:bg-white/[0.06] active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.04] font-display text-lg font-bold text-white">
                  {DAY_NAMES[d.day_of_week - 1][0]}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[15px] font-semibold capitalize text-white">
                    {d.label.toLowerCase()}
                  </p>
                  <p className="truncate text-xs capitalize text-ash">
                    {d.target_muscles.join(" \u00b7 ")}
                  </p>
                </div>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-ash" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
