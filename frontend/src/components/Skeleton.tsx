import type { CSSProperties } from "react";

type SkeletonVariant = "card" | "row" | "text" | "circle" | "ring" | "line";

type SkeletonProps = {
  variant?: SkeletonVariant;
  className?: string;
  style?: CSSProperties;
};

const shape: Record<SkeletonVariant, string> = {
  card: "h-28 rounded-card",
  row: "h-14 rounded-xl",
  text: "h-4 rounded-full",
  circle: "rounded-full",
  ring: "rounded-full aspect-square",
  line: "h-px w-full",
};

/** Frost shimmer skeleton — matching the content shape. */
export function Skeleton({ variant = "text", className, style }: SkeletonProps) {
  return (
    <div
      className={`skeleton relative overflow-hidden ${shape[variant]} ${className ?? ""}`}
      style={style}
      aria-hidden
    />
  );
}

/** A skeleton card that mimics a GlassCard's anatomy. */
export function CardSkeleton() {
  return (
    <div className="glass-card skeleton rounded-card p-4">
      <div className="mb-3 flex items-center gap-3">
        <Skeleton variant="circle" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-2/3" />
          <Skeleton className="w-1/3" />
        </div>
      </div>
      <Skeleton className="mb-2 w-full" />
      <Skeleton className="w-4/5" />
    </div>
  );
}

/** List of row skeletons for long async surfaces. */
export function RowListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card flex items-center gap-3 p-4">
          <Skeleton variant="circle" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-1/2" />
            <Skeleton className="w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}