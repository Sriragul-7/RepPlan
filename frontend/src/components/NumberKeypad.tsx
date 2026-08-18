type NumberKeypadProps = {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onDone: () => void;
  decimals?: number;
};

/** Premium inline numeric keypad — glass buttons with subtle borders. */
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
              className="h-14 rounded-2xl border border-black/[0.08] bg-black/[0.04] text-lg text-black backdrop-blur-xl transition-all duration-300 hover:bg-black/[0.08] active:scale-95 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-ivory dark:hover:bg-white/[0.08]"
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
              className="h-14 rounded-2xl border border-black/[0.08] bg-black/[0.04] text-xs text-ash backdrop-blur-xl transition-all duration-300 hover:bg-black/[0.08] active:scale-95 dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
            >
              clear
            </button>
          );
        return (
          <button
            key={k}
            type="button"
            onClick={() => onDigit(k)}
            className="h-14 rounded-2xl border border-black/[0.08] bg-black/[0.04] text-xl text-black backdrop-blur-xl transition-all duration-300 hover:bg-black/[0.08] active:scale-95 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-ivory dark:hover:bg-white/[0.08]"
          >
            {k}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onDone}
        className="col-span-3 h-12 rounded-2xl bg-steel text-ink text-sm font-semibold shadow-glow transition-all duration-300 hover:shadow-glow-lg active:scale-[0.98]"
      >
        Done
      </button>
    </div>
  );
}
