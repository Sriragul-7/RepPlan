import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/Button";
import { SegmentedControl } from "../components/SegmentedControl";
import { Stepper } from "../components/Stepper";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
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

const DAYS = [2, 3, 4, 5, 6].map((d) => ({ value: String(d), label: `${d} days` }));

const SEX = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

type Sex = "male" | "female" | "other";

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
      <span className="flex-1 text-sm text-black dark:text-white">{label}</span>
      {children}
      {unit ? <span className="font-data w-8 text-right text-xs text-stone">{unit}</span> : null}
    </div>
  );
}

function SegmentedControlSex({
  value,
  onChange,
}: {
  value: Sex;
  onChange: (v: Sex) => void;
}) {
  return (
    <SegmentedControl options={[...SEX]} value={value} onChange={onChange} minCol={88} />
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  const [experienceYears, setExperienceYears] = useState(1);
  const [goal, setGoal] = useState("hypertrophy");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [equipmentAccess, setEquipmentAccess] = useState("full gym");

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);
  const [sex, setSex] = useState<Sex>("male");

  const mutation = useMutation({
    mutationFn: async () => {
      const data: Partial<ProfileInput> = {
        experience_years: experienceYears,
        goal,
        days_per_week: daysPerWeek,
        equipment_access: equipmentAccess,
        split_preference: "ppl",
      };
      if (user) {
        if (fullName.trim()) data.full_name = fullName.trim();
        if (dateOfBirth) data.date_of_birth = dateOfBirth;
        data.weight_kg = weightKg;
        data.height_cm = heightCm;
        data.sex = sex;
      }
      await api.saveProfile(data as ProfileInput);
      await api.generatePlan();
    },
    onSuccess: async () => {
      const profile = await api.getProfile();
      queryClient.setQueryData(["profile"], profile);
      navigate("/app", { replace: true });
    },
    onError: (e: Error) => setError(e.message),
  });

  const submit = () => {
    setError(null);
    mutation.mutate();
  };

  return (
    <div className="relative min-h-screen w-full">
      <div className="app-bg" aria-hidden />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.06] bg-white/[0.8] dark:bg-white/[0.04] text-stone backdrop-blur-xl transition-all duration-300 hover:bg-white dark:hover:bg-white/[0.08] hover:text-black dark:hover:text-ivory active:scale-95"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Desktop decorative orbs */}
      <div className="pointer-events-none fixed inset-0 hidden lg:block" aria-hidden>
        <div className="absolute left-[8%] top-1/4 h-64 w-64 rounded-full bg-black/[0.02] dark:bg-white/[0.02] blur-[100px]" />
        <div className="absolute bottom-1/4 right-[8%] h-72 w-72 rounded-full bg-black/[0.015] dark:bg-white/[0.015] blur-[120px]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-safe md:max-w-lg lg:max-w-xl lg:flex-row lg:items-center lg:gap-20 lg:px-12 xl:max-w-[1000px] xl:gap-28">
        {/* Left side — hero content for desktop */}
        <div className="mb-8 hidden flex-1 lg:mb-0 lg:block xl:flex-1">
          <p className="mb-3 font-data text-[11px] font-semibold uppercase tracking-[0.28em] text-stone">
            Quick start
          </p>
          <h1 className="font-display mb-6 text-[52px] font-semibold leading-[1.02] text-black dark:text-white xl:text-[64px]">
            Build your<br />perfect plan
          </h1>
          <p className="mb-12 max-w-md text-[17px] leading-[1.7] text-stone/60">
            Tell us about your training and our AI will craft a workout program tailored to your goals.
          </p>

          {/* How it works */}
          <div className="mb-12 space-y-5">
            <p className="font-data text-[10px] font-semibold uppercase tracking-[0.28em] text-stone/50">
              How it works
            </p>
            {[
              { step: "01", title: "Tell us your goals", desc: "Experience, equipment, and training days" },
              { step: "02", title: "AI builds your plan", desc: "Personalized splits, sets, and progression" },
              { step: "03", title: "Track your workouts", desc: "Log sets, reps, and weights in real time" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <span className="font-data mt-0.5 text-[13px] font-bold text-black dark:text-white/20">{item.step}</span>
                <div>
                  <p className="text-[15px] font-semibold text-black dark:text-white/90">{item.title}</p>
                  <p className="mt-0.5 text-[13px] text-stone/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Motivational quote */}
          <div className="rounded-2xl border border-black/[0.05] dark:border-white/[0.05] bg-black/[0.025] dark:bg-white/[0.025] p-7">
            <p className="text-[16px] font-medium leading-[1.7] text-black dark:text-white/70">
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
              Quick start
            </p>
            <h1 className="font-display mb-2 text-[36px] font-semibold leading-[1.1] text-black dark:text-white">
              Build your plan
            </h1>
            <p className="text-[15px] leading-relaxed text-stone/70">
              Tell us about your training goals so we can personalize your workout plan.
            </p>
          </div>

      <div className="space-y-4">
        {user && (
          <Section label="About you">
            <div className="ios-row">
              <span className="flex-1 text-sm text-black dark:text-white">Name</span>
              <input
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                enterKeyHint="next"
                className="w-44 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.04] px-3.5 py-2.5 text-left text-sm text-black dark:text-white placeholder:text-stone/40 outline-none backdrop-blur-xl transition-all duration-300 focus:border-white/[0.2] focus:bg-black/[0.06] dark:bg-white/[0.06]"
              />
            </div>
            <div className="ios-row">
              <span className="flex-1 text-sm text-black dark:text-white">Date of birth</span>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-44 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.04] px-3.5 py-2.5 text-left text-sm text-black dark:text-white outline-none backdrop-blur-xl transition-all duration-300 focus:border-white/[0.2] focus:bg-black/[0.06] dark:bg-white/[0.06]"
              />
            </div>
            <div className="ios-row flex-col !items-stretch gap-3">
              <span className="text-sm text-black dark:text-white">Sex</span>
              <SegmentedControlSex value={sex} onChange={setSex} />
            </div>
          </Section>
        )}

        <Section label="Training background">
          <FieldRow label="Experience" unit="yrs">
            <Stepper
              value={Math.round(experienceYears * 2) / 2}
              step={0.5}
              decimals={1}
              onChange={setExperienceYears}
              min={0}
              max={30}
            />
          </FieldRow>
        </Section>

        <Section label="Training">
          <div className="ios-row flex-col !items-stretch gap-3">
            <span className="text-sm text-black dark:text-white">Primary goal</span>
            <SegmentedControl options={GOALS} value={goal} onChange={setGoal} minCol={104} />
          </div>
          <div className="ios-row flex-col !items-stretch gap-3">
            <span className="text-sm text-black dark:text-white">Days per week</span>
            <SegmentedControl options={DAYS} value={String(daysPerWeek)} onChange={(v) => setDaysPerWeek(Number(v))} minCol={72} />
          </div>
          <div className="ios-row flex-col !items-stretch gap-3">
            <span className="text-sm text-black dark:text-white">Equipment</span>
            <SegmentedControl options={EQUIPMENT} value={equipmentAccess} onChange={setEquipmentAccess} minCol={118} />
          </div>
        </Section>

        {user && (
          <Section label="Body">
            <FieldRow label="Weight" unit="kg">
              <Stepper value={weightKg} onChange={setWeightKg} min={30} max={300} />
            </FieldRow>
            <FieldRow label="Height" unit="cm">
              <Stepper value={heightCm} onChange={setHeightCm} min={120} max={230} />
            </FieldRow>
          </Section>
        )}
      </div>

      {error ? <p className="mt-4 text-center text-sm text-rose lg:text-left">{error}</p> : null}

      <div className="mt-8 lg:mt-auto lg:pt-4">
        <Button
          full
          onClick={submit}
          disabled={mutation.isPending}
          className="py-4 text-base"
        >
          {mutation.isPending ? "Building your plan…" : "Build my plan"}
        </Button>
        <p className="mt-3 text-center text-[13px] text-stone/50">
          {user ? "You can update your details later in Settings." : "You can add your name and body stats later in Settings."}
        </p>
      </div>
        </div>
      </div>
    </div>
  );
}
