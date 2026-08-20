import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "../lib/constants";
import { isIOS, isStandalone, useInstallPrompt } from "../lib/useInstallPrompt";
import { BottomSheet } from "./BottomSheet";

/** iOS "Add to Home Screen" instructions sheet — reused by the banner and the Landing download button. */
export function InstallGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Install RepPlan">
      <ol className="space-y-3">
        <li className="ios-row rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-steel/20 text-[13px] font-bold text-ink">1</span>
          <p className="text-[13px] text-black dark:text-ivory">
            Tap the <span className="font-semibold">Share</span> button in Safari's toolbar.
          </p>
        </li>
        <li className="ios-row rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-steel/20 text-[13px] font-bold text-ink">2</span>
          <p className="text-[13px] text-black dark:text-ivory">
            Tap <span className="font-semibold">Add to Home Screen</span>.
          </p>
        </li>
        <li className="ios-row rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-steel/20 text-[13px] font-bold text-ink">3</span>
          <p className="text-[13px] text-black dark:text-ivory">
            Tap <span className="font-semibold">Add</span> in the top-right corner.
          </p>
        </li>
      </ol>
      <button
        onClick={onClose}
        className="mt-6 w-full rounded-full bg-steel px-6 py-3.5 text-sm font-semibold text-ink shadow-glow transition-all duration-300 hover:shadow-glow-lg active:scale-[0.97]"
      >
        Got it
      </button>
    </BottomSheet>
  );
}

/** Prompts users to install the PWA — native Android prompt or iOS "Add to Home Screen" guide. */
export function InstallPrompt() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [show, setShow] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(STORAGE_KEYS.INSTALL_DISMISSED)) return;

    if (canInstall) {
      setShow(true);
      return;
    }
    if (isIOS()) {
      const timer = window.setTimeout(() => setShow(true), 4000);
      return () => window.clearTimeout(timer);
    }
  }, [canInstall]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEYS.INSTALL_DISMISSED, "1");
    setShow(false);
  };

  const handleInstall = async () => {
    if (canInstall) {
      const outcome = await promptInstall();
      if (outcome === "installed") dismiss();
      else setShow(false);
      return;
    }
    if (isIOS()) setSheetOpen(true);
  };

  if (!show || isStandalone()) return null;

  return (
    <>
      <div className="fixed inset-x-4 bottom-24 z-40 flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white/90 p-3 pr-2 shadow-xl backdrop-blur-xl animate-sheet-up dark:border-white/[0.08] dark:bg-coal/90 lg:bottom-8 lg:left-auto lg:right-6 lg:w-[360px]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-steel/20">
          <svg className="h-5 w-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-black dark:text-ivory">Install RepPlan</p>
          <p className="truncate text-[11px] text-stone">
            {isIOS() ? "Add to Home Screen for the full app experience." : "Get the full app experience on your device."}
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-full bg-steel px-4 py-2 text-[12px] font-bold text-ink shadow-glow transition-all duration-300 hover:shadow-glow-lg active:scale-[0.97]"
        >
          {isIOS() ? "How to" : "Install"}
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-stone transition-colors hover:bg-black/[0.06] hover:text-black dark:hover:bg-white/[0.08] dark:hover:text-ivory"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <InstallGuideSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}