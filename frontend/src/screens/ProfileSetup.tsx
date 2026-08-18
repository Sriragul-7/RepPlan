import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/Button";
import { Stepper } from "../components/Stepper";
import { api } from "../lib/api";
import { useTheme } from "../lib/theme";
import type { ProfileInput } from "../lib/types";

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

function DatePickerInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatted = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.showPicker?.()}
        className={`flex w-44 items-center justify-between gap-2 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.04] px-3.5 py-2.5 text-left text-sm backdrop-blur-xl transition-all duration-300 hover:border-black/[0.12] dark:hover:border-white/[0.12] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] focus:border-black/[0.2] dark:focus:border-white/[0.2] focus:bg-black/[0.06] dark:focus:bg-white/[0.06] outline-none ${
          formatted ? "text-black dark:text-white" : "text-stone/50"
        }`}
      >
        <span className="truncate">{formatted || "Select date"}</span>
        <svg className="h-4 w-4 shrink-0 text-stone/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={new Date().toISOString().slice(0, 10)}
        className="absolute inset-0 cursor-pointer opacity-0"
        tabIndex={-1}
      />
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
  const options: { value: Sex; label: string }[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-xl px-3 py-3 text-[13px] font-medium transition-all duration-200 ${
            value === opt.value
              ? "bg-black dark:bg-white text-white dark:text-ink shadow-glow"
              : "border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.04] text-stone hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ProfileSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: api.getProfile,
  });

  const existing = profileQuery.data;

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);
  const [sex, setSex] = useState<Sex>("male");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (existing && !initialized) {
      setFullName(existing.full_name ?? "");
      setDateOfBirth(existing.date_of_birth ?? "");
      setWeightKg(Math.round(existing.weight_kg ?? 70));
      setHeightCm(Math.round(existing.height_cm ?? 170));
      setSex((existing.sex as Sex) ?? "male");
      setInitialized(true);
    }
  }, [existing, initialized]);

  const mutation = useMutation({
    mutationFn: async () => {
      const data: Partial<ProfileInput> = {};
      if (fullName.trim()) data.full_name = fullName.trim();
      if (dateOfBirth) data.date_of_birth = dateOfBirth;
      data.weight_kg = weightKg;
      data.height_cm = heightCm;
      data.sex = sex;
      await api.patchProfile(data);
      try {
        await api.logBodyMetric({ weight_kg: weightKg });
      } catch {
        // Weight log is secondary — never block the profile save on it
      }
      try {
        await api.generatePlan();
      } catch {
        // Plan generation is best-effort after profile update
      }
    },
    onSuccess: async () => {
      const profile = await api.getProfile();
      queryClient.setQueryData(["profile"], profile);
      queryClient.invalidateQueries({ queryKey: ["plan"] });
      navigate("/app", { replace: true });
    },
    onError: (e: Error) => setError(e.message),
  });

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

      <div className="pointer-events-none fixed inset-0 hidden lg:block" aria-hidden>
        <div className="absolute left-[8%] top-1/4 h-64 w-64 rounded-full bg-black/[0.02] dark:bg-white/[0.02] blur-[100px]" />
        <div className="absolute bottom-1/4 right-[8%] h-72 w-72 rounded-full bg-black/[0.015] dark:bg-white/[0.015] blur-[120px]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-safe md:max-w-lg lg:max-w-xl lg:flex-row lg:items-center lg:gap-20 lg:px-12 xl:max-w-[1000px] xl:gap-28">
        {/* Left side — hero content for desktop */}
        <div className="mb-8 hidden flex-1 lg:mb-0 lg:block xl:flex-1">
          <p className="mb-3 font-data text-[11px] font-semibold uppercase tracking-[0.28em] text-stone">
            Your profile
          </p>
          <h1 className="font-display mb-6 text-[52px] font-semibold leading-[1.02] text-black dark:text-white xl:text-[64px]">
            Complete<br />your profile
          </h1>
          <p className="mb-12 max-w-md text-[17px] leading-[1.7] text-stone/60">
            Add your body stats for a more personalized AI coach experience. This is optional — you can always come back later.
          </p>
        </div>

        {/* Right side — form */}
        <div className="flex flex-1 flex-col lg:flex-none lg:w-[420px] xl:w-[440px]">
          {/* Mobile headline */}
          <div className="mb-6 lg:hidden">
            <p className="mb-1 font-data text-[11px] font-semibold uppercase tracking-[0.28em] text-stone">
              Your profile
            </p>
            <h1 className="font-display mb-2 text-[36px] font-semibold leading-[1.1] text-black dark:text-white">
              Complete your profile
            </h1>
            <p className="text-[15px] leading-relaxed text-stone/70">
              Add your body stats for a more personalized AI coach.
            </p>
          </div>

      <div className="space-y-4">
        <Section label="About you">
          <div className="ios-row">
            <span className="flex-1 text-sm text-black dark:text-white">Name</span>
            <input
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              enterKeyHint="next"
              className="w-44 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.04] px-3.5 py-2.5 text-left text-sm text-black dark:text-white placeholder:text-stone/40 outline-none backdrop-blur-xl transition-all duration-300 focus:border-black/[0.2] dark:focus:border-white/[0.2] focus:bg-black/[0.06] dark:focus:bg-white/[0.06]"
            />
          </div>
          <div className="ios-row">
            <span className="flex-1 text-sm text-black dark:text-white">Date of birth</span>
            <DatePickerInput value={dateOfBirth} onChange={setDateOfBirth} />
          </div>
          <div className="ios-row flex-col !items-stretch !gap-2.5">
            <span className="text-sm text-black dark:text-white">Sex</span>
            <SegmentedControlSex value={sex} onChange={setSex} />
          </div>
        </Section>

        <Section label="Body">
          <FieldRow label="Weight" unit="kg">
            <Stepper value={weightKg} onChange={setWeightKg} min={30} max={300} />
          </FieldRow>
          <FieldRow label="Height" unit="cm">
            <Stepper value={heightCm} onChange={setHeightCm} min={120} max={230} />
          </FieldRow>
        </Section>
      </div>

      {error ? <p className="mt-4 text-center text-sm text-rose lg:text-left">{error}</p> : null}

      <div className="mt-8 space-y-3 lg:mt-auto lg:pt-4">
        <Button
          full
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="py-4 text-base"
        >
          {mutation.isPending ? "Saving…" : "Save profile"}
        </Button>
        <button
          onClick={() => navigate("/app", { replace: true })}
          className="w-full text-center text-[14px] text-stone/50 hover:text-stone/80 transition-colors"
        >
          Skip for now
        </button>
      </div>
        </div>
      </div>
    </div>
  );
}
