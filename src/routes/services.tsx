import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useState } from "react";
import {
  HandCoins, Droplets, Wrench, Landmark, UserSquare2, UserCheck, Plus, X, type LucideIcon,
  Receipt, Zap, Flame, Wifi, ShieldCheck, Trash2, Hammer, Paintbrush, Building, Home,
  UserMinus, PlusCircle, MinusCircle, AlertCircle,
} from "lucide-react";
import { useAppData, dataActions, type ServiceDef } from "@/store/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const ICON_MAP: Record<string, LucideIcon> = {
  HandCoins, Droplets, Wrench, Landmark, UserSquare2, UserCheck,
  Receipt, Zap, Flame, Wifi, ShieldCheck, Trash2, Hammer, Paintbrush, Building, Home,
  UserMinus, PlusCircle, MinusCircle,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "الخدمات — عقاري" }] }),
  component: ServicesPage,
});

type Modal =
  | { kind: "none" }
  | { kind: "newService" }
  | { kind: "addCredit" }
  | { kind: "withdraw" }
  | { kind: "exitTenant" }
  | { kind: "service"; service: ServiceDef };

function ServicesPage() {
  const data = useAppData();
  const [modal, setModal] = useState<Modal>({ kind: "none" });
  const [editMode, setEditMode] = useState(false);
  const close = () => setModal({ kind: "none" });

  const extras: { id: string; label: string; iconKey: string; kind: "income" | "expense"; onClick: () => void }[] = [
    { id: "credit-add", label: "إضافة رصيد", iconKey: "PlusCircle", kind: "income", onClick: () => setModal({ kind: "addCredit" }) },
    { id: "credit-out", label: "سحب رصيد لمستأجر", iconKey: "MinusCircle", kind: "expense", onClick: () => setModal({ kind: "withdraw" }) },
    { id: "exit", label: "إخراج مستأجر", iconKey: "UserMinus", kind: "expense", onClick: () => setModal({ kind: "exitTenant" }) },
  ];

  const colorClass = (kind: "income" | "expense") =>
    kind === "income" ? "text-success" : "text-crimson";

  return (
    <MobileShell>
      <header className="bg-gradient-navy text-navy-foreground header-curve px-5 pt-8 pb-10 text-center shadow-elevated relative">
        <h1 className="text-xl font-extrabold">الخدمات</h1>
        <p className="text-xs opacity-75 mt-1">جميع خدمات إدارة العقار</p>
        <button
          onClick={() => setEditMode((v) => !v)}
          className="absolute top-8 left-5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold"
        >
          {editMode ? "تم" : "تعديل"}
        </button>
      </header>

      <section className="mx-4 mt-6 mb-28">
        <div className="grid grid-cols-3 gap-3">
          {data.services.map((s) => {
            const Icon = ICON_MAP[s.iconKey] ?? Receipt;
            // All services deletable in edit mode except "rent"; credit-add isn't in this list.
            const canDelete = editMode && s.id !== "rent";
            return (
              <div key={s.id} className="relative">
                <button
                  onClick={() => !editMode && setModal({ kind: "service", service: s })}
                  className="w-full bg-secondary/70 rounded-2xl p-3 aspect-square flex flex-col items-center justify-center gap-2 hover:shadow-card active:scale-95 transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-white grid place-items-center shadow-card">
                    <Icon className={`w-6 h-6 ${colorClass(s.kind)}`} strokeWidth={1.8} />
                  </div>
                  <div className="text-[11px] font-semibold text-navy leading-tight text-center">{s.label}</div>
                </button>
                {canDelete && (
                  <button
                    onClick={() => dataActions.removeService(s.id)}
                    aria-label="حذف"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-crimson text-crimson-foreground grid place-items-center shadow-crimson"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {extras.map((e) => {
            const Icon = ICON_MAP[e.iconKey] ?? Receipt;
            return (
              <button
                key={e.id}
                onClick={() => !editMode && e.onClick()}
                className="bg-secondary/70 rounded-2xl p-3 aspect-square flex flex-col items-center justify-center gap-2 hover:shadow-card active:scale-95 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-white grid place-items-center shadow-card">
                  <Icon className={`w-6 h-6 ${colorClass(e.kind)}`} strokeWidth={1.8} />
                </div>
                <div className="text-[11px] font-semibold text-navy leading-tight text-center">{e.label}</div>
              </button>
            );
          })}

          {!editMode && (
            <button
              onClick={() => setModal({ kind: "newService" })}
              className="rounded-2xl p-3 aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-navy/30 text-navy/70 hover:border-crimson hover:text-crimson active:scale-95 transition"
            >
              <Plus className="w-7 h-7" />
              <div className="text-[11px] font-semibold leading-tight text-center">إضافة خدمة</div>
            </button>
          )}
        </div>
        {editMode && (
          <p className="text-[11px] text-muted-foreground text-center mt-4">
            اضغط ✕ لحذف أي خدمة. حذف الخدمة لا يحذف العمليات السابقة من التقرير.
            <br />الخدمتان «دفع الإيجار» و«إضافة رصيد» محميّتان.
          </p>
        )}
      </section>

      <NewServiceDialog open={modal.kind === "newService"} onClose={close} />
      <AddCreditDialog open={modal.kind === "addCredit"} onClose={close} />
      <WithdrawDialog open={modal.kind === "withdraw"} onClose={close} />
      <ExitTenantDialog open={modal.kind === "exitTenant"} onClose={close} />
      <ServiceQuickEntry
        service={modal.kind === "service" ? modal.service : null}
        onClose={close}
      />
    </MobileShell>
  );
}

// ============ Sub-dialogs ============
function NewServiceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [iconKey, setIconKey] = useState("Receipt");

  const reset = () => { setLabel(""); setIconKey("Receipt"); };
  const save = () => {
    if (!label.trim()) return;
    // كل الخدمات الجديدة مصاريف (الدخل محصور بـ "دفع الإيجار" و "إضافة رصيد")
    dataActions.addService({ label, iconKey, kind: "expense" });
    reset(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة خدمة جديدة</DialogTitle>
          <DialogDescription className="text-right">سيتم تصنيف الخدمة كمصروف تلقائياً.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5 text-right">اسم الخدمة</label>
            <input dir="rtl" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="مثال: فاتورة الكهرباء" className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5 text-right">الأيقونة</label>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
              {ICON_OPTIONS.map((key) => {
                const Icon = ICON_MAP[key];
                const active = iconKey === key;
                return (
                  <button key={key} onClick={() => setIconKey(key)} className={`aspect-square rounded-xl grid place-items-center transition ${active ? "bg-crimson text-crimson-foreground shadow-crimson" : "bg-secondary text-navy"}`}>
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <button onClick={save} className="w-full bg-gradient-crimson text-crimson-foreground rounded-2xl py-3 font-bold shadow-crimson">إضافة الخدمة</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddCreditDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const now = new Date();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const reset = () => { setAmount(""); setNote(""); setYear(now.getFullYear()); };
  const save = () => {
    const a = Number(amount);
    if (!a || a <= 0) return;
    dataActions.addCredit(a, note || undefined, year);
    reset(); onClose();
  };
  const years: number[] = [];
  for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 5; y--) years.push(y);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة رصيد</DialogTitle>
          <DialogDescription className="text-right">يُضاف المبلغ إلى «الرصيد السابق» للسنة المحددة في التقرير.</DialogDescription>
        </DialogHeader>
        <input dir="ltr" inputMode="numeric" placeholder="المبلغ" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className="w-full bg-secondary rounded-xl px-4 py-3 outline-none" />
        <input dir="rtl" placeholder="ملاحظة (اختياري)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 outline-none" />
        <div>
          <label className="block text-[11px] font-semibold text-navy mb-1 text-right">السنة</label>
          <select dir="rtl" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <DialogFooter><button onClick={save} className="w-full bg-success text-success-foreground rounded-2xl py-3 font-bold">إضافة</button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ====== Reusable Month/Year picker ======
function MonthYearPicker({ month, year, onMonth, onYear }: { month: number; year: number; onMonth: (m: number) => void; onYear: (y: number) => void }) {
  const now = new Date();
  const years: number[] = [];
  for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 5; y--) years.push(y);
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-[11px] font-semibold text-navy mb-1 text-right">الشهر</label>
        <select dir="rtl" value={month} onChange={(e) => onMonth(Number(e.target.value))} className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none">
          {MONTHS_AR.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-navy mb-1 text-right">السنة</label>
        <select dir="rtl" value={year} onChange={(e) => onYear(Number(e.target.value))} className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}

function WithdrawDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useAppData();
  const now = new Date();
  const [tenantId, setTenantId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const reset = () => { setTenantId(""); setAmount(""); setMonth(now.getMonth()); setYear(now.getFullYear()); };
  const save = () => {
    const a = Number(amount);
    if (!a || a <= 0 || !tenantId) return;
    const date = new Date(year, month, Math.min(now.getDate(), 28)).toISOString();
    dataActions.withdrawToTenant({ tenantId, amount: a, date });
    reset(); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-right">سحب رصيد لمستأجر</DialogTitle>
          <DialogDescription className="text-right">يُسجَّل كخصم من الرصيد العام ويظهر في التقرير.</DialogDescription>
        </DialogHeader>
        <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 outline-none">
          <option value="">— اختر المستأجر —</option>
          {data.tenants.filter((t) => t.active).map((t) => (
            <option key={t.id} value={t.id}>{t.fullName}</option>
          ))}
        </select>
        <input dir="ltr" inputMode="numeric" placeholder="المبلغ" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className="w-full bg-secondary rounded-xl px-4 py-3 outline-none" />
        <MonthYearPicker month={month} year={year} onMonth={setMonth} onYear={setYear} />
        <DialogFooter><button onClick={save} className="w-full bg-crimson text-crimson-foreground rounded-2xl py-3 font-bold">تأكيد السحب</button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExitTenantDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useAppData();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const active = data.tenants.filter((t) => t.active);
  const target = active.find((t) => t.id === confirmId);
  return (
    <>
      <Dialog open={open && !confirmId} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-right">إخراج مستأجر</DialogTitle>
            <DialogDescription className="text-right">اختر المستأجر لإنهاء عقده.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {active.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">لا يوجد مستأجرون</div>}
            {active.map((t) => (
              <button key={t.id} onClick={() => setConfirmId(t.id)} className="w-full bg-secondary/60 hover:bg-secondary rounded-2xl px-4 py-3 border border-border text-right">
                <div className="text-sm font-bold text-navy">{t.fullName}</div>
                <div className="text-[11px] text-muted-foreground">شقة {t.apartmentId}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!confirmId} onOpenChange={(o) => { if (!o) setConfirmId(null); }}>
        <DialogContent className="max-w-xs rounded-3xl text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-crimson/10 grid place-items-center">
            <AlertCircle className="w-7 h-7 text-crimson" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center">تأكيد إخراج المستأجر</DialogTitle>
            <DialogDescription className="text-center">{target && <>سيتم إنهاء عقد <b>{target.fullName}</b>.</>}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-center">
            <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 rounded-2xl bg-secondary text-navy font-bold text-sm">إلغاء</button>
            <button onClick={() => { if (confirmId) dataActions.exitTenant(confirmId); setConfirmId(null); onClose(); }} className="flex-1 py-2.5 rounded-2xl bg-gradient-crimson text-crimson-foreground font-bold text-sm shadow-crimson">تأكيد</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ServiceQuickEntry({ service, onClose }: { service: ServiceDef | null; onClose: () => void }) {
  const data = useAppData();
  const now = new Date();
  const [amount, setAmount] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenantQuery, setTenantQuery] = useState("");
  const [note, setNote] = useState("");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const isRent = service?.id === "rent";
  const reset = () => { setAmount(""); setTenantId(""); setTenantQuery(""); setNote(""); setMonth(now.getMonth()); setYear(now.getFullYear()); };

  const suggestions = isRent && tenantQuery
    ? data.tenants.filter((t) => t.active && t.fullName.includes(tenantQuery)).slice(0, 5)
    : [];

  const save = () => {
    const a = Number(amount);
    if (!a || !service) return;
    if (isRent && !tenantId) return;
    const date = new Date(year, month, Math.min(now.getDate(), 28)).toISOString();
    dataActions.addTransaction({ type: service.kind, category: service.id, categoryLabel: service.label, amount: a, tenantId: isRent ? tenantId : undefined, note: note || undefined, date });
    reset(); onClose();
  };

  return (
    <Dialog open={!!service} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">{service?.label}</DialogTitle>
          <DialogDescription className={`text-right ${service?.kind === "income" ? "text-success" : "text-crimson"}`}>
            {service?.kind === "income" ? "دخل" : "مصروف"}
          </DialogDescription>
        </DialogHeader>
        {isRent && (
          <div className="relative">
            <input dir="rtl" value={tenantQuery} onChange={(e) => { setTenantQuery(e.target.value); setTenantId(""); }} placeholder="اسم المستأجر..." className="w-full bg-secondary rounded-xl px-4 py-3 outline-none" />
            {suggestions.length > 0 && !tenantId && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-border rounded-xl shadow-card max-h-40 overflow-y-auto">
                {suggestions.map((t) => (
                  <button key={t.id} onClick={() => { setTenantId(t.id); setTenantQuery(t.fullName); setAmount(String(t.monthlyRent)); }} className="w-full text-right px-4 py-2 text-sm hover:bg-secondary">
                    {t.fullName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <input dir="ltr" inputMode="numeric" placeholder="المبلغ" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className="w-full bg-secondary rounded-xl px-4 py-3 outline-none" />
        <MonthYearPicker month={month} year={year} onMonth={setMonth} onYear={setYear} />
        <input dir="rtl" placeholder="ملاحظة (اختياري)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 outline-none" />
        <DialogFooter><button onClick={save} className="w-full bg-gradient-crimson text-crimson-foreground rounded-2xl py-3 font-bold shadow-crimson">حفظ</button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
