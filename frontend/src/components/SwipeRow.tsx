import { useRef, useState, useCallback, type ReactNode } from "react";

type SwipeRowProps = {
  onConfirm: () => void;
  children: ReactNode;
  disabled?: boolean;
};

const THRESHOLD = 90;

/** Premium swipe-to-confirm row on mobile, tap-to-confirm button on desktop. */
export function SwipeRow({ onConfirm, children, disabled }: SwipeRowProps) {
  const startX = useRef<number | null>(null);
  const dxRef = useRef(0);
  const [dx, setDx] = useState(0);

  const onDown = useCallback((clientX: number) => {
    if (disabled) return;
    startX.current = clientX;
  }, [disabled]);

  const onMove = useCallback((clientX: number) => {
    if (startX.current === null) return;
    const newDx = Math.max(-THRESHOLD * 1.4, Math.min(THRESHOLD * 1.4, clientX - startX.current));
    dxRef.current = newDx;
    setDx(newDx);
  }, []);

  const onUp = useCallback(() => {
    const currentDx = dxRef.current;
    startX.current = null;
    if (Math.abs(currentDx) > THRESHOLD) {
      onConfirm();
    }
    dxRef.current = 0;
    setDx(0);
  }, [onConfirm]);

  const swiped = Math.abs(dx) > THRESHOLD;

  return (
    <div className="relative select-none overflow-hidden rounded-2xl">
      {/* Reveal behind — mobile only */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-2xl bg-black/[0.12] pr-5 backdrop-blur-xl lg:hidden dark:bg-white/[0.12]"
        style={{ opacity: swiped ? 1 : 0.25 + Math.min(0.75, Math.abs(dx) / THRESHOLD) * 0.75 }}
      >
        <span className="text-sm font-semibold text-black dark:text-ivory">Log set</span>
      </div>

      {/* Swipe layer — mobile only */}
      <div
        className="touch-pan-y lg:hidden"
        style={{ cursor: "grab" }}
        onPointerDown={(e) => onDown(e.clientX)}
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div
          className={`relative rounded-2xl transition-transform duration-150 ${
            swiped ? "animate-set-pulse" : ""
          }`}
          style={{ transform: `translateX(${dx}px)` }}
        >
          {children}
        </div>
      </div>

      {/* Desktop: children + log button */}
      <div className="hidden lg:block">
        {children}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className="rounded-xl border border-black/[0.08] bg-black/[0.06] px-5 py-2 text-[13px] font-semibold text-black backdrop-blur-xl transition-all duration-200 hover:bg-black/[0.12] active:scale-95 disabled:opacity-40 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-ivory dark:hover:bg-white/[0.12]"
          >
            Log set
          </button>
        </div>
      </div>
    </div>
  );
}
