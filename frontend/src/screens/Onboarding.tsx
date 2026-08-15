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
  full_name: "",
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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="ios-section-label">{label}</h3>
      <div className="ios-list">{children}</div>
    </div>
  );
}

function FieldRow({
  label,
  unit,
  children,
}: {
  label: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ios-row">
      <span className="flex-1 text-sm text-white">{label}</span>
      {children}
      {unit ? <span className="font-data w-8 text-right text-xs text-stone">{unit}</span> : null}
    </div>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileInput>(DEFAULTS);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      await api.saveProfile(form);
      await api.generatePlan();
    },
    onSuccess: async () => {
      const profile = await api.getProfile();
      queryClient.setQueryData(["profile"], profile);
      navigate("/", { replace: true });
    },
    onError: (e: Error) => setError(e.message),
  });

  const canSave = (form.full_name ?? "").trim().length > 0;

  const submit = () => {
    setError(null);
    if (!canSave) {
      setError("Please tell us your name first.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-safe">
      <div className="app-bg" aria-hidden />

      <p className="mb-1 mt-2 font-data text-[11px] font-semibold uppercase tracking-[0.28em] text-stone">
        Set up your profile
      </p>
      <h1 className="font-display mb-2 text-[36px] font-semibold leading-[1.1] text-white">
        Build your plan
      </h1>
      <p className="mb-8 text-[15px] leading-relaxed text-stone/70">
        Tell us a bit about yourself so we can personalize your workout plan.
      </p>

      <div className="space-y-4">
        <Section label="About you">
          <div className="ios-row">
            <span className="flex-1 text-sm text-white">Name</span>
            <input
              autoFocus
              value={form.full_name ?? ""}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Enter your name"
              enterKeyHint="next"
              className="w-44 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-left text-sm text-white placeholder:text-stone/40 outline-none backdrop-blur-xl transition-all duration-300 focus:border-white/[0.2] focus:bg-white/[0.06]"
            />
          </div>
          <FieldRow label="Age">
            <Stepper value={form.age} onChange={(v) => set("age", v)} min={13} max={100} />
          </FieldRow>
        </Section>

        <Section label="Body">
          <FieldRow label="Weight" unit="kg">
            <Stepper value={Math.round(form.weight_kg ?? 70)} onChange={(v) => set("weight_kg", v)} min={30} max={300} />
          </FieldRow>
          <FieldRow label="Height" unit="cm">
            <Stepper value={Math.round(form.height_cm ?? 170)} onChange={(v) => set("height_cm", v)} min={120} max={230} />
          </FieldRow>
        </Section>

        <Section label="Training background">
          <div className="ios-row">
            <span className="flex-1 text-sm text-white">Sex</span>
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
          <FieldRow label="Experience" unit="yrs">
            <Stepper
              value={Math.round(form.experience_years * 2) / 2}
              step={0.5}
              decimals={1}
              onChange={(v) => set("experience_years", v)}
              min={0}
              max={30}
            />
          </FieldRow>
        </Section>

        <Section label="Training">
          <div className="ios-row flex-col !items-stretch gap-3">
            <span className="text-sm text-white">Primary goal</span>
            <SegmentedControl options={GOALS} value={form.goal as "hypertrophy"} onChange={(v) => set("goal", v)} />
          </div>
          <div className="ios-row flex-col !items-stretch gap-3">
            <span className="text-sm text-white">Days per week</span>
            <SegmentedControl options={DAYS} value={String(form.days_per_week)} onChange={(v) => set("days_per_week", Number(v))} columns={5} />
          </div>
          <div className="ios-row flex-col !items-stretch gap-3">
            <span className="text-sm text-white">Equipment</span>
            <SegmentedControl options={EQUIPMENT} value={form.equipment_access as "full gym"} onChange={(v) => set("equipment_access", v)} />
          </div>
        </Section>
      </div>

      {error ? <p className="mt-4 text-center text-sm text-rose">{error}</p> : null}

      <div className="mt-auto pt-8">
        <Button
          full
          onClick={submit}
          disabled={mutation.isPending || !canSave}
          className="py-4 text-base"
        >
          {mutation.isPending ? "Building your plan…" : "Build my plan"}
        </Button>
      </div>
    </div>
  );
}
