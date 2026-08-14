import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "chrome" | "soft";
  full?: boolean;
};

export function Button({ variant = "primary", full, className, children, ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";
  const styles = {
    primary: "bg-steel text-ink shadow-glow hover:shadow-glow-lg font-semibold",
    ghost: "border border-white/[0.06] bg-white/[0.04] text-ivory backdrop-blur-xl hover:bg-white/[0.08] active:bg-white/[0.12]",
    chrome: "bg-chrome text-ink shadow-glow hover:shadow-glow-lg font-semibold",
    soft: "bg-white/[0.06] text-steel backdrop-blur-xl hover:bg-white/[0.10] active:bg-white/[0.14]",
  }[variant];

  return (
    <button type="button" className={`${base} ${styles} ${full ? "w-full" : ""} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}
