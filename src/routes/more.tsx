import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Bot, Sparkles, FileText, Settings, Shield, HelpCircle, LogOut, Moon, Bell, Lock, Fingerprint, ChevronLeft, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/more")({
  head: () => ({ meta: [{ title: "المزيد — عقاري" }] }),
  component: MorePage,
});

type Panel = "menu" | "appearance" | "notifications" | "password" | "security";

function MorePage() {
  const [panel, setPanel] = useState<Panel>("menu");
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <MobileShell>
      <header className="bg-gradient-navy text-navy-foreground header-curve px-5 pt-8 pb-10 text-center shadow-elevated relative">
        {panel !== "menu" && (
          <button onClick={() => setPanel("menu")} aria-label="رجوع" className="absolute top-8 right-5 p-2 rounded-xl hover:bg-white/10">
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
        )}
        <h1 className="text-xl font-extrabold">
          {panel === "menu" ? "المزيد" : panel === "appearance" ? "المظهر" : panel === "notifications" ? "الإشعارات" : panel === "password" ? "كلمة المرور" : "الأمان والخصوصية"}
        </h1>
        <p className="text-xs opacity-75 mt-1">
          {panel === "menu" ? "الإعدادات والمساعد الذكي" : "تخصيص تجربة التطبيق"}
        </p>
      </header>

      <section className="mx-4 -mt-4">
        {panel === "menu" && <MenuPanel setPanel={setPanel} logout={logout} />}
        {panel === "appearance" && <AppearancePanel />}
        {panel === "notifications" && <NotificationsPanel />}
        {panel === "password" && <PasswordPanel />}
        {panel === "security" && <SecurityPanel />}
      </section>
    </MobileShell>
  );
}

function MenuPanel({ setPanel, logout }: { setPanel: (p: Panel) => void; logout: () => void }) {
  return (
    <>
      <div className="bg-gradient-crimson text-crimson-foreground rounded-3xl p-5 shadow-crimson">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 grid place-items-center backdrop-blur">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1 text-xs opacity-90">
              <Sparkles className="w-3.5 h-3.5" /> وضع: مدير العقار
            </div>
            <h2 className="font-extrabold text-lg mt-1">المساعد الذكي</h2>
            <p className="text-xs opacity-90 mt-1 leading-relaxed">
              يلخّص بياناتك الشهرية، يتابع المتأخرين، ويقترح خطوات التحصيل.
            </p>
          </div>
        </div>
        <button className="mt-4 w-full bg-white text-crimson font-bold rounded-xl py-2.5 text-sm">بدء المحادثة</button>
      </div>

      <div className="mt-5 bg-white rounded-2xl shadow-card border border-border divide-y divide-border">
        <Item icon={Settings} label="المظهر" onClick={() => setPanel("appearance")} />
        <Item icon={Bell} label="إعدادات الإشعارات" onClick={() => setPanel("notifications")} />
        <Item icon={Lock} label="تعديل كلمة مرور التطبيق" onClick={() => setPanel("password")} />
        <Item icon={Shield} label="الأمان والبصمة" onClick={() => setPanel("security")} />
        <Item icon={FileText} label="التقارير والكشوفات" />
        <Item icon={HelpCircle} label="المساعدة" />
        <Item icon={LogOut} label="تسجيل الخروج" onClick={logout} />
      </div>
    </>
  );
}

function Item({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-right hover:bg-secondary/50 transition">
      <Icon className="w-5 h-5 text-navy" />
      <span className="flex-1 font-semibold text-sm text-navy">{label}</span>
      <span className="text-muted-foreground">›</span>
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl shadow-card border border-border p-4 space-y-4">{children}</div>;
}

function ToggleRow({ icon: Icon, title, subtitle, storageKey, defaultValue = false }: { icon: any; title: string; subtitle?: string; storageKey: string; defaultValue?: boolean }) {
  const [val, setVal] = useState(defaultValue);
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) setVal(saved === "1");
  }, [storageKey]);
  const update = (v: boolean) => {
    setVal(v);
    localStorage.setItem(storageKey, v ? "1" : "0");
  };
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-secondary grid place-items-center">
        <Icon className="w-5 h-5 text-navy" />
      </div>
      <div className="flex-1 text-right">
        <div className="text-sm font-bold text-navy">{title}</div>
        {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
      </div>
      <Switch checked={val} onCheckedChange={update} />
    </div>
  );
}

function AppearancePanel() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("theme") as any) || "light";
  });
  useEffect(() => {
    const root = document.documentElement;
    const apply = (t: string) => {
      const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", dark);
    };
    apply(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <Card>
      <div className="text-sm font-bold text-navy">وضع المظهر</div>
      <div className="grid grid-cols-3 gap-2">
        {(["light", "dark", "system"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`py-3 rounded-2xl text-xs font-bold border transition ${theme === t ? "bg-navy text-navy-foreground border-navy" : "bg-secondary text-navy border-border"}`}
          >
            {t === "light" ? "فاتح" : t === "dark" ? "داكن" : "تلقائي"}
          </button>
        ))}
      </div>
      <div className="border-t border-border pt-4">
        <ToggleRow icon={Moon} title="الوضع الليلي التلقائي" subtitle="يتبع إعدادات الجهاز" storageKey="theme-auto" />
      </div>
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary grid place-items-center">
            <Globe className="w-5 h-5 text-navy" />
          </div>
          <div className="flex-1 text-right">
            <div className="text-sm font-bold text-navy">اللغة</div>
            <div className="text-[11px] text-muted-foreground">العربية (افتراضي)</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function NotificationsPanel() {
  return (
    <Card>
      <ToggleRow icon={Bell} title="الإشعارات العامة" storageKey="notif-all" defaultValue={true} />
      <div className="border-t border-border pt-4">
        <ToggleRow icon={Bell} title="تذكير الإيجار الشهري" subtitle="قبل موعد الاستحقاق بـ 3 أيام" storageKey="notif-rent" defaultValue={true} />
      </div>
      <div className="border-t border-border pt-4">
        <ToggleRow icon={Bell} title="تنبيه المتأخرات" storageKey="notif-overdue" defaultValue={true} />
      </div>
      <div className="border-t border-border pt-4">
        <ToggleRow icon={Bell} title="ملخّص أسبوعي" storageKey="notif-weekly" />
      </div>
    </Card>
  );
}

function PasswordPanel() {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    setHasPin(!!localStorage.getItem("app-pin"));
  }, []);

  const save = () => {
    setErr(null);
    if (pin.length < 4) return setErr("الرمز يجب ألا يقل عن 4 أرقام");
    if (pin !== confirm) return setErr("الرمزان غير متطابقين");
    localStorage.setItem("app-pin", pin);
    setHasPin(true);
    setPin("");
    setConfirm("");
    setOpen(false);
  };

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary grid place-items-center">
          <Lock className="w-5 h-5 text-navy" />
        </div>
        <div className="flex-1 text-right">
          <div className="text-sm font-bold text-navy">رمز قفل التطبيق</div>
          <div className="text-[11px] text-muted-foreground">{hasPin ? "مفعّل" : "غير مفعّل"}</div>
        </div>
        <button onClick={() => setOpen(true)} className="text-xs font-bold text-crimson">{hasPin ? "تغيير" : "تفعيل"}</button>
      </div>
      {hasPin && (
        <div className="border-t border-border pt-4">
          <button
            onClick={() => { localStorage.removeItem("app-pin"); setHasPin(false); }}
            className="text-xs font-bold text-muted-foreground"
          >
            إيقاف رمز القفل
          </button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-right">تعيين رمز التطبيق</DialogTitle>
            <DialogDescription className="text-right">رمز رقمي لا يقل عن 4 أرقام.</DialogDescription>
          </DialogHeader>
          <input
            dir="ltr" type="password" inputMode="numeric" maxLength={8} value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••" className="w-full bg-secondary rounded-2xl px-4 py-3 text-center tracking-widest text-lg outline-none"
          />
          <input
            dir="ltr" type="password" inputMode="numeric" maxLength={8} value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
            placeholder="تأكيد الرمز" className="w-full bg-secondary rounded-2xl px-4 py-3 text-center tracking-widest text-lg outline-none"
          />
          {err && <div className="text-xs text-crimson text-center">{err}</div>}
          <DialogFooter>
            <button onClick={save} className="w-full bg-gradient-crimson text-crimson-foreground rounded-2xl py-3 font-bold shadow-crimson">حفظ</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SecurityPanel() {
  return (
    <Card>
      <ToggleRow icon={Fingerprint} title="فتح التطبيق بالبصمة" subtitle="إن كانت مدعومة على جهازك" storageKey="biometric" />
      <div className="border-t border-border pt-4">
        <ToggleRow icon={Lock} title="قفل تلقائي بعد دقيقة" storageKey="auto-lock" defaultValue={true} />
      </div>
      <div className="border-t border-border pt-4">
        <ToggleRow icon={Shield} title="إخفاء الأرقام عند المعاينة" storageKey="hide-amounts" />
      </div>
    </Card>
  );
}
