import { NavLink } from "react-router-dom";
import { BrainIcon, CalendarIcon, ChartBarIcon, HomeIcon, PencilIcon } from "./icons";

const tabs = [
  { to: "/app", label: "Home", icon: HomeIcon },
  { to: "/app/plan", label: "Workouts", icon: CalendarIcon },
  { to: "/app/log", label: "Log", icon: PencilIcon },
  { to: "/app/progress", label: "Progress", icon: ChartBarIcon },
  { to: "/app/coach", label: "AI Coach", icon: BrainIcon },
];

export { tabs };

/** Premium iOS-style floating frosted tab bar — mobile only, hidden on lg+. */
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 pb-safe lg:hidden">
      <div className="mx-3 mb-2 flex items-center justify-around rounded-[28px] border border-white/[0.06] bg-coal/80 px-2 py-1.5 shadow-lg backdrop-blur-xl">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `group relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-all duration-300 ${
                isActive ? "text-ivory" : "text-ash hover:text-stone"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span className="absolute -top-0.5 bottom-0 left-1/2 -z-10 w-12 -translate-x-1/2 rounded-2xl bg-white/[0.08] shadow-glow blur-[2px]" />
                ) : null}
                <Icon
                  className={`h-[22px] w-[22px] transition-transform duration-300 group-active:scale-90 ${
                    isActive ? "scale-100" : "scale-95"
                  }`}
                  filled={isActive}
                />
                <span
                  className={`text-[10px] font-semibold tracking-wide transition-colors ${
                    isActive ? "text-ivory" : "text-ash"
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
