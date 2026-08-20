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
  const gridStyle = columns
    ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
    : { gridTemplateColumns: `repeat(auto-fit, minmax(min(${minCol}px, 100%), 1fr))` };

  return (
    <div
      className="grid gap-2 rounded-2xl bg-black/[0.05] p-2 backdrop-blur-xl dark:bg-white/[0.05]"
      style={gridStyle}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`whitespace-nowrap rounded-xl px-3 py-3.5 text-[13px] font-medium transition-all duration-300 active:scale-[0.97] ${
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