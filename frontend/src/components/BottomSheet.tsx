import type { ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** Premium slide-up sheet with glass effect — used for the set logger. */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-sheet-up absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[30px] border-t border-white/[0.06] bg-coal/95 p-5 pb-10 shadow-card backdrop-blur-2xl lg:inset-0 lg:my-auto lg:max-h-[80vh] lg:overflow-y-auto lg:rounded-[28px] lg:border lg:pb-5 lg:animate-sheet-pop">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ivory/20 lg:hidden" />
        {title ? <h2 className="font-display mb-4 text-xl font-semibold text-ivory">{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
