import { Bell, LogOut, Eye, EyeOff, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { computeOverallBalance, useAppData } from "@/store/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface AppHeaderProps {
  balance?: number;
}

function getGreeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء الخير";
  return "مساء النور";
}

const SEEN_KEY = "aqari-notif-seen";

export function AppHeader({ balance }: AppHeaderProps) {
  const [visible, setVisible] = useState(true);
  const [userName, setUserName] = useState("");
  const [greeting, setGreeting] = useState("أهلاً");
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(SEEN_KEY) ?? 0);
  });
  const navigate = useNavigate();
  const data = useAppData();
  const computedBalance = balance ?? computeOverallBalance(data);

  const recent = data.transactions.slice(0, 12);
  const unseen = recent.filter((t) => new Date(t.date).getTime() > seenAt).length;

  useEffect(() => {
    setGreeting(getGreeting(new Date()));
    supabase.auth.getUser().then(({ data: { user } }) => {
      const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string };
      const display = meta.full_name || meta.name || user?.email?.split("@")[0] || "";
      setUserName(display);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const openNotif = () => {
    setNotifOpen(true);
    const now = Date.now();
    setSeenAt(now);
    try { localStorage.setItem(SEEN_KEY, String(now)); } catch {}
  };

  return (
    <header className="bg-gradient-navy text-navy-foreground header-curve px-5 pt-6 pb-20 relative shadow-elevated">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} aria-label="خروج" className="p-2 rounded-xl hover:bg-white/10 transition">
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={openNotif} aria-label="إشعارات" className="p-2 rounded-xl hover:bg-white/10 transition relative">
            <Bell className="w-5 h-5" />
            {unseen > 0 && <span className="absolute top-1 left-1 min-w-4 h-4 px-1 text-[10px] font-bold bg-crimson rounded-full grid place-items-center">{unseen}</span>}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs opacity-80 flex items-center gap-1 justify-end">
              <span>☀</span> {greeting},
            </div>
            <div className="font-bold text-lg min-h-6">{userName || "\u00A0"}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white grid place-items-center shadow-card">
            <Building2 className="w-6 h-6 text-navy" />
          </div>
        </div>
      </div>

      <div className="text-center mt-7">
        <div className="text-xs opacity-75">الرصيد المتاح</div>
        <div className="flex items-center justify-center gap-3 mt-1">
          <span className="text-4xl font-extrabold tracking-tight">
            {visible ? computedBalance.toLocaleString("en-US") : "••••••"}
            <span className="text-base font-medium opacity-80 mr-1">ر.ي</span>
          </span>
          <button onClick={() => setVisible((v) => !v)} aria-label="إظهار الرصيد" className="opacity-80 hover:opacity-100">
            {visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-right">الإشعارات</DialogTitle>
            <DialogDescription className="text-right">آخر العمليات على حسابك.</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {recent.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">لا توجد إشعارات</div>}
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5">
                <div className="text-right">
                  <div className="text-sm font-bold text-navy">{t.categoryLabel}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.tenantName ? `${t.tenantName} · ` : ""}{new Date(t.date).toLocaleDateString("ar-EG")}
                  </div>
                </div>
                <div className={`text-sm font-extrabold tabular-nums ${t.type === "income" ? "text-success" : "text-crimson"}`}>
                  {t.type === "income" ? "+" : "−"} {t.amount.toLocaleString("en-US")}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
