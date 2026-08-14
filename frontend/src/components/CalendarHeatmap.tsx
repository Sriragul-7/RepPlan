import { useMemo } from "react";

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

const HEAT_STYLES = [
  "bg-white/[0.03]",           // Level 0 - no workout
  "bg-white/[0.08]",           // Level 1 - light
  "bg-white/[0.15]",           // Level 2 - moderate
  "bg-white/[0.25]",           // Level 3 - active
  "bg-ivory",                  // Level 4 - intense
];

const HEAT_TEXT_STYLES = [
  "text-ash",                   // Level 0
  "text-stone",                 // Level 1
  "text-silver",                // Level 2
  "text-chrome",                // Level 3
  "text-ink",                   // Level 4
];

export function CalendarHeatmap({
  year,
  month,
  workoutData,
  selectedDate,
  onDateSelect,
}: CalendarHeatmapProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

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
                  ? "bg-ivory text-ink shadow-glow scale-105"
                  : `${HEAT_STYLES[heatLevel]} ${HEAT_TEXT_STYLES[heatLevel]} hover:bg-white/[0.12]`
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-white/20" : ""}`}
            >
              {day}
              {sets > 0 && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 -translate-x-1/2 rounded-full bg-white/30" 
                      style={{ width: `${Math.min(100, (sets / 35) * 100)}%` }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { formatDateKey, getHeatLevel };
