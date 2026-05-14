import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Settings, Shield, LogOut, Moon, Bell, Lock, Fingerprint, ChevronLeft, Globe, Download, Upload, CalendarPlus, FileSpreadsheet, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { dataActions, useAppData } from "@/store/data";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/more")({
  head: () => ({ meta: [{ title: "المزيد — عقاري" }] }),
  component: MorePage,
});

type Panel = "menu" | "appearance" | "notifications" | "password" | "security" | "backup";

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
          {panel === "menu" ? "المزيد" : panel === "appearance" ? "المظهر" : panel === "notifications" ? "الإشعارات" : panel === "password" ? "كلمة المرور" : panel === "backup" ? "النسخ الاحتياطي" : "الأمان والخصوصية"}
        </h1>
        <p className="text-xs opacity-75 mt-1">إعدادات التطبيق</p>
      </header>

      <section className="mx-4 -mt-4">
        {panel === "menu" && <MenuPanel setPanel={setPanel} logout={logout} />}
        {panel === "appearance" && <AppearancePanel />}
        {panel === "notifications" && <NotificationsPanel />}
        {panel === "password" && <PasswordPanel />}
        {panel === "security" && <SecurityPanel />}
        {panel === "backup" && <BackupPanel />}
      </section>
    </MobileShell>
  );
}

function MenuPanel({ setPanel, logout }: { setPanel: (p: Panel) => void; logout: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-border divide-y divide-border">
      <Item icon={Settings} label="المظهر" onClick={() => setPanel("appearance")} />
      <Item icon={Bell} label="إعدادات الإشعارات" onClick={() => setPanel("notifications")} />
      <Item icon={Lock} label="تعديل كلمة مرور التطبيق" onClick={() => setPanel("password")} />
      
      <Item icon={Download} label="النسخ الاحتياطي والترحيل" onClick={() => setPanel("backup")} />
      <Item icon={LogOut} label="تسجيل الخروج" onClick={logout} />
    </div>
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
  const update = (v: boolean) => { setVal(v); localStorage.setItem(storageKey, v ? "1" : "0"); };
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-secondary grid place-items-center">
        <Icon className="w-5 h-5 text-navy" />
      </div>
      <div className="flex-1 text-right">
        <div className="text-sm font-bold text-navy">{title}</div>
        {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
      </div>
      <Switch checked={val} onCheckedChange={update} dir="ltr" />
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
          <button key={t} onClick={() => setTheme(t)} className={`py-3 rounded-2xl text-xs font-bold border ${theme === t ? "bg-navy text-navy-foreground border-navy" : "bg-secondary text-navy border-border"}`}>
            {t === "light" ? "فاتح" : t === "dark" ? "داكن" : "تلقائي"}
          </button>
        ))}
      </div>
      <div className="border-t border-border pt-4">
        <ToggleRow icon={Moon} title="الوضع الليلي التلقائي" subtitle="يتبع إعدادات الجهاز" storageKey="theme-auto" />
      </div>
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary grid place-items-center"><Globe className="w-5 h-5 text-navy" /></div>
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
      <div className="border-t border-border pt-4"><ToggleRow icon={Bell} title="تذكير الإيجار الشهري" subtitle="قبل موعد الاستحقاق بـ 3 أيام" storageKey="notif-rent" defaultValue={true} /></div>
      <div className="border-t border-border pt-4"><ToggleRow icon={Bell} title="تنبيه المتأخرات" storageKey="notif-overdue" defaultValue={true} /></div>
      <div className="border-t border-border pt-4"><ToggleRow icon={Bell} title="ملخّص أسبوعي" storageKey="notif-weekly" /></div>
    </Card>
  );
}

function PasswordPanel() {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState(false);
  useEffect(() => { setHasPin(!!localStorage.getItem("app-pin")); }, []);

  const save = () => {
    setErr(null);
    if (pin.length < 4) return setErr("الرمز يجب ألا يقل عن 4 أرقام");
    if (pin !== confirm) return setErr("الرمزان غير متطابقين");
    localStorage.setItem("app-pin", pin);
    setHasPin(true); setPin(""); setConfirm(""); setOpen(false);
  };

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary grid place-items-center"><Lock className="w-5 h-5 text-navy" /></div>
        <div className="flex-1 text-right">
          <div className="text-sm font-bold text-navy">رمز قفل التطبيق</div>
          <div className="text-[11px] text-muted-foreground">{hasPin ? "مفعّل" : "غير مفعّل"}</div>
        </div>
        <button onClick={() => setOpen(true)} className="text-xs font-bold text-crimson">{hasPin ? "تغيير" : "تفعيل"}</button>
      </div>
      {hasPin && (
        <div className="border-t border-border pt-4">
          <button onClick={() => { localStorage.removeItem("app-pin"); setHasPin(false); }} className="text-xs font-bold text-muted-foreground">إيقاف رمز القفل</button>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-right">تعيين رمز التطبيق</DialogTitle>
            <DialogDescription className="text-right">رمز رقمي لا يقل عن 4 أرقام.</DialogDescription>
          </DialogHeader>
          <input dir="ltr" type="password" inputMode="numeric" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="w-full bg-secondary rounded-2xl px-4 py-3 text-center tracking-widest text-lg outline-none" />
          <input dir="ltr" type="password" inputMode="numeric" maxLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))} placeholder="تأكيد الرمز" className="w-full bg-secondary rounded-2xl px-4 py-3 text-center tracking-widest text-lg outline-none" />
          {err && <div className="text-xs text-crimson text-center">{err}</div>}
          <DialogFooter><button onClick={save} className="w-full bg-gradient-crimson text-crimson-foreground rounded-2xl py-3 font-bold shadow-crimson">حفظ</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SecurityPanel() {
  return (
    <Card>
      <ToggleRow icon={Fingerprint} title="فتح التطبيق بالبصمة" subtitle="إن كانت مدعومة على جهازك" storageKey="biometric" />
      <div className="border-t border-border pt-4"><ToggleRow icon={Lock} title="قفل تلقائي بعد دقيقة" storageKey="auto-lock" defaultValue={true} /></div>
      <div className="border-t border-border pt-4"><ToggleRow icon={Shield} title="إخفاء الأرقام عند المعاينة" storageKey="hide-amounts" /></div>
    </Card>
  );
}

function BackupPanel() {
  const data = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmYear, setConfirmYear] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const exportJSON = () => {
    const blob = new Blob([dataActions.exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `aqari-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.tenants), "المستأجرون");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.transactions), "العمليات");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.services), "الخدمات");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.apartments), "الشقق");
    XLSX.writeFile(wb, `aqari-backup-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        dataActions.importData(String(reader.result));
        setMsg("تم استيراد البيانات بنجاح");
      } catch (err) {
        setMsg("ملف غير صالح");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <div className="text-xs text-muted-foreground text-right leading-relaxed bg-secondary/60 rounded-xl p-3">
        ⚠ بياناتك محفوظة محلياً على هذا الجهاز فقط. أخذ نسخة احتياطية بشكل دوري يحميك من فقدان البيانات.
      </div>
      <button onClick={exportJSON} className="w-full flex items-center justify-center gap-2 bg-navy text-navy-foreground rounded-2xl py-3 font-bold">
        <Download className="w-5 h-5" /> تصدير JSON
      </button>
      <button onClick={exportXLSX} className="w-full flex items-center justify-center gap-2 bg-success text-success-foreground rounded-2xl py-3 font-bold">
        <FileSpreadsheet className="w-5 h-5" /> تصدير Excel
      </button>
      <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJSON} />
      <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-secondary text-navy rounded-2xl py-3 font-bold border border-border">
        <Upload className="w-5 h-5" /> استيراد نسخة JSON
      </button>
      <div className="border-t border-border pt-4">
        <div className="text-sm font-bold text-navy text-right mb-2">السنة الحالية: {data.currentYear}</div>
        <button onClick={() => setConfirmYear(true)} className="w-full flex items-center justify-center gap-2 bg-gradient-crimson text-crimson-foreground rounded-2xl py-3 font-bold shadow-crimson">
          <CalendarPlus className="w-5 h-5" /> بدء سنة جديدة (ترحيل)
        </button>
      </div>
      {msg && <div className="text-xs text-success text-center">{msg}</div>}

      <Dialog open={confirmYear} onOpenChange={setConfirmYear}>
        <DialogContent className="max-w-xs rounded-3xl text-center">
          <DialogHeader>
            <DialogTitle className="text-center">ترحيل لسنة جديدة</DialogTitle>
            <DialogDescription className="text-center">سيتم أرشفة بيانات {data.currentYear} ونقل الإجمالي الشامل كرصيد سابق للسنة {data.currentYear + 1}. لا يمكن التراجع.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-center">
            <button onClick={() => setConfirmYear(false)} className="flex-1 py-2.5 rounded-2xl bg-secondary text-navy font-bold text-sm">إلغاء</button>
            <button onClick={() => { dataActions.startNewYear(); setConfirmYear(false); setMsg("تم الترحيل بنجاح"); }} className="flex-1 py-2.5 rounded-2xl bg-gradient-crimson text-crimson-foreground font-bold text-sm shadow-crimson">تأكيد</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
