import type { ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** Slide-up sheet with dimmed backdrop — used for the set logger. */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-sheet-up absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[28px] border-t border-white/10 bg-[#17181C] p-5 pb-10 shadow-card">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        {title ? <h2 className="font-display mb-4 text-xl font-semibold text-bone">{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
