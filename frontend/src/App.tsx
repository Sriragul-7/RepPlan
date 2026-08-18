import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "./components/Shell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { api } from "./lib/api";
import { useAuth } from "./lib/auth";

const Landing = lazy(() => import("./screens/Landing").then((m) => ({ default: m.Landing })));
const Auth = lazy(() => import("./screens/Auth").then((m) => ({ default: m.Auth })));
const AuthCallback = lazy(() => import("./screens/AuthCallback").then((m) => ({ default: m.AuthCallback })));
const Coach = lazy(() => import("./screens/Coach").then((m) => ({ default: m.Coach })));
const DayDetail = lazy(() => import("./screens/DayDetail").then((m) => ({ default: m.DayDetail })));
const Home = lazy(() => import("./screens/Home").then((m) => ({ default: m.Home })));
const Onboarding = lazy(() => import("./screens/Onboarding").then((m) => ({ default: m.Onboarding })));
const ProfileSetup = lazy(() => import("./screens/ProfileSetup").then((m) => ({ default: m.ProfileSetup })));
const Plan = lazy(() => import("./screens/Plan").then((m) => ({ default: m.Plan })));
const Progress = lazy(() => import("./screens/Progress").then((m) => ({ default: m.Progress })));
const ActiveLog = lazy(() => import("./screens/ActiveLog").then((m) => ({ default: m.ActiveLog })));
const Settings = lazy(() => import("./screens/Settings").then((m) => ({ default: m.Settings })));
const WorkoutHistory = lazy(() => import("./screens/WorkoutHistory").then((m) => ({ default: m.WorkoutHistory })));

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-transparent">
      <div className="h-8 w-40 animate-pulse rounded-full bg-black/[0.06] dark:bg-white/[0.06]" />
    </div>
  );
}

/** Authenticated + profile check → app shell, or redirect to onboarding */
function Gate() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { loading: authLoading } = useAuth();
  const profile = useQuery({ queryKey: ["profile"], queryFn: api.getProfile, enabled: !authLoading });

  useEffect(() => {
    void queryClient.prefetchQuery({ queryKey: ["plan"], queryFn: () => api.getPlan(true) });
    void queryClient.prefetchQuery({ queryKey: ["sessions-week"], queryFn: api.sessionsThisWeek });
  }, [queryClient]);

  if (authLoading || profile.isLoading) {
    return <LoadingFallback />;
  }

  if (!profile.data) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }
  return <Shell />;
}

/** Blocks guest users — shows sign-in prompt for features that require an account */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.06] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08]">
          <svg className="h-7 w-7 text-stone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h2 className="font-display text-[22px] font-bold text-black dark:text-ivory">Sign in required</h2>
        <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-stone">
          This feature requires an account. Sign in to unlock workout logging, progress tracking, and the AI coach.
        </p>
        <div className="mt-6 flex flex-col gap-3 w-full max-w-[240px]">
          <button
            onClick={() => signInWithGoogle()}
            className="w-full rounded-full bg-steel px-6 py-3 text-[14px] font-bold text-ink shadow-glow transition-all duration-300 hover:shadow-glow-lg active:scale-[0.97]"
          >
            Sign in with Google
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full rounded-full border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] px-6 py-3 text-[14px] font-medium text-black dark:text-ivory backdrop-blur-xl transition-all duration-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] active:scale-[0.97]"
          >
            Go back
          </button>
        </div>
        <p className="mt-4 font-data text-[10px] text-ash">
          Redirected from {location.pathname}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />

            {/* Protected app routes — profile check happens in Gate */}
            <Route path="/app" element={<Gate />}>
              <Route index element={<Home />} />
              <Route path="plan" element={<Plan />} />
              <Route path="plan/day/:dayId" element={<DayDetail />} />
              <Route path="history" element={<WorkoutHistory />} />
              <Route path="settings" element={<Settings />} />

              {/* Auth-only routes */}
              <Route path="log" element={<RequireAuth><ActiveLog /></RequireAuth>} />
              <Route path="progress" element={<RequireAuth><Progress /></RequireAuth>} />
              <Route path="coach" element={<RequireAuth><Coach /></RequireAuth>} />
            </Route>

            {/* Catch-all → landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
