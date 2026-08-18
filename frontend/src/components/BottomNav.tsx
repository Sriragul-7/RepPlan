import { NavLink } from "react-router-dom";
import { BrainIcon, CalendarIcon, ChartBarIcon, HomeIcon, PencilIcon } from "./icons";
import { useAuth } from "../lib/auth";

const guestTabs = [
  { to: "/app", label: "Home", icon: HomeIcon },
  { to: "/app/plan", label: "Workouts", icon: CalendarIcon },
];

const authTabs = [
  { to: "/app/log", label: "Log", icon: PencilIcon },
  { to: "/app/progress", label: "Progress", icon: ChartBarIcon },
  { to: "/app/coach", label: "AI Coach", icon: BrainIcon },
];

const allTabs = [...guestTabs, ...authTabs];
export { allTabs };

/** Premium iOS-style floating frosted tab bar — mobile only, hidden on lg+. */
export function BottomNav() {
  const { user } = useAuth();
  const tabs = user ? [...guestTabs, ...authTabs] : guestTabs;

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 pb-safe lg:hidden">
      <div className="mx-3 mb-2 flex items-center justify-around rounded-[28px] border border-black/[0.08] bg-white/80 px-2 py-1.5 shadow-lg backdrop-blur-xl dark:border-white/[0.06] dark:bg-coal/80">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `group relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-all duration-300 ${
                isActive ? "text-black dark:text-ivory" : "text-ash hover:text-stone"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span className="absolute -top-0.5 bottom-0 left-1/2 -z-10 w-12 -translate-x-1/2 rounded-2xl bg-black/[0.08] shadow-glow blur-[2px] dark:bg-white/[0.08]" />
                ) : null}
                <Icon
                  className={`h-[22px] w-[22px] transition-transform duration-300 group-active:scale-90 ${
                    isActive ? "scale-100" : "scale-95"
                  }`}
                  filled={isActive}
                />
                <span
                  className={`text-[10px] font-semibold tracking-wide transition-colors ${
                    isActive ? "text-black dark:text-ivory" : "text-ash"
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
