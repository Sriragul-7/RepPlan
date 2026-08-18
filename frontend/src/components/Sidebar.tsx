import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { BrainIcon, CalendarIcon, ChartBarIcon, GearIcon, HomeIcon, PencilIcon, UserIcon, LogOutIcon } from "./icons";
import { Logo } from "./Logo";

const guestTabs = [
  { to: "/app", label: "Home", icon: HomeIcon },
  { to: "/app/plan", label: "Workouts", icon: CalendarIcon },
];

const authTabs = [
  { to: "/app/log", label: "Log", icon: PencilIcon },
  { to: "/app/progress", label: "Progress", icon: ChartBarIcon },
  { to: "/app/coach", label: "AI Coach", icon: BrainIcon },
];

/** Premium desktop side rail — replaces the bottom tab bar on lg+ screens. */
export function Sidebar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tabs = user ? [...guestTabs, ...authTabs] : guestTabs;

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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-black/[0.08] bg-white/80 backdrop-blur-3xl dark:border-white/[0.06] dark:bg-coal/80 lg:flex">
      <div className="flex h-full flex-col px-6 py-9">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <p className="font-display text-sm font-bold uppercase tracking-[0.15em] text-black dark:text-ivory">
              RepPlan
            </p>
          </div>
          <h1 className="font-display mt-1 text-2xl font-bold leading-tight text-black dark:text-ivory">
            Build strong.
          </h1>
          <div className="mt-4 h-px w-full bg-gradient-to-r from-black/[0.08] via-black/[0.04] to-transparent dark:from-white/[0.08] dark:via-white/[0.04]" />
        </div>

        <nav className="mt-12 flex flex-col gap-1.5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-steel/90 text-ink shadow-glow font-semibold"
                    : "text-stone hover:bg-black/[0.06] hover:text-black dark:hover:bg-white/[0.06] dark:hover:text-ivory"
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
                  : "text-stone hover:bg-black/[0.06] hover:text-black dark:hover:bg-white/[0.06] dark:hover:text-ivory"
              }`
            }
          >
            <GearIcon className="h-5 w-5" filled={false} />
            Settings
          </NavLink>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-stone transition-all duration-300 hover:bg-black/[0.06] hover:text-black dark:hover:bg-white/[0.06] dark:hover:text-ivory"
          >
            {theme === "dark" ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <div className="mt-4 h-px w-full bg-gradient-to-r from-black/[0.06] to-transparent dark:from-white/[0.06]" />

          {/* User menu */}
          {user && (
            <div className="relative mt-4" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-stone transition-all duration-300 hover:bg-black/[0.06] hover:text-black dark:hover:bg-white/[0.06] dark:hover:text-ivory"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-steel/80">
                  <UserIcon className="h-4 w-4 text-ink" />
                </div>
                <span className="flex-1 truncate text-left text-[13px]">
                  {user.email}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-coal/95">
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

          <p className="px-1 pt-4 font-data text-[9px] uppercase tracking-[0.18em] text-ash/40">
            Built for discipline
          </p>
        </div>
      </div>
    </aside>
  );
}
