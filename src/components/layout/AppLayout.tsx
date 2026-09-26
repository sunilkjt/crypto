import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowUpFromDot,
  Briefcase,
  CandlestickChart,
  FlaskConical,
  History,
  LayoutDashboard,
  Menu,
  Radar,
  Settings,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { APP_NAME, PHASE_LABEL } from "../../types";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/scanner", label: "Market Scanner", icon: Radar, end: false },
  { to: "/coin/OP", label: "Coin Analysis", icon: CandlestickChart, end: false },
  { to: "/bounce", label: "Best Bounce", icon: ArrowUpFromDot, end: false },
  { to: "/history", label: "Signal History", icon: History, end: false },
  { to: "/backtest", label: "Backtest", icon: FlaskConical, end: false },
  { to: "/paper", label: "Paper Trading", icon: Briefcase, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

const BOTTOM_NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/scanner", label: "Scan", icon: Radar, end: false },
  { to: "/bounce", label: "Bounce", icon: ArrowUpFromDot, end: false },
  { to: "/paper", label: "Paper", icon: Briefcase, end: false },
  { to: "/settings", label: "Setup", icon: Settings, end: false },
];

function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-cyan-500/20">
        <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
      </span>
      {!collapsed && (
        <span className="leading-tight">
          <span className="block text-[15px] font-extrabold tracking-tight text-white">
            {APP_NAME}
          </span>
          <span className="block text-[10px] font-semibold tracking-[0.18em] text-cyan-300/80 uppercase">
            {PHASE_LABEL}
          </span>
        </span>
      )}
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition",
                isActive
                  ? "border border-slate-700/60 bg-slate-800/90 text-white shadow"
                  : "border border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900 hover:text-slate-100"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isActive ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                {item.label}
                {item.label === "Best Bounce" && (
                  <span className="ml-auto rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                    NEW
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const active = NAV.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to.split("/").slice(0, 2).join("/"))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-[264px] shrink-0 flex-col border-r border-slate-800/80 bg-slate-900/40 backdrop-blur lg:flex">
        <div className="px-4 pt-5 pb-4">
          <Logo />
        </div>
        <div className="mx-4 mb-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2.5">
          <p className="text-[11px] font-bold tracking-widest text-amber-300 uppercase">
            Demo mode
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
            No real-money trading. Live data connects in Phase 2.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavList />
        </div>
        <div className="border-t border-slate-800/80 p-4 text-[11px] leading-relaxed text-slate-500">
          <p className="font-semibold text-slate-400">Foundation build</p>
          <p>React · TS · Vite · Tailwind · Recharts</p>
          <p className="mt-1">Paper only. Educational use.</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute top-0 left-0 flex h-full w-[280px] flex-col border-r border-slate-800 bg-slate-900 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList onNavigate={() => setDrawerOpen(false)} />
            </div>
            <p className="pt-3 text-[11px] text-slate-500">
              Demo mode · No real-money trading
            </p>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
          <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-3 sm:px-6">
            <button
              className="rounded-lg border border-slate-800 p-2 text-slate-300 hover:bg-slate-900 lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {active?.label ?? "CryptoIn"} · Waiting for market data
              </span>
              <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-amber-300">
                DEMO
              </span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-6 pb-24 sm:px-6 lg:pb-10">
          <Outlet />
          <footer className="mt-10 border-t border-slate-800/70 pt-4 pb-2 text-[11px] text-slate-600">
            CryptoIn AI Signal · Phase 1 foundation · Educational demo. Not financial
            advice. No real-money trading.
          </footer>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 backdrop-blur lg:hidden">
          <div className="grid grid-cols-5">
            {BOTTOM_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to + item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold",
                      isActive ? "text-cyan-300" : "text-slate-500"
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
