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
const Plan = lazy(() => import("./screens/Plan").then((m) => ({ default: m.Plan })));
const Progress = lazy(() => import("./screens/Progress").then((m) => ({ default: m.Progress })));
const ActiveLog = lazy(() => import("./screens/ActiveLog").then((m) => ({ default: m.ActiveLog })));
const Settings = lazy(() => import("./screens/Settings").then((m) => ({ default: m.Settings })));
const WorkoutHistory = lazy(() => import("./screens/WorkoutHistory").then((m) => ({ default: m.WorkoutHistory })));

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-40 animate-pulse rounded-full bg-white/[0.06]" />
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

            {/* Protected app routes — profile check happens in Gate */}
            <Route path="/app" element={<Gate />}>
              <Route index element={<Home />} />
              <Route path="plan" element={<Plan />} />
              <Route path="plan/day/:dayId" element={<DayDetail />} />
              <Route path="log" element={<ActiveLog />} />
              <Route path="history" element={<WorkoutHistory />} />
              <Route path="progress" element={<Progress />} />
              <Route path="coach" element={<Coach />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch-all → landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
