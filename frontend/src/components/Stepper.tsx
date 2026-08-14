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
  onValueTap?: () => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * Premium +/- stepper for weight & reps entry (minimal typing, sweaty-finger friendly).
 * Tap the value itself to jump straight into the numeric keypad.
 * Values render in mono — numbers read as data.
 */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  decimals = 0,
  label,
  onLongPress,
  onValueTap,
  className,
  style,
}: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const display = decimals > 0 ? value.toFixed(decimals) : String(value);

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`} style={style}>
      {label ? (
        <span className="w-9 shrink-0 text-xs uppercase tracking-wider text-ash">{label}</span>
      ) : null}
      <button
        type="button"
        aria-label={`Decrease ${label ?? "value"}`}
        onClick={() => onChange(clamp(value - step))}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] text-lg text-ivory backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.08] active:scale-90"
      >
        −
      </button>
      <button
        type="button"
        aria-label={`Value ${label ?? ""}`}
        onClick={() => {
          if (onLongPress) onLongPress();
          if (onValueTap) onValueTap();
        }}
        className="flex h-9 min-w-[4ch] items-center justify-center rounded-xl px-1 font-data text-xl text-silver transition-all duration-300 active:scale-90"
      >
        {display}
      </button>
      <button
        type="button"
        aria-label={`Increase ${label ?? "value"}`}
        onClick={() => onChange(clamp(value + step))}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] text-lg text-ivory backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.08] active:scale-90"
      >
        +
      </button>
    </div>
  );
}
