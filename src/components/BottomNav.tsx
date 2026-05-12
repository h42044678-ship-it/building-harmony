import { Link, useLocation } from "@tanstack/react-router";
import { Home, Grid2x2, Wallet, MoreHorizontal, QrCode } from "lucide-react";

const tabs = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/services", label: "الخدمات", icon: Grid2x2 },
  { to: "/operations", label: "العمليات", icon: Wallet },
  { to: "/more", label: "المزيد", icon: MoreHorizontal },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 max-w-md mx-auto">
      <div className="relative bg-white/95 backdrop-blur border-t border-border shadow-elevated">
        <div className="grid grid-cols-5 items-end h-[72px] px-2">
          {tabs.slice(0, 2).map(t => <NavItem key={t.to} t={t} active={pathname === t.to} />)}
          <div />
          {tabs.slice(2).map(t => <NavItem key={t.to} t={t} active={pathname === t.to} />)}
        </div>
        <button
          aria-label="دفع سريع"
          className="absolute -top-7 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-crimson text-crimson-foreground grid place-items-center shadow-crimson border-4 border-white active:scale-95 transition"
        >
          <QrCode className="w-7 h-7" />
        </button>
      </div>
    </nav>
  );
}

function NavItem({ t, active }: { t: typeof tabs[number]; active: boolean }) {
  const Icon = t.icon;
  return (
    <Link
      to={t.to}
      className={`flex flex-col items-center justify-center gap-1 h-full text-[11px] font-semibold transition ${active ? "text-crimson" : "text-navy/60"}`}
    >
      <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
      <span>{t.label}</span>
      {active && <span className="w-1.5 h-1.5 rounded-full bg-crimson" />}
    </Link>
  );
}
