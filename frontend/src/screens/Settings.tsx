import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { GlassCard } from "../components/GlassCard";
import { SegmentedControl } from "../components/SegmentedControl";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { Stepper } from "../components/Stepper";
import { api } from "../lib/api";
import type { ProfileInput } from "../lib/types";

const GOALS = [
  { value: "hypertrophy", label: "Hypertrophy" },
  { value: "strength", label: "Strength" },
  { value: "general fitness", label: "General" },
];
const EQUIPMENT = [
  { value: "full gym", label: "Full gym" },
  { value: "home dumbbells", label: "Home dumbbells" },
  { value: "bodyweight only", label: "Bodyweight" },
];

export function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: api.getProfile });
  const [form, setForm] = useState<ProfileInput | null>(null);

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = useMutation({
    mutationFn: () => api.saveProfile(form!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const regenerate = useMutation({
    mutationFn: () => api.generatePlan(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan"] });
      queryClient.invalidateQueries({ queryKey: ["plan-day"] });
    },
  });

  const resetAll = () => {
    localStorage.clear();
    navigate("/onboarding", { replace: true });
  };

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const profile = profileQuery.data;
  const f = form ?? {
    age: profile?.age ?? 28,
    weight_kg: profile?.weight_kg ?? 70,
    height_cm: profile?.height_cm ?? 170,
    sex: profile?.sex ?? "male",
    experience_years: profile?.experience_years ?? 1,
    goal: profile?.goal ?? "hypertrophy",
    days_per_week: profile?.days_per_week ?? 4,
    equipment_access: profile?.equipment_access ?? "full gym",
    split_preference: profile?.split_preference ?? "ppl",
  } satisfies ProfileInput;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-ash">Settings</p>
        <h1 className="font-display text-3xl font-semibold text-bone">Your profile</h1>
      </header>

      <GlassCard className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ash">Age</span>
          <Stepper value={f.age} onChange={(v) => set("age", v)} min={13} max={100} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ash">Weight</span>
          <Stepper value={Math.round(f.weight_kg ?? 70)} onChange={(v) => set("weight_kg", v)} min={30} max={300} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ash">Height</span>
          <Stepper value={Math.round(f.height_cm ?? 170)} onChange={(v) => set("height_cm", v)} min={120} max={230} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ash">Experience</span>
          <Stepper value={Math.round(f.experience_years * 2) / 2} step={0.5} decimals={1} onChange={(v) => set("experience_years", v)} min={0} max={30} />
        </div>
        <div>
          <p className="mb-3 text-sm text-ash">Goal</p>
          <SegmentedControl options={GOALS} value={f.goal as "hypertrophy"} onChange={(v) => set("goal", v)} />
        </div>
        <div>
          <p className="mb-3 text-sm text-ash">Equipment</p>
          <SegmentedControl options={EQUIPMENT} value={f.equipment_access as "full gym"} onChange={(v) => set("equipment_access", v)} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ash">Training days</span>
          <SegmentedControl
            options={[2, 3, 4, 5, 6].map((d) => ({ value: String(d), label: `${d}` }))}
            value={String(f.days_per_week)}
            onChange={(v) => set("days_per_week", Number(v))}
            columns={5}
          />
        </div>
        <Button full onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </GlassCard>

      <Button variant="glacier" full onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
        {regenerate.isPending ? "Rebuilding plan…" : "Regenerate weekly plan"}
      </Button>

      {/* Attribution — required by the Gym visual media license */}
      <GlassCard className="space-y-2">
        <h2 className="text-sm font-medium text-bone">About & attribution</h2>
        <p className="text-xs leading-relaxed text-ash">
          Exercise data from the MIT-licensed{" "}
          <a
            href="https://github.com/hasaneyldrm/exercises-dataset"
            target="_blank"
            rel="noreferrer"
            className="text-glacier underline"
          >
            exercises-dataset
          </a>
          .
        </p>
        <p className="text-xs leading-relaxed text-ash">
          Exercise media (thumbnails & animations) © Gym visual, used under license. Media is
          displayed at its original 180×180 resolution.
        </p>
      </GlassCard>

      <button
        onClick={resetAll}
        className="w-full rounded-2xl border border-ember/20 bg-ember/5 py-3 text-sm text-ember transition active:scale-[0.98]"
      >
        Reset app data
      </button>
    </div>
  );
}
