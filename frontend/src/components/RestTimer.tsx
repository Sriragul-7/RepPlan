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

/** Rest timer shown as the Discipline Ring in glacier mode after a logged set. */
export function RestTimer({ seconds, id, onFinish, onSkip, active }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(seconds);
    if (!active) return;
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onFinish();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, seconds, id]);

  if (!active) return null;

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");
  const progress = seconds > 0 ? remaining / seconds : 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-6">
      <div className="glass-card pointer-events-auto flex items-center gap-4 rounded-[24px] p-4 pr-2 shadow-card">
        <DisciplineRing value={progress} size={64} strokeWidth={5} color="#5FD8E0">
          <span className="font-data text-sm text-glacier">
            {mm}:{ss}
          </span>
        </DisciplineRing>
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-ash">Rest</p>
          <button
            onClick={onSkip}
            className="mt-1 flex items-center gap-1.5 rounded-full border border-glacier/30 bg-glacier/10 px-4 py-2 text-sm font-medium text-glacier transition active:scale-95"
          >
            <SkipIcon className="h-4 w-4" />
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
