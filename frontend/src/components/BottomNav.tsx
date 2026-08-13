import { NavLink } from "react-router-dom";
import { CalendarIcon, ChartBarIcon, HomeIcon, PencilIcon } from "./icons";

const tabs = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/plan", label: "Plan", icon: CalendarIcon },
  { to: "/log", label: "Log", icon: PencilIcon },
  { to: "/progress", label: "Progress", icon: ChartBarIcon },
];

/** Floating glass bottom tab bar. */
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2">
      <div className="mx-3 mb-3 flex items-center justify-around rounded-[24px] border border-white/10 bg-[#17181C]/70 px-2 py-2 shadow-card backdrop-blur-xl">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-2xl px-4 py-2 transition ${
                isActive ? "text-ember" : "text-ash hover:text-bone"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
