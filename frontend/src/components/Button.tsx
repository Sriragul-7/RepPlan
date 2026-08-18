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
    ghost: "border border-black/[0.08] bg-black/[0.04] text-black backdrop-blur-xl hover:bg-black/[0.08] active:bg-black/[0.12] dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-ivory dark:hover:bg-white/[0.08] dark:active:bg-white/[0.12]",
    chrome: "bg-chrome text-ink shadow-glow hover:shadow-glow-lg font-semibold",
    soft: "bg-black/[0.06] text-steel backdrop-blur-xl hover:bg-black/[0.10] active:bg-black/[0.14] dark:bg-white/[0.06] dark:hover:bg-white/[0.10] dark:active:bg-white/[0.14]",
  }[variant];

  return (
    <button type="button" className={`${base} ${styles} ${full ? "w-full" : ""} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}
