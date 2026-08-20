import { useRef, useCallback, type ReactNode } from "react";

type SwipeRowProps = {
  onConfirm: () => void;
  children: ReactNode;
  disabled?: boolean;
};

const THRESHOLD = 90;
const MAX_DX = THRESHOLD * 1.4;
const INTENT = 10;

const SPRING = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
const CONFIRM = "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)";

/** Premium swipe-to-confirm row on mobile, tap-to-confirm button on desktop. */
export function SwipeRow({ onConfirm, children, disabled }: SwipeRowProps) {
  const startX = useRef<number | null>(null);
  const startY = useRef(0);
  const activeRef = useRef(false);
  const confirmingRef = useRef(false);
  const raf = useRef<number | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const render = useCallback((dx: number) => {
    const card = cardRef.current;
    const label = labelRef.current;
    if (card) card.style.transform = `translateX(${dx}px)`;
    if (label) {
      const p = Math.min(1, Math.abs(dx) / THRESHOLD);
      label.style.opacity = String(0.25 + p * 0.75);
    }
  }, []);

  const onDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || confirmingRef.current) return;
      startX.current = e.clientX;
      startY.current = e.clientY;
      activeRef.current = false;
      const card = cardRef.current;
      if (card) {
        card.style.transition = "none";
        card.style.willChange = "transform";
      }
    },
    [disabled],
  );

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (startX.current === null) return;
      const dx = e.clientX - startX.current;
      const dy = Math.abs(e.clientY - startY.current);

      if (!activeRef.current) {
        // Ignore vertical scroll gestures; only grab once a horizontal intent is clear.
        if (Math.abs(dx) < INTENT || Math.abs(dx) < dy * 1.2) return;
        activeRef.current = true;
        layerRef.current?.setPointerCapture(e.pointerId);
      }

      const clamped = Math.max(-MAX_DX, Math.min(MAX_DX, dx));
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => render(clamped));
    },
    [render],
  );

  const onUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (startX.current === null) return;
      const dx = e.clientX - startX.current;
      startX.current = null;

      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }

      const card = cardRef.current;
      if (!card) return;

      if (!activeRef.current) return; // was a tap — let inner buttons handle it

      activeRef.current = false;

      if (Math.abs(dx) > THRESHOLD) {
        confirmingRef.current = true;
        const dir = dx > 0 ? 1 : -1;
        card.style.transition = CONFIRM;
        render(THRESHOLD * dir);
        window.setTimeout(() => {
          confirmingRef.current = false;
          onConfirm();
        }, 160);
      } else {
        card.style.transition = SPRING;
        render(0);
      }
    },
    [onConfirm, render],
  );

  return (
    <div className="relative select-none overflow-hidden rounded-2xl">
      {/* Reveal behind — mobile only */}
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-2xl bg-black/[0.12] pr-5 backdrop-blur-xl lg:hidden dark:bg-white/[0.12]"
        style={{ opacity: 0.25 }}
      >
        <span className="text-sm font-semibold text-black dark:text-ivory">Log set</span>
      </div>

      {/* Swipe layer — mobile only */}
      <div
        ref={layerRef}
        className="lg:hidden"
        style={{ cursor: "grab", touchAction: "pan-y" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div
          ref={cardRef}
          className="relative rounded-2xl"
          style={{ transform: "translateX(0px)", willChange: "transform" }}
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