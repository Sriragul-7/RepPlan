import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { Logo } from "./Logo";
import { UserIcon, LogOutIcon } from "./icons";
import { useAuth } from "../lib/auth";

export function Shell() {
  const { user, signOut } = useAuth();
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
          <p className="font-display text-sm font-bold uppercase tracking-[0.15em] text-ivory">
            RepPlan
          </p>
          <div className="flex items-center gap-2">
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 transition-all duration-300 hover:bg-white/[0.08] active:scale-[0.97]"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-steel/80">
                    <UserIcon className="h-3.5 w-3.5 text-ink" />
                  </div>
                  <span className="max-w-[100px] truncate text-[12px] font-medium text-ivory">
                    {user.email?.split("@")[0]}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-coal/95 shadow-xl backdrop-blur-xl">
                    <div className="px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone/60">
                        Signed in as
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-ivory">
                        {user.email}
                      </p>
                    </div>
                    <div className="h-px bg-white/[0.06]" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-medium text-red-400 transition-colors hover:bg-white/[0.06]"
                    >
                      <LogOutIcon className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
            <Logo className="h-6 w-6" />
          </div>
        </header>
        <main className="animate-fade-in flex-1 px-5 pb-32 lg:px-10 lg:pb-16 lg:pt-12">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
