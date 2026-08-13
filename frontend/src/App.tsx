import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "./components/Shell";
import { api } from "./lib/api";
import { DayDetail } from "./screens/DayDetail";
import { Home } from "./screens/Home";
import { Onboarding } from "./screens/Onboarding";
import { Plan } from "./screens/Plan";
import { Progress } from "./screens/Progress";
import { ActiveLog } from "./screens/ActiveLog";
import { Settings } from "./screens/Settings";

function Gate() {
  const location = useLocation();
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: api.getProfile });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="skeleton h-8 w-40 rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }
  return <Shell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Gate />}>
          <Route index element={<Home />} />
          <Route path="plan" element={<Plan />} />
          <Route path="plan/day/:dayId" element={<DayDetail />} />
          <Route path="log" element={<ActiveLog />} />
          <Route path="progress" element={<Progress />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
