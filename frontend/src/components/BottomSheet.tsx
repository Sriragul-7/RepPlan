import { useEffect, type ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** Premium slide-up sheet with glass effect — used for the set logger. */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-sheet-up absolute inset-x-0 bottom-0 mx-auto w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-[30px] border-t border-white/[0.06] bg-coal/95 p-5 pb-10 shadow-card backdrop-blur-2xl overscroll-contain lg:inset-0 lg:my-auto lg:max-h-[80vh] lg:rounded-[28px] lg:border lg:pb-5 lg:animate-sheet-pop">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ivory/20 lg:hidden" />
        {title ? <h2 className="font-display mb-4 text-xl font-semibold text-ivory">{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
