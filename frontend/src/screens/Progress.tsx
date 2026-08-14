import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDownIcon } from "../components/icons";
import { SegmentedControl } from "../components/SegmentedControl";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";
import type { LiftPoint } from "../lib/types";

type Metric = "weight" | "volume";

function aggregatePoints(points: LiftPoint[]): LiftPoint[] {
  const byDate = new Map<string, { weight: number | null; volume: number }>();
  for (const p of points) {
    const day = p.date.slice(0, 10);
    const cur = byDate.get(day) ?? { weight: null, volume: 0 };
    if (p.weight_kg != null && (cur.weight == null || p.weight_kg > cur.weight)) {
      cur.weight = p.weight_kg;
    }
    cur.volume += p.volume;
    byDate.set(day, cur);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      weight_kg: v.weight,
      volume: Math.round(v.volume),
    }));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const chartTooltip = {
  contentStyle: {
    background: "rgba(10,10,10,0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    fontSize: "12px",
    color: "#F2F2F7",
    backdropFilter: "blur(24px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  labelStyle: { color: "#6B6B76" },
};

export function Progress() {
  const [liftId, setLiftId] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("weight");

  const overviewQuery = useQuery({
    queryKey: ["progress-overview"],
    queryFn: api.progressOverview,
    placeholderData: (prev) => prev,
  });
  const balanceQuery = useQuery({
    queryKey: ["muscle-balance"],
    queryFn: api.muscleBalance,
    placeholderData: (prev) => prev,
  });
  const liftsQuery = useQuery({
    queryKey: ["lifts"],
    queryFn: api.loggedLifts,
    placeholderData: (prev) => prev,
  });
  const liftQuery = useQuery({
    queryKey: ["lift-progress", liftId],
    queryFn: () => api.progressForExercise(liftId!),
    enabled: !!liftId,
  });

  if (overviewQuery.isLoading && !overviewQuery.data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-7 w-44" />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const overview = overviewQuery.data;
  const lifts = liftsQuery.data ?? [];
  const selected = lifts.find((l) => l.exercise_id === liftId) ?? lifts[0] ?? null;
  const points = liftQuery.data ? aggregatePoints(liftQuery.data) : [];
  const lastPoint = points[points.length - 1];
  const lastValue = metric === "weight" ? lastPoint?.weight_kg : lastPoint?.volume;
  const maxVolume = Math.max(1, ...balanceQuery.data?.map((b) => b.sets) ?? [1]);
  const maxWeekly = Math.max(1, ...(overview?.weekly.map((w) => w.workouts) ?? [1]));

  return (
    <div className="animate-slide-up space-y-6">
      <header className="flex items-end justify-between pt-4">
        <div>
          <p className="font-data text-[11px] uppercase tracking-[0.28em] text-stone">Progress</p>
          <h1 className="font-display mt-1.5 text-[38px] font-semibold leading-[1.1] text-white">Your numbers</h1>
        </div>
        {overview && overview.streak_weeks > 0 ? (
          <span className="mb-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 font-data text-[11px] text-chrome backdrop-blur-xl">
            {overview.streak_weeks}-week streak
          </span>
        ) : null}
      </header>

      {overview ? (
        <div className="grid grid-cols-3 gap-3">
          {[
            { k: "Workouts", v: String(overview.total_workouts) },
            { k: "Sets", v: String(overview.total_sets) },
            { k: "Volume", v: overview.total_volume.toFixed(0) },
          ].map((s) => (
            <div
              key={s.k}
              className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] py-4 backdrop-blur-xl"
            >
              <span className="font-display text-[32px] font-bold leading-none text-white tracking-tight">{s.v}</span>
              <span className="mt-1.5 font-data text-[10px] uppercase tracking-[0.18em] text-stone">{s.k}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div>
        <h3 className="ios-section-label">Weekly rhythm</h3>
        <div className="ios-list">
          {overview?.weekly.map((w, i) => (
            <div key={w.week} className="ios-row">
              <span className={`w-16 shrink-0 text-sm ${i === overview.weekly.length - 1 ? "font-semibold text-white" : "text-stone"}`}>
                {w.week}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700"
                  style={{ width: `${(w.workouts / maxWeekly) * 100}%` }}
                />
              </div>
              <span className="font-data w-8 shrink-0 text-right text-sm text-stone">{w.workouts}</span>
            </div>
          ))}
        </div>
      </div>

      {selected && lifts.length > 0 ? (
        <div>
          <h3 className="ios-section-label">Lift progress</h3>
          <div className="ios-list">
            <button
              className="ios-row ios-tap"
              onClick={() => setLiftId(selected?.exercise_id ?? null)}
            >
              <span className="flex-1 text-sm font-semibold text-white">{selected?.name}</span>
              <ChevronDownIcon className="h-4 w-4 text-stone" />
            </button>
            <div className="ios-row flex-wrap gap-2">
              {lifts.slice(0, 8).map((l) => (
                <button
                  key={l.exercise_id}
                  onClick={() => setLiftId(l.exercise_id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
                    selected?.exercise_id === l.exercise_id
                      ? "bg-white text-black shadow-[0_2px_16px_rgba(255,255,255,0.2)]"
                      : "border border-white/[0.08] bg-white/[0.03] text-stone hover:bg-white/[0.06]"
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <SegmentedControl
              options={[
                { value: "weight", label: "Weight" },
                { value: "volume", label: "Volume" },
              ]}
              value={metric}
              onChange={setMetric}
            />
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-data text-[10px] uppercase tracking-[0.22em] text-stone">
                  {metric === "weight" ? "Best weight" : "Volume per session"}
                </span>
                {lastValue != null ? (
                  <span className="font-display text-xl font-bold text-white">
                    {lastValue}
                    <span className="ml-1 text-xs font-normal text-stone">{metric === "weight" ? "kg" : "sets"}</span>
                  </span>
                ) : null}
              </div>
              {points.length === 0 ? (
                <Skeleton className="h-44 w-full" />
              ) : (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                      <defs>
                        <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#6B6B76", fontSize: 10 }}
                        tickFormatter={(v: string) => v.slice(5)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#6B6B76", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip {...chartTooltip} />
                      <Area
                        type="monotone"
                        dataKey={metric}
                        stroke="#E5E5EA"
                        strokeWidth={2.5}
                        fill="url(#metricFill)"
                        dot={{ r: 3, fill: "#E5E5EA", strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "#FFFFFF" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {overview && overview.best.length > 0 ? (
        <div>
          <h3 className="ios-section-label">Best lifts</h3>
          <div className="ios-list">
            {overview.best.map((b, i) => (
              <div key={b.exercise_id} className="ios-row">
                <span className="font-data w-6 shrink-0 text-sm text-stone">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{b.name}</p>
                  <p className="text-xs text-stone">
                    {b.last_weight != null && b.best_weight > b.last_weight
                      ? `Last ${b.last_weight}kg · best ${b.best_weight}kg`
                      : `Best ${b.best_weight}kg`}
                  </p>
                </div>
                <span className="font-display text-sm font-bold text-white">{b.best_weight}kg</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {overview && overview.recent.length > 0 ? (
        <div>
          <h3 className="ios-section-label">Recent workouts</h3>
          <div className="ios-list">
            {overview.recent.map((r) => (
              <div key={r.id} className="ios-row">
                <span className="w-24 shrink-0 text-sm text-white">{formatDate(r.started_at)}</span>
                <div className="flex-1" />
                <span className="text-xs text-stone">{r.sets} sets</span>
                <span className="font-data w-16 text-right text-sm text-chrome">{r.volume.toFixed(0)} kg</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="ios-section-label">Volume this week</h3>
        <div className="ios-list">
          {balanceQuery.data?.length ? (
            balanceQuery.data.map((b) => (
              <div key={b.muscle} className="ios-row">
                <span className="w-24 shrink-0 text-sm capitalize text-white">{b.muscle}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${(b.sets / maxVolume) * 100}%` }}
                  />
                </div>
                <span className="font-data w-8 shrink-0 text-right text-sm text-stone">{b.sets}</span>
              </div>
            ))
          ) : (
            <div className="ios-row justify-center py-8">
              <p className="text-center text-sm text-stone">
                {overview && overview.total_workouts === 0
                  ? "Complete your first workout to unlock progress."
                  : "Nothing logged this week yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
