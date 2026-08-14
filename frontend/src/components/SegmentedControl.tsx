type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
};

/** Premium iOS-style segmented control — glass active state with glow. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  columns = options.length,
}: SegmentedControlProps<T>) {
  return (
    <div
      className="grid gap-1 rounded-2xl bg-white/[0.04] p-1 backdrop-blur-xl"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 active:scale-[0.97] ${
              active
                ? "bg-steel/90 text-ink shadow-glow font-semibold"
                : "text-ash hover:text-ivory hover:bg-white/[0.04]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
