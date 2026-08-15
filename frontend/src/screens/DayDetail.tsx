import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { ChevronDownIcon, SwapIcon } from "../components/icons";
import { ExerciseImage } from "../components/ExerciseImage";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";

export function DayDetail() {
  const { dayId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const planQuery = useQuery({
    queryKey: ["plan"],
    queryFn: () => api.getPlan(),
    placeholderData: (prev) => prev,
  });
  const dayQuery = useQuery({
    queryKey: ["plan-day", dayId],
    queryFn: () => api.getPlanDay(dayId),
    enabled: !!dayId,
    placeholderData: (prev) => prev,
  });

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: api.getProfile,
    placeholderData: (prev) => prev,
  });
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
      <div className="space-y-5">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-2/3" />
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
    <div className="animate-slide-up space-y-6">
      <button
        onClick={() => navigate("/plan")}
        className="flex items-center gap-1.5 pt-4 font-data text-[11px] uppercase tracking-[0.22em] text-stone"
      >
        <span className="text-lg leading-none">‹</span> Plan
      </button>

      <header>
        <p className="font-data text-[11px] uppercase tracking-[0.28em] text-stone">{splitType}</p>
        <h1 className="font-display mt-1.5 text-[38px] font-semibold leading-[1.1] text-white">{day.label}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {day.target_muscles.map((m) => (
            <span
              key={m}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium capitalize text-chrome backdrop-blur-xl"
            >
              {m}
            </span>
          ))}
        </div>
      </header>

      {day.recovery_nudges.length > 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 text-sm text-silver backdrop-blur-xl">
          {day.recovery_nudges.join(" ")}
        </div>
      ) : null}

      <div>
        <h3 className="ios-section-label">
          {day.exercises.length} exercises
        </h3>
        <div className="ios-list">
          {day.exercises.map((item, i) => {
            const ex = item.exercise;
            return (
              <div key={item.id} className="ios-row items-start">
                <ExerciseImage
                  thumbnailUrl={ex?.thumbnail_url}
                  gifUrl={ex?.gif_url}
                  alt={ex?.name ?? ""}
                  className="h-14 w-14 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    <span className="mr-1.5 font-data text-xs text-stone">{i + 1}.</span>
                    {ex?.name ?? item.exercise_id}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-stone">{ex?.target_muscle ?? ""}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-stone">
                    <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 capitalize backdrop-blur-xl">
                      {ex?.equipment}
                    </span>
                    <span className="font-data text-chrome">
                      {item.prescribed_sets}×{item.prescribed_reps ?? "8-12"}
                    </span>
                  </div>
                </div>
                {ex ? (
                  <button
                    onClick={() => swap.mutate(ex.id)}
                    disabled={swap.isPending}
                    aria-label="Swap exercise"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-stone transition-all duration-200 active:scale-90 hover:bg-white/[0.08] hover:text-white backdrop-blur-xl"
                  >
                    <SwapIcon className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <Button full onClick={() => navigate(`/log?day=${day.id}`)} className="py-4 text-base">
          Start this session
        </Button>
        <button
          onClick={() => replan.mutate()}
          disabled={replan.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3.5 text-sm text-stone transition-all duration-200 active:scale-[0.98] hover:bg-white/[0.06]"
        >
          <ChevronDownIcon className="h-4 w-4 rotate-180" />
          {replan.isPending ? "Redistributing…" : "Missed this day? Redistribute targets"}
        </button>
      </div>
    </div>
  );
}
