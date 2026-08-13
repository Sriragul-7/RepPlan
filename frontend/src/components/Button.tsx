import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "glacier";
  full?: boolean;
};

export function Button({ variant = "primary", full, className, children, ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold tracking-wide transition active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";
  const styles = {
    primary: "bg-ember text-bone shadow-glow",
    ghost: "border border-white/12 bg-white/6 text-bone",
    glacier: "bg-glacier text-void shadow-glow-glacier",
  }[variant];

  return (
    <button type="button" className={`${base} ${styles} ${full ? "w-full" : ""} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}
