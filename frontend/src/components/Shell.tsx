import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function Shell() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <main className="flex-1 px-5 pb-28 pt-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
