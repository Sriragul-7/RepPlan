import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../components/GlassCard";
import { PlusIcon } from "../components/icons";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
  const planQuery = useQuery({ queryKey: ["plan"], queryFn: api.getPlan });
  const weekQuery = useQuery({ queryKey: ["sessions-week"], queryFn: api.sessionsThisWeek });

  if (planQuery.isLoading || weekQuery.isLoading) {
    return (
      <div className="space-y-3">
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

  const doneDayIds = new Set(weekQuery.data?.filter((s) => s.completed_at).map((s) => s.plan_day_id));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ash">Weekly plan</p>
          <h1 className="font-display text-3xl font-semibold text-bone">{plan.split_type}</h1>
        </div>
      </header>

      {/* Freeform entry — train a muscle */}
      <GlassCard active className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-bone">Train a muscle</h2>
          <PlusIcon className="h-5 w-5 text-ember" />
        </div>
        <p className="text-sm text-ash">
          Off-schedule? Build a focused mini-session for one muscle group.
        </p>
        {pickingMuscle ? (
          <div className="grid grid-cols-3 gap-2">
            {MUSCLES.map((m) => (
              <button
                key={m}
                onClick={() => navigate(`/log?muscle=${m}`)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm capitalize text-bone transition active:scale-95"
              >
                {m}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setPickingMuscle(true)}
            className="w-full rounded-2xl border border-ember/30 bg-ember/10 py-3 text-sm font-semibold text-ember transition active:scale-[0.98]"
          >
            Choose a muscle
          </button>
        )}
      </GlassCard>

      {/* Week overview */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.2em] text-ash">The week</h3>
        {plan.days.map((day) => {
          const done = day.is_rest_day ? false : doneDayIds.has(day.id);
          return (
            <GlassCard
              key={day.id}
              padded={false}
              className="px-4 py-3"
              onClick={() => navigate(`/plan/day/${day.id}`)}
              active={false}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      done
                        ? "bg-ember text-bone"
                        : day.is_rest_day
                          ? "bg-white/5 text-ash"
                          : "border border-white/15 text-bone"
                    }`}
                  >
                    {done ? "✓" : DAY_NAMES[day.day_of_week - 1][0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-bone">{day.label}</p>
                    <p className="text-xs text-ash">
                      {day.is_rest_day ? "Rest — recovery counts" : day.target_muscles.join(" · ")}
                    </p>
                  </div>
                </div>
                <span className="text-ash">›</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
