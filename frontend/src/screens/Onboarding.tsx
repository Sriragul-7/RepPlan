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
    <div className="relative min-h-screen w-full">
      <div className="app-bg" aria-hidden />

      {/* Desktop decorative orbs */}
      <div className="pointer-events-none fixed inset-0 hidden lg:block" aria-hidden>
        <div className="absolute left-[8%] top-1/4 h-64 w-64 rounded-full bg-white/[0.02] blur-[100px]" />
        <div className="absolute bottom-1/4 right-[8%] h-72 w-72 rounded-full bg-white/[0.015] blur-[120px]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-safe md:max-w-lg lg:max-w-xl lg:flex-row lg:items-center lg:gap-20 lg:px-12 xl:max-w-[1000px] xl:gap-28">
        {/* Left side — hero content for desktop */}
        <div className="mb-8 hidden flex-1 lg:mb-0 lg:block xl:flex-1">
          <p className="mb-3 font-data text-[11px] font-semibold uppercase tracking-[0.28em] text-stone">
            Set up your profile
          </p>
          <h1 className="font-display mb-6 text-[52px] font-semibold leading-[1.02] text-white xl:text-[64px]">
            Build your<br />perfect plan
          </h1>
          <p className="mb-12 max-w-md text-[17px] leading-[1.7] text-stone/60">
            Tell us a bit about yourself and our AI will craft a workout program tailored to your body, goals, and lifestyle.
          </p>

          {/* How it works */}
          <div className="mb-12 space-y-5">
            <p className="font-data text-[10px] font-semibold uppercase tracking-[0.28em] text-stone/50">
              How it works
            </p>
            {[
              { step: "01", title: "Tell us about you", desc: "Your body, goals, and experience level" },
              { step: "02", title: "AI builds your plan", desc: "Personalized splits, sets, and progression" },
              { step: "03", title: "Track your workouts", desc: "Log sets, reps, and weights in real time" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <span className="font-data mt-0.5 text-[13px] font-bold text-white/20">{item.step}</span>
                <div>
                  <p className="text-[15px] font-semibold text-white/90">{item.title}</p>
                  <p className="mt-0.5 text-[13px] text-stone/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Motivational quote */}
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.025] p-7">
            <p className="text-[16px] font-medium leading-[1.7] text-white/70">
              "The only bad workout is the one that didn't happen."
            </p>
            <p className="mt-3 text-[12px] text-stone/40">— Start now, results follow.</p>
          </div>
        </div>

        {/* Right side — form */}
        <div className="flex flex-1 flex-col lg:flex-none lg:w-[420px] xl:w-[440px]">
          {/* Mobile headline */}
          <div className="mb-6 lg:hidden">
            <p className="mb-1 font-data text-[11px] font-semibold uppercase tracking-[0.28em] text-stone">
              Set up your profile
            </p>
            <h1 className="font-display mb-2 text-[36px] font-semibold leading-[1.1] text-white">
              Build your plan
            </h1>
            <p className="text-[15px] leading-relaxed text-stone/70">
              Tell us a bit about yourself so we can personalize your workout plan.
            </p>
          </div>

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

      {error ? <p className="mt-4 text-center text-sm text-rose lg:text-left">{error}</p> : null}

      <div className="mt-8 lg:mt-auto lg:pt-4">
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
      </div>
    </div>
  );
}
