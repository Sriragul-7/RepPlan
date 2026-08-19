import { useEffect, useRef, useState } from "react";
import { DisciplineRing } from "./DisciplineRing";
import { SkipIcon } from "./icons";

type RestTimerProps = {
  /** seconds of total rest */
  seconds: number;
  /** increments each time a set is logged, forcing a reset */
  id: number;
  onFinish: () => void;
  onSkip: () => void;
  active: boolean;
};

/** Premium rest timer with glass effect — shown as the Discipline Ring after a logged set. */
export function RestTimer({ seconds, id, onFinish, onSkip, active }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;
    const target = Date.now() + seconds * 1000;
    setRemaining(seconds);

    const tick = () => {
      const left = Math.max(0, Math.round((target - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        onFinish();
      }
    };

    timerRef.current = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, seconds, id]);

  if (!active) return null;

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");
  const progress = seconds > 0 ? remaining / seconds : 0;

  return (
    <div className="animate-scale-in pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-6 lg:bottom-10">
      <div className="glass-card pointer-events-auto flex items-center gap-4 rounded-[28px] border border-black/[0.08] p-4 pr-2 shadow-card backdrop-blur-xl dark:border-white/[0.06]">
        <DisciplineRing value={progress} size={64} strokeWidth={5}>
          <span className="font-data text-sm text-black dark:text-ivory">
            {mm}:{ss}
          </span>
        </DisciplineRing>
        <div>
          <p className="font-data text-[10px] uppercase tracking-[0.2em] text-ash">Rest</p>
          <button
            onClick={onSkip}
            className="mt-1 flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-black/[0.04] px-4 py-2 text-sm font-medium text-gray-500 backdrop-blur-xl transition-all duration-300 hover:bg-black/[0.08] active:scale-95 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-silver dark:hover:bg-white/[0.08]"
          >
            <SkipIcon className="h-4 w-4" />
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
