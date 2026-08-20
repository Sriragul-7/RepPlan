import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { Logo } from "./Logo";
import { InstallPrompt } from "./InstallPrompt";
import { UserIcon, LogOutIcon } from "./icons";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";

export function Shell() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen w-full lg:pl-64">
      <div className="app-bg" aria-hidden />
      <Sidebar />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col lg:max-w-3xl">
        <header className="flex items-center justify-between px-5 pt-safe pb-2 lg:hidden">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <p className="font-display text-sm font-bold uppercase tracking-[0.15em] text-black dark:text-ivory">
              RepPlan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] bg-black/[0.04] text-stone transition-all duration-300 hover:bg-black/[0.08] hover:text-ink active:scale-95 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-stone dark:hover:bg-white/[0.08] dark:hover:text-ivory"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.04] px-3 py-1.5 transition-all duration-300 hover:bg-black/[0.08] active:scale-[0.97] dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-steel/80">
                    <UserIcon className="h-3.5 w-3.5 text-ink" />
                  </div>
                  <span className="max-w-[100px] truncate text-[12px] font-medium text-black dark:text-ivory">
                    {user.email?.split("@")[0]}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-coal/95">
                    <div className="px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone/60">
                        Signed in as
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-black dark:text-ivory">
                        {user.email}
                      </p>
                    </div>
                    <div className="h-px bg-black/[0.06] dark:bg-white/[0.06]" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-medium text-red-400 transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
                    >
                      <LogOutIcon className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <main className="animate-fade-in flex-1 px-5 pb-32 lg:px-10 lg:pb-16 lg:pt-12">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
