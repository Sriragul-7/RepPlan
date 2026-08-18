import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PlusIcon } from "../components/icons";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";
import { DAY_NAMES } from "../lib/constants";

const MUSCLES = [
  "chest",
  "back",
  "shoulders",
  "quads",
  "hamstrings",
  "glutes",
  "biceps",
  "triceps",
  "abs",
  "calves",
  "forearms",
  "traps",
];

export function Plan() {
  const navigate = useNavigate();
  const [pickingMuscle, setPickingMuscle] = useState(false);
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

  if (planQuery.isLoading || weekQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <CardSkeleton />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} variant="row" />
        ))}
      </div>
    );
  }

  const plan = planQuery.data;
  if (!plan) return null;

  const doneDayIds = new Set(
    weekQuery.data
      ?.filter((s) => s.completed_at)
      .map((s) => s.plan_day_id),
  );
  const doneCount = plan.days.filter(
    (d) => doneDayIds.has(d.id) || d.is_rest_day,
  ).length;

  return (
    <div className="animate-slide-up space-y-6 pb-10">
      {/* ── Header ── */}
      <header className="flex items-end justify-between pt-2">
        <div className="space-y-1">
          <p className="font-data text-[10px] uppercase tracking-[0.3em] text-stone">
            Weekly plan
          </p>
          <h1 className="font-display text-[36px] font-bold leading-tight tracking-tight text-black dark:text-white">
            {plan.split_type}
          </h1>
        </div>
        <span className="mb-1 rounded-full border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] px-3.5 py-1.5 font-data text-[11px] font-semibold text-gray-500 dark:text-silver">
          {doneCount}/{plan.days.length}
        </span>
      </header>

      {/* ── Glass Summary Bar ── */}
      <div className="flex items-center gap-2 rounded-[22px] border border-black/[0.08] dark:border-white/[0.06] bg-gray-100/50 dark:bg-smoke/50 px-5 py-3.5 backdrop-blur-3xl">
        <div className="flex flex-1 items-center justify-between">
          {plan.days.map((d) => {
            const done = doneDayIds.has(d.id);
            return (
              <div
                key={d.id}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold transition-all ${
                    done
                      ? "bg-black dark:bg-white text-white dark:text-ink shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                      : d.is_rest_day
                        ? "bg-black/[0.04] dark:bg-white/[0.04] text-ash"
                        : "border border-black/[0.1] dark:border-white/[0.1] bg-black/[0.03] dark:bg-white/[0.03] text-gray-500 dark:text-silver"
                  }`}
                >
                  {done
                    ? "\u2713"
                    : DAY_NAMES[d.day_of_week - 1][0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Train a Muscle (glass picker) ── */}
      {pickingMuscle ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            {MUSCLES.map((m) => (
              <button
                key={m}
                onClick={() => navigate(`/app/log?muscle=${m}`)}
                className="rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] px-3 py-3.5 text-[13px] font-medium capitalize text-gray-500 dark:text-silver backdrop-blur-2xl transition hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:text-black dark:hover:text-white active:scale-95"
              >
                {m}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPickingMuscle(false)}
            className="w-full rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.03] dark:bg-white/[0.03] py-3 font-data text-[11px] uppercase tracking-[0.2em] text-stone transition hover:bg-black/[0.06] dark:hover:bg-white/[0.06] hover:text-gray-500 dark:hover:text-silver active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setPickingMuscle(true)}
          className="flex w-full items-center justify-between rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.03] dark:bg-white/[0.03] px-5 py-4 transition hover:bg-black/[0.06] dark:hover:bg-white/[0.06] active:scale-[0.98]"
        >
          <span className="flex items-center gap-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-gray-500 dark:text-silver">
              <PlusIcon className="h-4 w-4" />
            </span>
            <span className="text-[14px] font-semibold text-black dark:text-white">
              Train a muscle
            </span>
          </span>
          <span className="font-data text-[11px] text-ash">
            Off-schedule
          </span>
        </button>
      )}

      {/* ── The Week ── */}
      <div className="space-y-3">
        <h3 className="font-data text-[10px] uppercase tracking-[0.3em] text-stone">
          The week
        </h3>
        <div className="space-y-1">
          {plan.days.map((day) => {
            const done = day.is_rest_day
              ? false
              : doneDayIds.has(day.id);
            return (
              <button
                key={day.id}
                onClick={() =>
                  navigate(`/app/plan/day/${day.id}`)
                }
                className="flex w-full items-center gap-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.03] dark:bg-white/[0.03] px-4 py-3.5 transition hover:bg-black/[0.06] dark:hover:bg-white/[0.06] active:scale-[0.98]"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    done
                      ? "bg-black dark:bg-white text-white dark:text-ink shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                      : day.is_rest_day
                        ? "bg-black/[0.04] dark:bg-white/[0.04] text-ash"
                        : "border border-black/[0.1] dark:border-white/[0.1] bg-black/[0.03] dark:bg-white/[0.03] text-gray-500 dark:text-silver"
                  }`}
                >
                  {done
                    ? "\u2713"
                    : DAY_NAMES[day.day_of_week - 1][0]}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[14px] font-semibold text-black dark:text-white">
                    {day.label}
                  </p>
                  <p className="truncate text-[11px] text-ash">
                    {day.is_rest_day
                      ? "Rest \u2014 recovery counts"
                      : day.target_muscles.join(
                          " \u00b7 ",
                        )}
                  </p>
                </div>
                {day.is_rest_day ? (
                  <span className="text-xs text-ash">
                    &mdash;
                  </span>
                ) : (
                  <span className="rounded-full border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] px-3 py-1 font-data text-[10px] text-gray-500 dark:text-silver">
                    {day.exercises?.length ?? 0} exercises
                  </span>
                )}
                <span className="text-ash">&rsaquo;</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
