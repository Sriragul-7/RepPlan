import { NavLink } from "react-router-dom";
import { tabs } from "./BottomNav";
import { GearIcon } from "./icons";
import { Logo } from "./Logo";

/** Premium desktop side rail — replaces the bottom tab bar on lg+ screens. */
export function Sidebar() {
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
          <p className="px-1 pt-4 font-data text-[9px] uppercase tracking-[0.18em] text-ash/40">
            Built for discipline
          </p>
        </div>
      </div>
    </aside>
  );
}
