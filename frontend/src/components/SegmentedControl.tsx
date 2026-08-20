import type { CSSProperties } from "react";

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
  /** Minimum column width (px) when wrapping on narrow screens — omit `columns` to enable auto-wrap. */
  minCol?: number;
};

/** Premium iOS-style segmented control — glass active state with glow. Wraps gracefully on narrow screens. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  columns,
  minCol = 96,
}: SegmentedControlProps<T>) {
  const auto = !columns;

  const style: CSSProperties = auto
    ? ({ "--seg-min": `${minCol}px` } as CSSProperties)
    : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };

  const containerClass = `grid gap-2 rounded-2xl bg-black/[0.05] p-2 backdrop-blur-xl dark:bg-white/[0.05] ${
    auto
      ? "grid-cols-[repeat(auto-fit,minmax(min(var(--seg-min),100%),1fr))] lg:flex lg:flex-wrap lg:justify-center lg:w-fit lg:mx-auto"
      : ""
  }`;

  return (
    <div className={containerClass} style={style}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`whitespace-nowrap rounded-xl px-3 py-3.5 text-[13px] font-medium transition-all duration-300 active:scale-[0.97] ${
              auto ? "lg:flex-none" : ""
            } ${
              active
                ? "bg-steel/90 text-ink shadow-glow font-semibold"
                : "text-ash hover:text-black hover:bg-black/[0.05] dark:hover:text-ivory dark:hover:bg-white/[0.05]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}