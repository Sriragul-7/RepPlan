import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "./components/Shell";
import { api } from "./lib/api";
import { Onboarding } from "./screens/Onboarding";

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
          <Route index element={<div className="p-6">Home</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
