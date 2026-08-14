import { useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./icons";

type ExerciseImageProps = {
  thumbnailUrl?: string | null;
  gifUrl?: string | null;
  alt?: string;
  className?: string;
};

/**
 * Premium exercise thumbnail with glass card preview.
 * Tapping it opens a zoomed preview card that plays the animation (GIF) if available.
 */
export function ExerciseImage({ thumbnailUrl, gifUrl, alt, className }: ExerciseImageProps) {
  const [open, setOpen] = useState(false);
  const canAnimate = Boolean(gifUrl);
  const name = alt ?? "Exercise";
  const previewSrc = gifUrl ?? thumbnailUrl;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${name} — preview`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }
        }}
        className={`relative cursor-pointer overflow-hidden border border-white/[0.06] bg-white/[0.04] ${className ?? ""}`}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="h-full w-full object-contain"
            loading="lazy"
            draggable={false}
          />
        ) : null}
        {canAnimate ? (
          <span className="absolute right-1 top-1 rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ivory/70">
            gif
          </span>
        ) : null}
      </div>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-6"
              role="dialog"
              aria-modal="true"
              aria-label={`${name} preview`}
              onClick={() => setOpen(false)}
            >
              <div className="animate-fade-in absolute inset-0 bg-ink/80 backdrop-blur-md" />
              <div
                className="animate-card-pop relative w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="glass-card overflow-hidden rounded-[28px] shadow-2xl shadow-black/60">
                  <div className="relative h-72 w-full bg-white/[0.04]">
                    {previewSrc ? (
                      <img src={previewSrc} alt={name} className="h-full w-full object-contain" />
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="font-display truncate pr-2 text-lg font-semibold text-ivory">{name}</p>
                    <button
                      onClick={() => setOpen(false)}
                      aria-label="Close preview"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] text-ivory backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.08] active:scale-95"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
