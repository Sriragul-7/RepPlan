import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Logo } from "../components/Logo";

export function Auth() {
  const navigate = useNavigate();
  const { signInWithGoogle, user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-ink">
        <div className="h-6 w-32 animate-pulse rounded-full bg-black/[0.06] dark:bg-white/[0.06]" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white dark:bg-ink px-5">
      <div className="app-bg" aria-hidden />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.06] bg-white/[0.8] dark:bg-white/[0.04] text-stone backdrop-blur-xl transition-all duration-300 hover:bg-white dark:hover:bg-white/[0.08] hover:text-black dark:hover:text-ivory active:scale-95"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Floating orbs */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-black/[0.02] dark:bg-white/[0.02] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-black/[0.015] dark:bg-white/[0.015] blur-[100px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="glass-card glass-shine p-8 md:p-10">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <Logo className="mb-4 h-12 w-12" />
            <h1 className="font-display text-[24px] font-bold text-black dark:text-white">RepPlan</h1>
            <p className="mt-1 text-[14px] text-stone/50">Lock in.</p>
          </div>

          {/* Tagline */}
          <div className="mb-8 text-center">
            <p className="font-display text-[18px] font-bold text-black dark:text-white/90">
              Get started with RepPlan.
            </p>
            <p className="mt-2 text-[14px] text-stone/50">
              Sign in with Google to continue.
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white/[0.05] px-6 py-4 text-[15px] font-medium text-black dark:text-white backdrop-blur-xl transition-all duration-300 hover:bg-black/[0.1] dark:hover:bg-white/[0.1] active:scale-[0.97]"
          >
            {/* Google icon */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Supporting text */}
          <p className="mt-6 text-center text-[12px] leading-[1.6] text-stone/40">
            New user? Your account will be created automatically.
            <br />
            Returning? Your progress is saved.
          </p>
        </div>

        {/* Back link */}
        <button
          onClick={() => navigate("/")}
          className="mt-6 block w-full text-center text-[13px] text-stone/40 transition-colors hover:text-black dark:text-black/60 dark:text-white/60"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}
