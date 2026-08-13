import type { CSSProperties } from "react";

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  decimals?: number;
  label?: string;
  onLongPress?: () => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * +/- stepper used for weight & reps entry (minimal typing, sweaty-finger friendly).
 * Values render in JetBrains Mono — numbers read as data.
 */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  decimals = 0,
  label,
  className,
  style,
}: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const display = decimals > 0 ? value.toFixed(decimals) : String(value);

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`} style={style}>
      {label ? (
        <span className="mr-1 w-16 shrink-0 text-xs uppercase tracking-wider text-ash">{label}</span>
      ) : null}
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(clamp(value - step))}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-bone transition active:scale-90"
      >
        −
      </button>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(clamp(value + step))}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-bone transition active:scale-90"
      >
        +
      </button>
      <span className="font-data min-w-[4ch] text-center text-2xl text-bone">{display}</span>
    </div>
  );
}
