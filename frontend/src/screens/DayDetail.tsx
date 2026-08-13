import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { GlassCard } from "../components/GlassCard";
import { ChevronDownIcon, SwapIcon } from "../components/icons";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";

export function DayDetail() {
  const { dayId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const planQuery = useQuery({ queryKey: ["plan"], queryFn: api.getPlan });
  const dayQuery = useQuery({
    queryKey: ["plan-day", dayId],
    queryFn: () => api.getPlanDay(dayId),
    enabled: !!dayId,
  });

  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: api.getProfile });
  const equipment = profileQuery.data?.equipment_access ?? "full gym";

  const swap = useMutation({
    mutationFn: (exerciseId: string) => api.swapExercise(exerciseId, equipment),
    onSuccess: (substitute, exerciseId) => {
      const day = dayQuery.data;
      if (!day) return;
      queryClient.setQueryData(["plan-day", dayId], {
        ...day,
        exercises: day.exercises.map((item) => {
          if (item.exercise?.id !== exerciseId) return item;
          return { ...item, exercise: substitute };
        }),
      });
    },
  });

  const replan = useMutation({
    mutationFn: () => api.replanDay(dayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan"] });
      queryClient.invalidateQueries({ queryKey: ["plan-day"] });
    },
  });

  if (dayQuery.isLoading || planQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const day = dayQuery.data;
  if (!day) return null;
  const splitType = planQuery.data?.split_type ?? "";

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/plan")} className="text-sm text-ash">
        ← Plan
      </button>

      <header>
        <p className="text-sm text-ash">{splitType}</p>
        <h1 className="font-display text-3xl font-semibold text-bone">{day.label}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {day.target_muscles.map((m) => (
            <span key={m} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs capitalize text-ash">
              {m}
            </span>
          ))}
        </div>
      </header>

      {day.recovery_nudges.length > 0 ? (
        <div className="rounded-card border border-glacier/30 bg-glacier/10 px-4 py-3 text-sm text-glacier">
          {day.recovery_nudges.join(" ")}
        </div>
      ) : null}

      <div className="space-y-3">
        {day.exercises.map((item) => {
          const ex = item.exercise;
          return (
            <GlassCard key={item.id} className="flex items-center gap-4">
              <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-xl bg-white/5">
                {ex?.thumbnail_url ? (
                  <img src={ex.thumbnail_url} alt={ex?.name ?? ""} className="h-full w-full object-contain" loading="lazy" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-bone">{ex?.name ?? item.exercise_id}</p>
                <p className="mt-0.5 text-xs capitalize text-ash">{ex?.target_muscle ?? ""}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-ash">
                  <span className="rounded-full bg-white/5 px-2 py-0.5 capitalize">{ex?.equipment}</span>
                  <span className="font-data">
                    {item.prescribed_sets}×{item.prescribed_reps ?? "8-12"}
                  </span>
                </div>
                {ex ? (
                  <button
                    onClick={() => swap.mutate(ex.id)}
                    disabled={swap.isPending}
                    className="mt-2 flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ash transition active:scale-95"
                  >
                    <SwapIcon className="h-3.5 w-3.5" />
                    Swap
                  </button>
                ) : null}
              </div>
            </GlassCard>
          );
        })}
      </div>

      <Button full onClick={() => navigate(`/log?day=${day.id}`)}>
        Start this session
      </Button>

      <button
        onClick={() => replan.mutate()}
        disabled={replan.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm text-ash transition active:scale-[0.98]"
      >
        <ChevronDownIcon className="h-4 w-4 rotate-180" />
        {replan.isPending ? "Redistributing…" : "Missed this day? Redistribute targets"}
      </button>
    </div>
  );
}
