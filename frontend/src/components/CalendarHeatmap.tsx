import { useMemo } from "react";
import { useTheme } from "../lib/theme";

type CalendarHeatmapProps = {
  year: number;
  month: number;
  workoutData: Map<string, { sets: number; volume: number }>;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function getHeatLevel(sets: number): number {
  if (sets === 0) return 0;
  if (sets <= 10) return 1;
  if (sets <= 20) return 2;
  if (sets <= 30) return 3;
  return 4;
}

const HEAT_COLORS_LIGHT = [
  "rgba(0,0,0,0.04)",   // Level 0 - no workout
  "#9be9a8",            // Level 1 - light green
  "#40c463",            // Level 2 - medium green
  "#30a14e",            // Level 3 - active green
  "#216e39",            // Level 4 - intense green
];

const HEAT_COLORS_DARK = [
  "rgba(255,255,255,0.04)",   // Level 0 - no workout
  "#0e4429",                   // Level 1 - light green
  "#006d32",                   // Level 2 - medium green
  "#26a641",                   // Level 3 - active green
  "#39d353",                   // Level 4 - intense green
];

export function CalendarHeatmap({
  year,
  month,
  workoutData,
  selectedDate,
  onDateSelect,
}: CalendarHeatmapProps) {
  const { theme } = useTheme();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const heatColors = theme === "dark" ? HEAT_COLORS_DARK : HEAT_COLORS_LIGHT;

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return days;
  }, [daysInMonth, firstDay]);

  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="select-none">
      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-ash"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-10" />;
          }

          const dateKey = formatDateKey(year, month, day);
          const workout = workoutData.get(dateKey);
          const sets = workout?.sets ?? 0;
          const heatLevel = getHeatLevel(sets);
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey;

          return (
            <button
              key={dateKey}
              onClick={() => onDateSelect(dateKey)}
              className={`relative flex h-10 items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? "bg-black text-white shadow-glow scale-105 dark:bg-ivory dark:text-ink"
                  : "hover:opacity-80"
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-black/20 dark:ring-white/20" : ""}`}
              style={
                !isSelected
                  ? {
                      backgroundColor: heatColors[heatLevel],
                      color: heatLevel >= 3 ? (theme === "dark" ? "#000000" : "#ffffff") : heatLevel >= 1 ? (theme === "dark" ? "#e0e0e0" : "#ffffff") : (theme === "dark" ? "#6B6B76" : "#6B6B76"),
                    }
                  : undefined
              }
            >
              {day}
              {sets > 0 && !isSelected && (
                <span
                  className="absolute bottom-0.5 left-1/2 h-1 -translate-x-1/2 rounded-full"
                  style={{
                    backgroundColor: "rgba(57, 211, 83, 0.5)",
                    width: `${Math.min(100, (sets / 35) * 100)}%`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { formatDateKey, getHeatLevel };
