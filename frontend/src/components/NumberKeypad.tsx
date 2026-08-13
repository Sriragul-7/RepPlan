type NumberKeypadProps = {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onDone: () => void;
  decimals?: number;
};

/** Inline numeric keypad — revealed by tapping a stepper value for a big jump. */
export function NumberKeypad({ onDigit, onBackspace, onClear, onDone, decimals = 0 }: NumberKeypadProps) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", decimals > 0 ? "." : "C", "0", "⌫"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k) => {
        if (k === "⌫")
          return (
            <button
              key={k}
              type="button"
              onClick={onBackspace}
              className="h-14 rounded-2xl border border-white/10 bg-white/5 text-lg text-bone active:scale-95"
            >
              ⌫
            </button>
          );
        if (k === "C")
          return (
            <button
              key={k}
              type="button"
              onClick={onClear}
              className="h-14 rounded-2xl border border-white/10 bg-white/5 text-xs text-ash active:scale-95"
            >
              clear
            </button>
          );
        return (
          <button
            key={k}
            type="button"
            onClick={() => onDigit(k)}
            className="h-14 rounded-2xl border border-white/10 bg-white/5 text-xl text-bone transition active:scale-95"
          >
            {k}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onDone}
        className="col-span-3 h-12 rounded-2xl bg-ember text-sm font-semibold text-bone shadow-glow active:scale-[0.98]"
      >
        Done
      </button>
    </div>
  );
}
