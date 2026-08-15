import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { DisciplineRing } from "../components/DisciplineRing";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { CheckIcon, ChevronRightIcon, GearIcon } from "../components/icons";
import { api } from "../lib/api";
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
  const planQuery = useQuery({
    queryKey: ["plan"],
    queryFn: api.getPlan,
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

  if (planQuery.isLoading || weekQuery.isLoading) {
    return (
      <div className="space-y-6">
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

  const firstName =
    profileQuery.data?.full_name?.split(" ")[0] ?? null;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const today = todayIndex() + 1;
  const todayDay =
    plan.days.find((d) => d.day_of_week === today) ?? null;
  const trainedCount = weekQuery.data?.length ?? 0;
  const planned = plan.days.filter((d) => !d.is_rest_day).length;
  const completion =
    planned > 0 ? Math.min(1, trainedCount / planned) : 0;
  const isWorkout = todayDay && !todayDay.is_rest_day;

  const statusLine =
    completion === 1
      ? "Week complete. Discipline made visible."
      : completion >= 0.5
        ? "Halfway there \u2014 keep the streak alive."
        : "One session at a time. Start today.";

  const upcoming = [...plan.days]
    .filter((d) => !d.is_rest_day && d.day_of_week !== today)
    .sort((a, b) => {
      const da =
        a.day_of_week > today
          ? a.day_of_week
          : a.day_of_week + 7;
      const db =
        b.day_of_week > today
          ? b.day_of_week
          : b.day_of_week + 7;
      return da - db;
    })
    .slice(0, 3);

  return (
    <div className="animate-slide-up space-y-8 pb-10">
      {/* ── Greeting ── */}
      <header className="flex items-start justify-between pt-2">
        <div className="space-y-1">
          <p className="font-data text-[10px] uppercase tracking-[0.3em] text-stone">
            {formatDate()}
          </p>
          <h1 className="font-display text-[42px] font-bold leading-[1.0] tracking-tight text-white">
            {greeting}
            {firstName ? (
              <span className="text-silver">
                , {firstName}
              </span>
            ) : (
              ""
            )}
          </h1>
        </div>
        <button
          onClick={() => navigate("/settings")}
          aria-label="Settings"
          className="mt-1 flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] text-stone backdrop-blur-2xl transition hover:bg-white/[0.08] hover:text-white active:scale-95"
        >
          <GearIcon className="h-5 w-5" />
        </button>
      </header>

      {/* ── Desktop: Two-column layout ── */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        {/* Left column — Week Progress */}
        <section className="col-span-3">
          {/* ── Hero: Week Progress ── */}
          <div className="glass-active relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-smoke/60 p-6 backdrop-blur-3xl lg:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[0.06] blur-[80px]"
            />
            <div className="relative">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-data text-[10px] uppercase tracking-[0.3em] text-stone">
                    Days trained
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-data text-[64px] font-bold leading-none tracking-tight text-white">
                      {trainedCount}
                    </span>
                    <span className="font-data pb-1.5 text-[13px] text-ash">
                      / {planned}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-stone">
                    {statusLine}
                  </p>
                </div>
                <DisciplineRing
                  value={completion}
                  size={108}
                  strokeWidth={10}
                  color="#D1D1D6"
                >
                  <span className="font-data text-xl font-bold text-white">
                    {Math.round(completion * 100)}%
                  </span>
                </DisciplineRing>
              </div>

              {/* Week blocks */}
              <div className="mt-8 grid grid-cols-7 gap-2 lg:max-w-lg">
                {plan.days.map((d) => {
                  const done =
                    weekQuery.data?.some(
                      (s) => s.plan_day_id === d.id,
                    ) ?? false;
                  const isToday = d.day_of_week === today;
                  return (
                    <div
                      key={d.id}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={`flex h-10 w-full items-center justify-center rounded-xl transition-all ${
                          done
                            ? "bg-white text-ink shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                            : isToday
                              ? "border border-white/30 bg-white/[0.06]"
                              : d.is_rest_day
                                ? "bg-white/[0.03]"
                                : "bg-white/[0.08]"
                        }`}
                      >
                        {done ? (
                          <CheckIcon className="h-4 w-4 text-ink" />
                        ) : null}
                      </div>
                      <span
                        className={`font-data text-[9px] uppercase tracking-[0.18em] ${
                          isToday
                            ? "font-semibold text-white"
                            : "text-ash"
                        }`}
                      >
                        {DAY_NAMES[d.day_of_week - 1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Coming Up ── */}
          {upcoming.length > 0 ? (
            <div className="mt-8 space-y-3">
              <h3 className="font-data text-[10px] uppercase tracking-[0.3em] text-stone">
                Coming up
              </h3>
              <div className="space-y-1">
                {upcoming.map((d) => (
                  <button
                    key={d.id}
                    onClick={() =>
                      navigate(`/plan/day/${d.id}`)
                    }
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
          ) : null}
        </section>

        {/* Right column — Today's Session / Rest Day */}
        <div className="col-span-2 mt-8 lg:mt-0">
          {isWorkout ? (
            <div className="glass-active relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-smoke/60 p-6 backdrop-blur-3xl lg:sticky lg:top-12">
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-white/[0.04] blur-[60px]"
              />
              <div className="relative space-y-5">
                <div className="flex items-center justify-between">
                  <p className="font-data text-[10px] uppercase tracking-[0.3em] text-stone">
                    {plan.split_type}
                  </p>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1 font-data text-[10px] uppercase tracking-wider text-silver">
                    {todayDay.target_muscles.length} muscles
                  </span>
                </div>
                <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-white">
                  Today&apos;s session
                </h2>
                <div className="flex flex-wrap gap-2">
                  {todayDay.target_muscles.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-white/[0.06] bg-white/[0.04] px-3.5 py-1.5 text-xs capitalize text-silver backdrop-blur-xl"
                    >
                      {m}
                    </span>
                  ))}
                </div>
                <Button
                  full
                  onClick={() => navigate(`/log?day=${todayDay.id}`)}
                  className="py-4 text-base"
                >
                  Start workout
                </Button>
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
                  onClick={() => navigate("/plan")}
                >
                  Preview the week
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
