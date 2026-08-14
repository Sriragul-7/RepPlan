import type { ReactNode } from "react";

type DisciplineRingProps = {
  /** Progress 0..1 */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Default white for premium look */
  color?: string;
  trackColor?: string;
  children?: ReactNode;
  className?: string;
  animate?: boolean;
};

/**
 * The Discipline Ring — the app's signature component.
 * Premium black-and-white glassmorphism design with subtle glow.
 */
export function DisciplineRing({
  value,
  size = 120,
  strokeWidth = 8,
  color = "#FFFFFF",
  trackColor = "rgba(255,255,255,0.06)",
  children,
  className,
  animate = true,
}: DisciplineRingProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div className={`relative inline-flex items-center justify-center ${className ?? ""}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 8px ${color}88)`,
            ...(animate
              ? { transition: "stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1)" }
              : undefined),
          }}
        />
      </svg>
      {children ? <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div> : null}
    </div>
  );
}
