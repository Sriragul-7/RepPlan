import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<div className="p-6">RepPlan</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
