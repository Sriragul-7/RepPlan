import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Logo } from "../components/Logo";
import { DisciplineRing } from "../components/DisciplineRing";

const QUOTES = [
  "Nobody is coming to save your gains.",
  "Discipline beats motivation. Again.",
  "The plan doesn't lift the weight. You do.",
  "Your future physique is watching.",
  "Excuses don't count as reps.",
];

const TICKER_ITEMS = [
  "CHEST ✓",
  "BACK ✓",
  "LEGS ✓",
  "SHOULDERS ✓",
  "ARMS ✓",
  "DISCIPLINE ↑",
];

/* ─── Feature SVG Icons ─── */

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5h11M6.5 17.5h11" />
      <rect x="3" y="6" width="3" height="12" rx="1" />
      <rect x="18" y="6" width="3" height="12" rx="1" />
      <line x1="6.5" y1="12" x2="17.5" y2="12" />
      <rect x="5" y="8" width="1.5" height="8" rx="0.5" />
      <rect x="17.5" y="8" width="1.5" height="8" rx="0.5" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 4.5 2.8A4 4 0 0 1 20 8.5a4.5 4.5 0 0 1-.8 8A3.5 3.5 0 0 1 16 20H8a3.5 3.5 0 0 1-3.2-3.5 4.5 4.5 0 0 1-.8-8A4 4 0 0 1 7.5 4.8 5 5 0 0 1 12 2z" />
      <path d="M12 2v20" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c1.5 4-2 6-2 10a4 4 0 0 0 8 0c0-4-3.5-6-2-10" />
      <path d="M12 22a4 4 0 0 0 4-4c0-3-2-4.5-2-7" />
    </svg>
  );
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function RepCounter() {
  const [count, setCount] = useState(0);
  const target = 4;
  useEffect(() => {
    if (count >= target) return;
    const t = setTimeout(() => setCount((c) => c + 1), 400);
    return () => clearTimeout(t);
  }, [count]);
  return (
    <div className="font-data flex flex-col items-center gap-1">
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={`text-[13px] font-bold transition-all duration-500 ${
            count >= n ? "text-white opacity-100" : "text-white/10 opacity-40"
          }`}
        >
          {String(n).padStart(2, "0")}
        </span>
      ))}
      <span
        className={`mt-1 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-700 ${
          count >= target ? "text-steel opacity-100" : "text-transparent opacity-0"
        }`}
      >
        LOCKED IN
      </span>
    </div>
  );
}

function DisciplineMeter() {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const steps = [0.15, 0.35, 0.55, 0.75, 0.9];
    let i = 0;
    const t = setInterval(() => {
      if (i < steps.length) { setVal(steps[i]); i++; }
    }, 800);
    return () => clearInterval(t);
  }, []);
  return (
    <DisciplineRing value={val} size={80} strokeWidth={6}>
      <span className="font-data text-[11px] font-bold text-white/80">
        {Math.round(val * 100)}%
      </span>
    </DisciplineRing>
  );
}

function WorkoutTicker() {
  return (
    <div className="overflow-hidden">
      <div className="animate-marquee flex gap-6 whitespace-nowrap">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span
            key={i}
            className="font-accent text-[11px] font-semibold uppercase tracking-[0.15em] text-white/25"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
  large,
}: {
  title: string;
  desc: string;
  icon: ReactNode;
  large?: boolean;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`glass-card glass-shine transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${large ? "p-6" : "p-5"} ${large ? "col-span-2" : ""}`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06]">
        {icon}
      </div>
      <h3 className="font-display mb-1.5 text-[17px] font-bold text-white">{title}</h3>
      <p className="text-[14px] leading-[1.6] text-stone/70">{desc}</p>
    </div>
  );
}

function ProductPreview() {
  const { ref, visible } = useInView(0.2);
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
      }`}
    >
      <div className="glass-card glass-shine relative mx-auto max-w-sm overflow-hidden p-0">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
          <span className="font-display text-[13px] font-bold uppercase tracking-wider text-white/60">
            Today's Session
          </span>
          <span className="font-data text-[11px] font-semibold text-white/30">
            Push Day
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-px border-b border-white/[0.04]">
          {[
            { label: "SETS", value: "18", sub: "completed" },
            { label: "VOLUME", value: "4.2T", sub: "kg total" },
            { label: "STREAK", value: "12", sub: "days" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-4">
              <span className="font-data text-[10px] font-semibold uppercase tracking-[0.2em] text-stone/50">
                {s.label}
              </span>
              <span className="font-display mt-1 text-[22px] font-bold text-white">
                {s.value}
              </span>
              <span className="font-data text-[10px] text-stone/40">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* Exercise rows */}
        <div className="divide-y divide-white/[0.04]">
          {[
            { name: "Bench Press", sets: "4 × 8", weight: "80 kg", done: true },
            { name: "OHP", sets: "3 × 10", weight: "50 kg", done: true },
            { name: "Incline DB Press", sets: "3 × 12", weight: "28 kg", done: false },
          ].map((ex) => (
            <div key={ex.name} className="flex items-center gap-3 px-5 py-3.5">
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                  ex.done
                    ? "bg-white/10"
                    : "border border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                {ex.done && (
                  <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] font-medium ${ex.done ? "text-white/50 line-through" : "text-white"}`}>
                  {ex.name}
                </p>
                <p className="font-data text-[11px] text-stone/50">{ex.sets}</p>
              </div>
              <span className="font-data text-[12px] font-semibold text-white/40">
                {ex.weight}
              </span>
            </div>
          ))}
        </div>

        {/* Progress ring bottom */}
        <div className="flex items-center justify-center gap-4 border-t border-white/[0.04] py-5">
          <DisciplineRing value={0.67} size={48} strokeWidth={4}>
            <span className="font-data text-[9px] font-bold text-white/70">67%</span>
          </DisciplineRing>
          <div>
            <p className="text-[13px] font-semibold text-white/80">Session Progress</p>
            <p className="font-data text-[11px] text-stone/50">2 of 3 exercises done</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const startCta = () => {
    if (user) {
      navigate("/app", { replace: true });
    } else {
      navigate("/auth", { replace: true });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="app-bg" aria-hidden />

      {/* Floating orbs */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-white/[0.02] blur-[120px]" />
        <div className="absolute bottom-1/3 right-0 h-64 w-64 rounded-full bg-white/[0.015] blur-[100px]" />
      </div>

      {/* ─── NAV ─── */}
      <nav className="relative z-10 flex items-center justify-between px-5 pt-safe pb-4 md:px-10">
        <div className="flex items-center gap-2.5">
          <Logo className="h-7 w-7" />
          <span className="font-display text-[15px] font-bold uppercase tracking-[0.12em] text-white">
            RepPlan
          </span>
        </div>
        <button
          onClick={() => navigate(user ? "/app" : "/auth")}
          className="rounded-full border border-white/[0.06] bg-white/[0.04] px-5 py-2 text-[13px] font-medium text-ivory backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.08] active:scale-[0.97]"
        >
          Sign in
        </button>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative z-10 mx-auto max-w-3xl px-5 pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Brand label */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 max-w-[40px] bg-white/10" />
          <span className="font-data text-[10px] font-semibold uppercase tracking-[0.3em] text-stone/60">
            REPPLAN / TRAIN WITH INTENT
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-[44px] font-bold leading-[1.04] tracking-tight text-white sm:text-[56px] md:text-[68px] lg:text-[76px]">
          Discipline
          <br />
          made visible.
        </h1>

        {/* Sub */}
        <p className="mt-5 max-w-md text-[16px] leading-[1.7] text-stone/60 md:text-[18px]">
          Plan your split. Log every set. Watch your strength move.
          A system for people who train with purpose.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={startCta}
            className="rounded-full bg-steel px-8 py-4 text-[15px] font-bold text-ink shadow-glow transition-all duration-300 hover:shadow-glow-lg active:scale-[0.97]"
          >
            Start Training
          </button>
          <button
            onClick={() => navigate(user ? "/app" : "/auth")}
            className="rounded-full border border-white/[0.06] bg-white/[0.04] px-7 py-4 text-[15px] font-medium text-ivory backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.08] active:scale-[0.97]"
          >
            Sign in
          </button>
        </div>

        {/* Quote */}
        <p className="mt-10 max-w-sm text-[14px] italic leading-[1.6] text-stone/40">
          "{QUOTES[quoteIdx]}"
        </p>
      </section>

      {/* ─── WORKOUT TICKER ─── */}
      <div className="relative z-10 border-y border-white/[0.03] py-4">
        <WorkoutTicker />
      </div>

      {/* ─── PRODUCT PREVIEW + INTERACTIVE ─── */}
      <section className="relative z-10 mx-auto max-w-3xl px-5 py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <ProductPreview />

          {/* Interactive sidebar (desktop) */}
          <div className="hidden flex-col items-center gap-8 lg:flex">
            <RepCounter />
            <DisciplineMeter />
            <div className="text-center">
              <p className="font-data text-[10px] font-semibold uppercase tracking-[0.25em] text-stone/40">
                Discipline Level
              </p>
              <p className="font-display mt-1 text-[13px] font-bold text-white/50">
                Increasing
              </p>
            </div>
          </div>

          {/* Mobile interactive row */}
          <div className="flex items-center justify-center gap-8 lg:hidden">
            <RepCounter />
            <DisciplineMeter />
          </div>
        </div>
      </section>

      {/* ─── WHY REPPLAN ─── */}
      <section className="relative z-10 mx-auto max-w-3xl px-5 py-16 md:py-24">
        <SectionHeader
          label="WHY REPPLAN"
          title="Not just another workout tracker."
        />
        <div className="mt-8 max-w-lg space-y-5">
          <p className="text-[16px] leading-[1.7] text-stone/60">
            Most fitness apps help you count workouts.
            RepPlan helps you build discipline around them.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {["Consistency", "Structure", "Progress", "Simplicity"].map((w) => (
              <span
                key={w}
                className="rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/50"
              >
                {w}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6">
          <p className="font-display text-[20px] font-bold leading-[1.5] text-white/80">
            Train without distraction.
            <br />
            Track without friction.
            <br />
            Progress without guessing.
          </p>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative z-10 mx-auto max-w-3xl px-5 py-16 md:py-24">
        <SectionHeader label="FEATURES" title="Built for the grind." />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FeatureCard
            icon={<ClipboardIcon className="h-5 w-5 text-white/70" />}
            title="Build Your Split"
            desc="AI-powered workout plans tailored to your body, goals, and schedule."
            large
          />
          <FeatureCard
            icon={<DumbbellIcon className="h-5 w-5 text-white/70" />}
            title="Log Every Set"
            desc="Quick weight, rep, and set tracking designed for the gym floor."
          />
          <FeatureCard
            icon={<ChartIcon className="h-5 w-5 text-white/70" />}
            title="Track Progress"
            desc="Strength curves, volume trends, and training history at a glance."
          />
          <FeatureCard
            icon={<BrainIcon className="h-5 w-5 text-white/70" />}
            title="AI Coach"
            desc="Ask fitness and nutrition questions, get personalized guidance."
          />
          <FeatureCard
            icon={<PhoneIcon className="h-5 w-5 text-white/70" />}
            title="Mobile First"
            desc="PWA designed to work naturally on your phone between sets."
          />
          <FeatureCard
            icon={<FlameIcon className="h-5 w-5 text-white/70" />}
            title="Train With Structure"
            desc="Walk into the gym knowing exactly what to do today."
            large
          />
        </div>
      </section>

      {/* ─── MOTIVATIONAL BREAK ─── */}
      <section className="relative z-10 border-y border-white/[0.03] py-16 md:py-20">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <p className="font-display text-[28px] font-bold leading-[1.4] text-white/80 md:text-[36px]">
            {QUOTES[(quoteIdx + 1) % QUOTES.length]}
          </p>
          <div className="mx-auto mt-6 h-px w-16 bg-white/10" />
        </div>
      </section>

      {/* ─── SOCIAL PROOF (Philosophy) ─── */}
      <section className="relative z-10 mx-auto max-w-3xl px-5 py-16 md:py-24">
        <div className="glass-card glass-shine p-8 text-center md:p-12">
          <p className="font-display text-[22px] font-bold leading-[1.5] text-white/80 md:text-[28px]">
            Built for the days when motivation disappears.
          </p>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-[1.7] text-stone/50">
            Motivation gets you started. Discipline keeps you going.
            RepPlan is built for the second kind of day.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative z-10 border-t border-white/[0.03] py-20 md:py-28">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <p className="font-display text-[36px] font-bold leading-[1.2] text-white md:text-[48px]">
            Ready to lock in?
          </p>
          <p className="mt-4 text-[16px] leading-[1.7] text-stone/50">
            Build your plan. Track your work. Become harder to outwork.
          </p>
          <button
            onClick={startCta}
            className="mt-8 rounded-full bg-steel px-10 py-4 text-[16px] font-bold text-ink shadow-glow transition-all duration-300 hover:shadow-glow-lg active:scale-[0.97]"
          >
            Start RepPlan
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-white/[0.03] py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" />
            <span className="font-display text-[12px] font-bold uppercase tracking-[0.12em] text-white/30">
              RepPlan
            </span>
          </div>
          <p className="font-data text-[10px] text-stone/30">
            Discipline made visible.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <p className="font-data mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-stone/50">
        {label}
      </p>
      <h2 className="font-display text-[28px] font-bold text-white md:text-[34px]">
        {title}
      </h2>
    </div>
  );
}
