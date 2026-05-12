import { Link, useLocation } from "@tanstack/react-router";
import { Home, Grid2x2, Wallet, MoreHorizontal, UserMinus, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useApartments, exitTenant } from "@/store/apartments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const tabs = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/services", label: "الخدمات", icon: Grid2x2 },
  { to: "/operations", label: "التقارير", icon: Wallet },
  { to: "/more", label: "المزيد", icon: MoreHorizontal },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const apartments = useApartments();
  const occupied = apartments.filter((a) => a.status !== "vacant");
  const target = apartments.find((a) => a.id === confirmId);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 max-w-md mx-auto">
      <div className="relative bg-white/95 backdrop-blur border-t border-border shadow-elevated">
        <div className="grid grid-cols-5 items-end h-[72px] px-2">
          {tabs.slice(0, 2).map((t) => <NavItem key={t.to} t={t} active={pathname === t.to} />)}
          <div />
          {tabs.slice(2).map((t) => <NavItem key={t.to} t={t} active={pathname === t.to} />)}
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="إخراج مستأجر"
          className="absolute -top-7 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-crimson text-crimson-foreground grid place-items-center shadow-crimson border-4 border-white active:scale-95 transition"
        >
          <UserMinus className="w-7 h-7" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-right">إخراج مستأجر</DialogTitle>
            <DialogDescription className="text-right">
              اختر المستأجر الذي ترغب بإنهاء عقده وإخلاء شقته.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {occupied.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">لا يوجد مستأجرون حالياً</div>
            )}
            {occupied.map((a) => (
              <button
                key={a.id}
                onClick={() => setConfirmId(a.id)}
                className="w-full flex items-center justify-between bg-secondary/60 hover:bg-secondary rounded-2xl px-4 py-3 border border-border text-right transition"
              >
                <span className="text-[10px] font-bold text-navy/60 bg-white rounded-md px-1.5 py-0.5">شقة {a.id}</span>
                <div>
                  <div className="text-sm font-bold text-navy">{a.tenantFirst} {a.tenantLast}</div>
                  <div className="text-[11px] text-muted-foreground">الطابق {a.floor}</div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent className="max-w-xs rounded-3xl text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-crimson/10 grid place-items-center">
            <AlertCircle className="w-7 h-7 text-crimson" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center">تأكيد إخراج المستأجر</DialogTitle>
            <DialogDescription className="text-center">
              {target && (
                <>سيتم إنهاء عقد <b>{target.tenantFirst} {target.tenantLast}</b> وإخلاء شقة {target.id}.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-center">
            <button
              onClick={() => setConfirmId(null)}
              className="flex-1 py-2.5 rounded-2xl bg-secondary text-navy font-bold text-sm"
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                if (confirmId) exitTenant(confirmId);
                setConfirmId(null);
                setOpen(false);
              }}
              className="flex-1 py-2.5 rounded-2xl bg-gradient-crimson text-crimson-foreground font-bold text-sm shadow-crimson"
            >
              تأكيد الإخراج
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
