import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { DisciplineRing } from "../components/DisciplineRing";
import { GlassCard } from "../components/GlassCard";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { GearIcon } from "../components/icons";
import { api } from "../lib/api";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function todayIndex(): number {
  return (new Date().getDay() + 6) % 7; // 0 = Monday
}

export function formatDate(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function Home() {
  const navigate = useNavigate();
  const planQuery = useQuery({ queryKey: ["plan"], queryFn: api.getPlan });
  const weekQuery = useQuery({ queryKey: ["sessions-week"], queryFn: api.sessionsThisWeek });

  if (planQuery.isLoading || weekQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="flex justify-center">
          <Skeleton variant="ring" className="h-44 w-44" />
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const plan = planQuery.data;
  if (!plan) return null;

  const today = todayIndex() + 1; // day_of_week is 1..7
  const todayDay = plan.days.find((d) => d.day_of_week === today) ?? null;
  const trainedCount = weekQuery.data?.length ?? 0;
  const planned = plan.days.filter((d) => !d.is_rest_day).length;
  const completion = planned > 0 ? Math.min(1, trainedCount / planned) : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ash">{formatDate()}</p>
          <h1 className="font-display text-3xl font-semibold text-bone">Your week</h1>
        </div>
        <button
          onClick={() => navigate("/settings")}
          aria-label="Settings"
          className="rounded-xl p-2 text-ash transition hover:text-bone active:scale-95"
        >
          <GearIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Discipline Ring — weekly completion */}
      <GlassCard className="flex flex-col items-center gap-4 py-6" padded={false}>
        <DisciplineRing value={completion} size={176} strokeWidth={10} color="#FF4D2E">
          <span className="font-data text-3xl font-medium text-bone">
            {trainedCount}
            <span className="text-lg text-ash">/{planned}</span>
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ash">days trained</span>
        </DisciplineRing>
        <p className="px-6 text-center text-sm text-ash">
          {completion === 1
            ? "Week complete. Discipline made visible."
            : completion >= 0.5
              ? "Halfway there — keep the streak alive."
              : "One session at a time. Start today."}
        </p>
      </GlassCard>

      {/* Today's plan */}
      {todayDay && !todayDay.is_rest_day ? (
        <GlassCard active className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-bone">Today · {plan.split_type}</h2>
            <span className="rounded-full bg-ember/15 px-3 py-1 text-xs font-medium text-ember">
              {todayDay.target_muscles.length} muscle groups
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayDay.target_muscles.map((m) => (
              <span key={m} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs capitalize text-ash">
                {m}
              </span>
            ))}
          </div>
          <Button full onClick={() => navigate(`/log?day=${todayDay.id}`)}>
            Start today's session
          </Button>
        </GlassCard>
      ) : (
        <GlassCard className="space-y-3" active={false}>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-glacier shadow-glow-glacier" />
            <h2 className="font-display text-lg font-semibold text-bone">Rest day</h2>
          </div>
          <p className="text-sm text-ash">
            Recovery is training too. {plan.split_type} resumes on the next scheduled day.
          </p>
          <Button variant="glacier" full onClick={() => navigate("/plan")}>
            Preview the week
          </Button>
        </GlassCard>
      )}

      {/* This week strip */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.2em] text-ash">This week</h3>
        {plan.days.map((d) => {
          const done = weekQuery.data?.some((s) => s.plan_day_id === d.id) ?? false;
          const isToday = d.day_of_week === today;
          return (
            <GlassCard key={d.id} padded={false} active={isToday} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      done
                        ? "bg-ember text-bone"
                        : d.is_rest_day
                          ? "bg-white/5 text-ash"
                          : "border border-white/15 text-bone"
                    }`}
                  >
                    {done ? "✓" : DAY_NAMES[d.day_of_week - 1][0]}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isToday ? "text-ember" : "text-bone"}`}>{d.label}</p>
                    <p className="text-xs text-ash">
                      {d.is_rest_day ? "Rest" : d.target_muscles.join(" · ")}
                    </p>
                  </div>
                </div>
                {isToday && !d.is_rest_day ? (
                  <button
                    onClick={() => navigate(`/log?day=${d.id}`)}
                    className="text-sm font-medium text-ember"
                  >
                    Train
                  </button>
                ) : null}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
