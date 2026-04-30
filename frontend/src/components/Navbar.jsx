import { useState } from "react";
import { LogOut, Menu, Moon, Sun, UserCircle2, X } from "lucide-react";

const navItems = [
  { id: "operations", label: "Operations" },
  { id: "analysis", label: "Shipment Analysis" },
  { id: "monitoring", label: "Risk Monitoring" },
  { id: "audit", label: "Audit Queue" },
];

export default function Navbar({ activeView, setActiveView, officerProfile, onLogout, dark, onToggleDark }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleNavigate(view) {
    setActiveView(view);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold tracking-[0.2em] text-white shadow-sm dark:bg-slate-700">
            GS
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">GhostShip</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Port Intelligence System</h1>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 lg:flex dark:border-slate-700 dark:bg-slate-800">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition hover:scale-[1.01] ${
                activeView === item.id
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {onToggleDark && (
            <button
              type="button"
              onClick={onToggleDark}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:scale-[1.01] hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:scale-[1.01] hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 lg:hidden"
            title="Open navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("profile")}
            className={`hidden items-center gap-3 rounded-2xl border bg-white px-3 py-2 shadow-sm transition hover:scale-[1.01] lg:flex dark:bg-slate-800 dark:border-slate-700 ${
              activeView === "profile" ? "border-slate-300 ring-2 ring-slate-200 dark:ring-slate-600" : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {officerProfile.photo_url ? (
                <img src={officerProfile.photo_url} alt={officerProfile.full_name} className="h-full w-full object-cover" />
              ) : (
                <UserCircle2 className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{officerProfile.full_name}</p>
              <p className="truncate text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {officerProfile.role_title} | {officerProfile.badge_id}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("profile")}
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:scale-[1.01] hover:text-slate-900 lg:hidden"
            title={`${officerProfile.full_name} | ${officerProfile.role_title}`}
          >
            {officerProfile.photo_url ? (
              <img src={officerProfile.photo_url} alt={officerProfile.full_name} className="h-full w-full object-cover" />
            ) : (
              <UserCircle2 className="h-5 w-5" />
            )}
          </button>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:scale-[1.01] hover:text-slate-900 lg:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : null}
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeView === item.id
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleNavigate("profile")}
              className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                activeView === "profile"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              Officer Profile
            </button>
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
