import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import { ChevronRightIcon } from "../components/icons";
import { api } from "../lib/api";
import type { ProfileInput } from "../lib/types";

const GOALS = [
  { value: "hypertrophy", label: "Hypertrophy" },
  { value: "strength", label: "Strength" },
  { value: "general fitness", label: "General" },
];

const EQUIPMENT = [
  { value: "full gym", label: "Full gym" },
  { value: "home dumbbells", label: "Dumbbells" },
  { value: "bodyweight only", label: "Bodyweight" },
];

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="ios-section-label">{label}</p>
      <div className="ios-list">{children}</div>
    </div>
  );
}

function Row({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`ios-row ${className ?? ""}`}>
      <span className="flex-1 text-[15px] text-ivory">{label}</span>
      {children}
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="ios-row ios-tap w-full"
      >
        <span className="flex-1 text-[15px] text-ivory">{label}</span>
        <span className="text-[15px] text-stone">{selected?.label}</span>
        <ChevronRightIcon
          className={`h-4 w-4 shrink-0 text-ash transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && (
        <div className="border-t border-white/[0.04] px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  value === opt.value
                    ? "bg-ivory text-ink shadow-glow"
                    : "border border-white/[0.08] bg-white/[0.04] text-stone hover:bg-white/[0.06] hover:text-ivory"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DaysRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="ios-row">
      <span className="flex-1 text-[15px] text-ivory">Training days</span>
      <div className="flex gap-1.5">
        {[2, 3, 4, 5, 6].map((d) => (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 ${
              value === d
                ? "bg-ivory text-ink shadow-glow"
                : "border border-white/[0.08] bg-white/[0.04] text-stone hover:bg-white/[0.06]"
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: api.getProfile,
    placeholderData: (prev) => prev,
  });
  const [form, setForm] = useState<ProfileInput | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const profile = profileQuery.data;

  const set = useCallback(
    <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => {
      setForm((f) => {
        if (!f && profile) {
          return { ...profile, [key]: value };
        }
        if (f) return { ...f, [key]: value };
        return f;
      });
      setHasChanges(true);
    },
    [profile],
  );

  const save = useMutation({
    mutationFn: () => {
      if (!form && profile) return api.saveProfile({ ...profile });
      if (!form) return Promise.reject(new Error("No changes to save"));
      return api.saveProfile(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setHasChanges(false);
    },
  });

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-7 w-44" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const f = form ?? {
    full_name: profile?.full_name ?? "",
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
    <div className="animate-slide-up space-y-6">
      <header className="flex items-end justify-between pt-2">
        <div>
          <p className="font-data text-[10px] uppercase tracking-[0.26em] text-stone">
            Settings
          </p>
          <h1 className="font-display mt-1 text-[34px] leading-tight text-ivory">
            Profile
          </h1>
        </div>
        {hasChanges && (
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-full bg-ivory px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-white active:scale-95 disabled:opacity-50"
          >
            {save.isPending ? "Saving..." : "Save"}
          </button>
        )}
      </header>

      <Section label="Personal">
        <button
          onClick={() => navigate("/profile-setup")}
          className="ios-row ios-tap"
        >
          <span className="flex-1 text-[15px] text-ivory">Edit profile</span>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-ash" />
        </button>
        <div className="ios-row">
          <span className="text-[15px] text-ivory">Name</span>
          <input
            value={f.full_name ?? ""}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Enter name"
            className="ml-auto w-48 rounded-lg bg-transparent px-3 py-1 text-left text-base text-ivory placeholder:text-ash/40 outline-none"
          />
        </div>
        <Row label="Age">
          <span className="font-data text-lg text-ivory">{f.age} <span className="text-sm text-stone">yrs</span></span>
        </Row>
        <Row label="Weight">
          <span className="font-data text-lg text-ivory">{Math.round(f.weight_kg ?? 70)} <span className="text-sm text-stone">kg</span></span>
        </Row>
        <Row label="Height">
          <span className="font-data text-lg text-ivory">{Math.round(f.height_cm ?? 170)} <span className="text-sm text-stone">cm</span></span>
        </Row>
        <Row label="Experience">
          <span className="font-data text-lg text-ivory">{f.experience_years} <span className="text-sm text-stone">yrs</span></span>
        </Row>
      </Section>

      <Section label="Training">
        <SelectRow
          label="Goal"
          value={f.goal as string}
          options={GOALS}
          onChange={(v) => set("goal", v as ProfileInput["goal"])}
        />
        <SelectRow
          label="Equipment"
          value={f.equipment_access as string}
          options={EQUIPMENT}
          onChange={(v) => set("equipment_access", v as ProfileInput["equipment_access"])}
        />
        <DaysRow
          value={f.days_per_week}
          onChange={(v) => set("days_per_week", v)}
        />
      </Section>

      <Section label="About">
        <Row label="Exercise data">
          <a
            href="https://github.com/hasaneyldrm/exercises-dataset"
            target="_blank"
            rel="noreferrer"
            className="text-[15px] text-stone"
          >
            exercises-dataset
          </a>
        </Row>
        <div className="px-4 py-3">
          <p className="text-xs leading-relaxed text-ash/60">
            Exercise media used under license. Displayed at original resolution.
          </p>
        </div>
      </Section>
    </div>
  );
}
