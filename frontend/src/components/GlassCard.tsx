import type { HTMLAttributes } from "react";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
  padded?: boolean;
};

/** Premium iOS frosted-glass card — black-and-white glassmorphism. */
export function GlassCard({ active, padded = true, className, children, ...rest }: GlassCardProps) {
  return (
    <div
      className={`glass-card ${active ? "glass-active" : ""} ${padded ? "p-4" : ""} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </div>
  );
}
