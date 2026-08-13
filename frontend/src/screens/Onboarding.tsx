import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/Button";
import { SegmentedControl } from "../components/SegmentedControl";
import { Stepper } from "../components/Stepper";
import { api } from "../lib/api";
import type { ProfileInput } from "../lib/types";

type Sex = "male" | "female" | "other";

const DEFAULTS: ProfileInput = {
  age: 28,
  weight_kg: 70,
  height_cm: 170,
  sex: "male" as Sex,
  experience_years: 1,
  goal: "hypertrophy",
  days_per_week: 4,
  equipment_access: "full gym",
  split_preference: "ppl",
};

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

const DAYS = [2, 3, 4, 5, 6].map((d) => ({ value: String(d), label: `${d} days` }));

function BigNumber({ children }: { children: React.ReactNode }) {
  return <div className="font-display text-6xl font-semibold text-bone">{children}</div>;
}

export function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileInput>(DEFAULTS);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      await api.saveProfile(form);
      await api.generatePlan();
    },
    onSuccess: () => {
      queryClient.setQueryData(["profile"], form);
      navigate("/", { replace: true });
    },
    onError: (e: Error) => setError(e.message),
  });

  const next = () => {
    setError(null);
    if (step < 4) setStep((s) => s + 1);
    else mutation.mutate();
  };

  const steps = [
    {
      title: "How old are you?",
      body: (
        <div className="flex flex-col items-center gap-6 py-8">
          <BigNumber>{form.age}</BigNumber>
          <Stepper value={form.age} onChange={(v) => set("age", v)} min={13} max={100} />
        </div>
      ),
    },
    {
      title: "Body measurements",
      body: (
        <div className="flex flex-col gap-8 py-4">
          <div className="glass-card flex items-center justify-between gap-3 p-4">
            <span className="text-sm text-ash">Weight</span>
            <Stepper value={Math.round(form.weight_kg ?? 70)} onChange={(v) => set("weight_kg", v)} min={30} max={300} />
            <span className="text-xs text-ash">kg</span>
          </div>
          <div className="glass-card flex items-center justify-between gap-3 p-4">
            <span className="text-sm text-ash">Height</span>
            <Stepper value={Math.round(form.height_cm ?? 170)} onChange={(v) => set("height_cm", v)} min={120} max={230} />
            <span className="text-xs text-ash">cm</span>
          </div>
        </div>
      ),
    },
    {
      title: "Sex & experience",
      body: (
        <div className="flex flex-col gap-8 py-4">
          <div>
            <p className="mb-3 text-sm text-ash">Sex</p>
            <SegmentedControl<Sex>
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
              value={form.sex as Sex}
              onChange={(v) => set("sex", v)}
            />
          </div>
          <div className="glass-card flex items-center justify-between gap-3 p-4">
            <span className="text-sm text-ash">Lifting experience</span>
            <Stepper value={Math.round(form.experience_years * 2) / 2} step={0.5} decimals={1} onChange={(v) => set("experience_years", v)} min={0} max={30} />
            <span className="text-xs text-ash">yrs</span>
          </div>
        </div>
      ),
    },
    {
      title: "Goal & schedule",
      body: (
        <div className="flex flex-col gap-8 py-4">
          <div>
            <p className="mb-3 text-sm text-ash">Primary goal</p>
            <SegmentedControl options={GOALS} value={form.goal as "hypertrophy"} onChange={(v) => set("goal", v)} />
          </div>
          <div>
            <p className="mb-3 text-sm text-ash">Training days per week</p>
            <SegmentedControl options={DAYS} value={String(form.days_per_week)} onChange={(v) => set("days_per_week", Number(v))} columns={5} />
          </div>
        </div>
      ),
    },
    {
      title: "What do you have?",
      body: (
        <div className="flex flex-col gap-8 py-4">
          <SegmentedControl options={EQUIPMENT} value={form.equipment_access as "full gym"} onChange={(v) => set("equipment_access", v)} />
          <p className="text-center text-sm leading-relaxed text-ash">
            Plans and daily muscle targets adapt to your equipment. Exercises you can't do get one-tap substitutes.
          </p>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-8">
      {/* progress dots */}
      <div className="mb-10 flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-6 bg-ember" : i < step ? "w-3 bg-ember/50" : "w-3 bg-white/15"
            }`}
          />
        ))}
      </div>

      <h1 className="font-display mb-8 text-3xl font-semibold leading-tight text-bone">{current.title}</h1>

      {current.body}

      <div className="mt-auto pt-10">
        {error ? <p className="mb-3 text-center text-sm text-ember">{error}</p> : null}
        <div className="flex items-center gap-3">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="flex-1">
              Back
            </Button>
          ) : null}
          <Button
            full={step === 0}
            onClick={next}
            disabled={mutation.isPending}
            className="flex-1"
          >
            {mutation.isPending ? "Building your plan…" : step === 4 ? "Start training" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
