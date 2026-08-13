import { useRef, useState, type ReactNode } from "react";

type SwipeRowProps = {
  onConfirm: () => void;
  children: ReactNode;
  disabled?: boolean;
};

const THRESHOLD = 90;

/** Swipe-to-confirm row — drag right (or left) past the threshold to trigger. */
export function SwipeRow({ onConfirm, children, disabled }: SwipeRowProps) {
  const startX = useRef<number | null>(null);
  const [dx, setDx] = useState(0);
  const [armed, setArmed] = useState(false);

  const onDown = (clientX: number) => {
    if (disabled) return;
    startX.current = clientX;
  };
  const onMove = (clientX: number) => {
    if (startX.current === null) return;
    setDx(Math.max(-THRESHOLD * 1.4, Math.min(THRESHOLD * 1.4, clientX - startX.current)));
    setArmed(Math.abs(dx) > THRESHOLD);
  };
  const onUp = () => {
    startX.current = null;
    if (armed) {
      onConfirm();
    }
    setDx(0);
    setArmed(false);
  };

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
        className="absolute inset-0 flex items-center justify-end rounded-2xl bg-ember pr-5"
        style={{ opacity: swiped ? 1 : 0.25 + Math.min(0.75, Math.abs(dx) / THRESHOLD) * 0.75 }}
      >
        <span className="text-sm font-semibold text-bone">Log set</span>
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
