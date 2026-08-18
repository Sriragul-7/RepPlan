import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { allTabs } from "./BottomNav";
import { useAuth } from "../lib/auth";
import { GearIcon, UserIcon, LogOutIcon } from "./icons";
import { Logo } from "./Logo";

/** Premium desktop side rail — replaces the bottom tab bar on lg+ screens. */
export function Sidebar() {
  const { session, user, signOut } = useAuth();
  const navigate = useNavigate();
  const tabs = allTabs.filter((t) => !t.requiresAuth || session);
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.06] bg-coal/80 backdrop-blur-3xl lg:flex">
      <div className="flex h-full flex-col px-6 py-9">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <p className="font-display text-sm font-bold uppercase tracking-[0.15em] text-ivory">
              RepPlan
            </p>
          </div>
          <h1 className="font-display mt-1 text-2xl font-bold leading-tight text-ivory">
            Build strong.
          </h1>
          <div className="mt-4 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />
        </div>

        <nav className="mt-12 flex flex-col gap-1.5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-steel/90 text-ink shadow-glow font-semibold"
                    : "text-stone hover:bg-white/[0.06] hover:text-ivory"
                }`
              }
            >
              <Icon className="h-5 w-5" filled={false} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-steel/90 text-ink shadow-glow font-semibold"
                  : "text-stone hover:bg-white/[0.06] hover:text-ivory"
              }`
            }
          >
            <GearIcon className="h-5 w-5" filled={false} />
            Settings
          </NavLink>
          <div className="mt-4 h-px w-full bg-gradient-to-r from-white/[0.06] to-transparent" />

          {/* User menu */}
          {user && (
            <div className="relative mt-4" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-stone transition-all duration-300 hover:bg-white/[0.06] hover:text-ivory"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-steel/80">
                  <UserIcon className="h-4 w-4 text-ink" />
                </div>
                <span className="flex-1 truncate text-left text-[13px]">
                  {user.email}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-coal/95 shadow-xl backdrop-blur-xl">
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

          <p className="px-1 pt-4 font-data text-[9px] uppercase tracking-[0.18em] text-ash/40">
            Built for discipline
          </p>
        </div>
      </div>
    </aside>
  );
}
