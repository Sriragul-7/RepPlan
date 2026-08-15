import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { Logo } from "./Logo";

export function Shell() {
  return (
    <div className="min-h-screen w-full lg:pl-64">
      <div className="app-bg" aria-hidden />
      <Sidebar />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col lg:max-w-3xl">
        <header className="flex items-center justify-end gap-2 px-5 pt-safe pb-2 lg:hidden">
          <p className="font-display text-sm font-bold uppercase tracking-[0.15em] text-ivory">
            RepPlan
          </p>
          <Logo className="h-6 w-6" />
        </header>
        <main className="animate-fade-in flex-1 px-5 pb-32 lg:px-10 lg:pb-16 lg:pt-12">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
