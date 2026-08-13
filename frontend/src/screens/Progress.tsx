import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "../components/GlassCard";
import { ChevronDownIcon } from "../components/icons";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";
import type { LiftPoint } from "../lib/types";

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

const chartTooltip = {
  contentStyle: {
    background: "#17181C",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#F5F3EE",
  },
  labelStyle: { color: "#8A8D94" },
};

export function Progress() {
  const [liftId, setLiftId] = useState<string | null>(null);

  const liftsQuery = useQuery({ queryKey: ["lifts"], queryFn: api.loggedLifts });
  const balanceQuery = useQuery({ queryKey: ["muscle-balance"], queryFn: api.muscleBalance });
  const liftQuery = useQuery({
    queryKey: ["lift-progress", liftId],
    queryFn: () => api.progressForExercise(liftId!),
    enabled: !!liftId,
  });

  if (liftsQuery.isLoading || balanceQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const lifts = liftsQuery.data ?? [];
  const selected = lifts.find((l) => l.exercise_id === liftId) ?? lifts[0] ?? null;
  const points = liftQuery.data ? aggregatePoints(liftQuery.data) : [];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-ash">Progress</p>
        <h1 className="font-display text-3xl font-semibold text-bone">Your numbers</h1>
      </header>

      {/* Lift selector */}
      {lifts.length === 0 ? (
        <GlassCard className="text-center">
          <p className="text-sm text-ash">
            No logged lifts yet. Complete a session and your numbers will show up here.
          </p>
        </GlassCard>
      ) : (
        <GlassCard padded={false} className="px-4 py-3">
          <button
            onClick={() => setLiftId(selected?.exercise_id ?? null)}
            className="flex w-full items-center justify-between"
          >
            <span className="text-sm font-medium text-bone">{selected?.name}</span>
            <ChevronDownIcon className="h-4 w-4 text-ash" />
          </button>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {lifts.slice(0, 8).map((l) => (
              <button
                key={l.exercise_id}
                onClick={() => setLiftId(l.exercise_id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
                  selected?.exercise_id === l.exercise_id
                    ? "bg-ember text-bone"
                    : "border border-white/10 bg-white/5 text-ash"
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Per-lift line chart */}
      {selected ? (
        <GlassCard className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-bone">Weight over time</h2>
            {points.length > 0 && points[points.length - 1].weight_kg != null ? (
              <span className="font-data text-lg text-ember">
                {points[points.length - 1].weight_kg}kg
              </span>
            ) : null}
          </div>
          {points.length === 0 ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#8A8D94", fontSize: 10 }}
                    tickFormatter={(v: string) => v.slice(5)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8A8D94", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip {...chartTooltip} />
                  <Line
                    type="monotone"
                    dataKey="weight_kg"
                    stroke="#FF4D2E"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#FF4D2E", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      ) : null}

      {/* Muscle balance */}
      <GlassCard className="space-y-2">
        <h2 className="text-sm font-medium text-bone">Volume this week</h2>
        <p className="text-xs text-ash">Sets per muscle group — spot the imbalance.</p>
        {balanceQuery.data?.length ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={balanceQuery.data}
                layout="vertical"
                margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#8A8D94", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="muscle"
                  tick={{ fill: "#8A8D94", fontSize: 11 }}
                  width={86}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...chartTooltip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="sets" fill="#5FD8E0" radius={[0, 8, 8, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-ash">Nothing logged this week yet.</p>
        )}
      </GlassCard>
    </div>
  );
}
