type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  columns = options.length,
}: SegmentedControlProps<T>) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-2xl border px-3 py-3.5 text-sm font-medium transition active:scale-[0.97] ${
              active
                ? "border-white/20 bg-ember text-bone shadow-glow"
                : "border-white/10 bg-white/5 text-ash"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
