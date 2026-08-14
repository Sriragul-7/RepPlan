import { useRef, useState, useCallback, type ReactNode } from "react";

type SwipeRowProps = {
  onConfirm: () => void;
  children: ReactNode;
  disabled?: boolean;
};

const THRESHOLD = 90;

/** Premium swipe-to-confirm row — white accent reveal. */
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
    <div
      className="relative touch-pan-y select-none overflow-hidden rounded-2xl"
      onPointerDown={(e) => onDown(e.clientX)}
      onPointerMove={(e) => onMove(e.clientX)}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{ cursor: "grab" }}
    >
      {/* reveal behind */}
      <div
        className="absolute inset-0 flex items-center justify-end rounded-2xl bg-white/[0.12] pr-5 backdrop-blur-xl"
        style={{ opacity: swiped ? 1 : 0.25 + Math.min(0.75, Math.abs(dx) / THRESHOLD) * 0.75 }}
      >
        <span className="text-sm font-semibold text-ivory">Log set</span>
      </div>
      <div
        className={`relative rounded-2xl transition-transform duration-150 ${
          swiped ? "animate-set-pulse" : ""
        }`}
        style={{ transform: `translateX(${dx}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
