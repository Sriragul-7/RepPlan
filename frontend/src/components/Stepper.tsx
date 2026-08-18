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
    <div className={`flex items-center gap-1 ${className ?? ""}`} style={style}>
      {label ? (
        <span className="w-9 shrink-0 text-xs uppercase tracking-wider text-ash">{label}</span>
      ) : null}
      <button
        type="button"
        aria-label={`Decrease ${label ?? "value"}`}
        onClick={() => onChange(clamp(value - step))}
        className="group flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-black/[0.04] text-[15px] text-stone transition-all duration-200 hover:border-black/[0.12] hover:bg-black/[0.08] hover:text-black active:scale-90 active:bg-black/[0.12] dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.08] dark:hover:text-ivory dark:active:bg-white/[0.12]"
      >
        <span className="transition-transform duration-200 group-hover:scale-110">−</span>
      </button>
      <button
        type="button"
        aria-label={`Value ${label ?? ""}`}
        onClick={() => {
          if (onLongPress) onLongPress();
          if (onValueTap) onValueTap();
        }}
        className="flex h-8 min-w-[3.5ch] items-center justify-center rounded-lg px-2 font-data text-[15px] tabular-nums text-black transition-all duration-200 active:scale-90 dark:text-ivory"
      >
        {display}
      </button>
      <button
        type="button"
        aria-label={`Increase ${label ?? "value"}`}
        onClick={() => onChange(clamp(value + step))}
        className="group flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-black/[0.04] text-[15px] text-stone transition-all duration-200 hover:border-black/[0.12] hover:bg-black/[0.08] hover:text-black active:scale-90 active:bg-black/[0.12] dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.08] dark:hover:text-ivory dark:active:bg-white/[0.12]"
      >
        <span className="transition-transform duration-200 group-hover:scale-110">+</span>
      </button>
    </div>
  );
}
