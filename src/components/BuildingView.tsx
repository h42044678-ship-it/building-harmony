import { useState } from "react";
import { useAppData, dataActions } from "@/store/data";
import { useApartments } from "@/store/apartments";
import type { ApartmentView } from "@/store/apartments";
import { AlertCircle, CheckCircle2, Plus, DoorClosed, CalendarDays, Wallet, Phone, UserPlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ApartmentCard({ a, onClick }: { a: ApartmentView; onClick: () => void }) {
  if (a.status === "vacant") {
    return (
      <button onClick={onClick} className="apt-vacant rounded-2xl p-3 h-24 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-navy transition">
        <DoorClosed className="w-5 h-5" />
        <div className="flex items-center gap-1 text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> إضافة مستأجر
        </div>
        <div className="text-[10px] opacity-70">شقة {a.id}</div>
      </button>
    );
  }
  const isPaid = a.status === "paid";
  return (
    <button onClick={onClick} className={`${isPaid ? "apt-paid" : "apt-unpaid"} rounded-2xl p-3 h-24 flex flex-col justify-between transition text-right`}>
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold text-navy/70 bg-white/60 rounded-md px-1.5 py-0.5">شقة {a.id}</span>
        {isPaid ? (
          <CheckCircle2 className="w-4 h-4 text-success" />
        ) : (
          <AlertCircle className="w-4 h-4 text-crimson animate-pulse" />
        )}
      </div>
      <div>
        <div className="text-sm font-bold text-navy leading-tight">{a.tenantFirst}</div>
        <div className="text-xs text-navy/70 leading-tight">{a.tenantLast}</div>
      </div>
    </button>
  );
}

export function BuildingView() {
  const apartments = useApartments();
  const data = useAppData();
  const [selected, setSelected] = useState<ApartmentView | null>(null);
  const [addOpen, setAddOpen] = useState<string | null>(null); // apartment id
  const floors = [3, 2, 1];

  const recent = data.transactions.slice(0, 5);

  const onCardClick = (a: ApartmentView) => {
    if (a.status === "vacant") setAddOpen(a.id);
    else setSelected(a);
  };

  return (
    <section className="mx-4 mt-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-navy text-lg">العمارة</h2>
          <span className="text-xs text-muted-foreground">٣ طوابق · ٦ شقق</span>
        </div>
        <div className="bg-secondary/60 rounded-3xl p-3 shadow-card border border-border space-y-2">
          {floors.map((f) => {
            const units = apartments.filter((a) => a.floor === f);
            return (
              <div key={f} className="relative">
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-navy/50 rotate-90 origin-center">
                  ط{f}
                </div>
                <div className="grid grid-cols-2 gap-2 px-4">
                  {units.map((a) => (
                    <ApartmentCard key={a.id} a={a} onClick={() => onCardClick(a)} />
                  ))}
                </div>
              </div>
            );
          })}
          <div className="h-3 bg-gradient-navy rounded-b-2xl rounded-t-md mt-2 opacity-90" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-navy text-lg">العمليات الأخيرة</h2>
          <span className="text-xs text-muted-foreground">{recent.length} عملية</span>
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-card divide-y divide-border">
          {recent.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">لا توجد عمليات بعد</div>
          )}
          {recent.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="text-right">
                <div className="text-sm font-bold text-navy">{t.categoryLabel}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t.tenantName ? `${t.tenantName} · ` : ""}{new Date(t.date).toLocaleDateString("ar-EG")}
                </div>
              </div>
              <div className={`text-sm font-extrabold tabular-nums ${t.type === "income" ? "text-success" : "text-crimson"}`}>
                {t.type === "income" ? "+" : "−"} {t.amount.toLocaleString("en-US")}
                <span className="text-[10px] font-medium opacity-70 mr-1">ر.ي</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant details dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-0">
          {selected && selected.status !== "vacant" && (
            <>
              <div className="bg-gradient-navy text-navy-foreground p-5 relative">
                <div className="text-xs opacity-80">شقة رقم {selected.id} · الطابق {selected.floor}</div>
                <div className="font-extrabold text-xl mt-1">{selected.tenantFirst} {selected.tenantLast}</div>
                <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md ${selected.status === "paid" ? "bg-success/30" : "bg-crimson/30"}`}>
                  {selected.status === "paid" ? "مسدد" : "متأخر"}
                </span>
              </div>
              <div className="p-5 space-y-3">
                <DialogHeader className="sr-only">
                  <DialogTitle>بيانات المستأجر</DialogTitle>
                  <DialogDescription>تفاصيل مستأجر الشقة</DialogDescription>
                </DialogHeader>
                <Row icon={<CalendarDays className="w-4 h-4" />} label="تاريخ الدخول" value={formatDate(selected.entryDate)} />
                <Row icon={<Wallet className="w-4 h-4" />} label="الإيجار الشهري" value={`${selected.monthlyRent.toLocaleString("en-US")} ر.ي`} />
                <Row icon={<CheckCircle2 className="w-4 h-4 text-success" />} label="الأشهر المسددة" value={`${selected.paidMonths ?? 0} شهر`} />
                <div className="bg-secondary/60 rounded-2xl p-3 border border-border">
                  <div className="text-xs text-muted-foreground">المتبقي على المستأجر</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className={`text-2xl font-extrabold ${selected.remainingAmount > 0 ? "text-crimson" : "text-success"}`}>
                      {selected.remainingAmount.toLocaleString("en-US")} <span className="text-sm font-semibold">ر.ي</span>
                    </div>
                  </div>
                </div>
                <Row icon={<Phone className="w-4 h-4" />} label="رقم الهاتف" value={selected.phone || "—"} />
                <DialogFooter className="flex-row gap-2 pt-2">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex-1 py-2.5 rounded-2xl bg-secondary text-navy font-bold text-sm"
                  >
                    إغلاق
                  </button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AddTenantDialog apartmentId={addOpen} onClose={() => setAddOpen(null)} />
    </section>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-sm text-navy/70">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-bold text-navy">{value}</div>
    </div>
  );
}

function AddTenantDialog({ apartmentId, onClose }: { apartmentId: string | null; onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [rent, setRent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [err, setErr] = useState<string | null>(null);

  const reset = () => { setFullName(""); setPhone(""); setRent(""); setDate(new Date().toISOString().slice(0, 10)); setErr(null); };

  const save = () => {
    setErr(null);
    if (!fullName.trim()) return setErr("الاسم مطلوب");
    const r = Number(rent);
    if (!r || r <= 0) return setErr("قيمة الإيجار غير صحيحة");
    if (!apartmentId) return;
    dataActions.addTenant({ fullName, phone, monthlyRent: r, entryDate: new Date(date).toISOString(), apartmentId });
    reset();
    onClose();
  };

  return (
    <Dialog open={!!apartmentId} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2"><UserPlus className="w-5 h-5 text-crimson" /> إضافة مستأجر — شقة {apartmentId}</DialogTitle>
          <DialogDescription className="text-right">أدخل بيانات المستأجر الجديد.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="الاسم الكامل">
            <input dir="rtl" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none" placeholder="مثال: أحمد محمد الشيخ" />
          </Field>
          <Field label="رقم الهاتف">
            <input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none" placeholder="7xx xxx xxx" />
          </Field>
          <Field label="الإيجار الشهري (ر.ي)">
            <input dir="ltr" inputMode="numeric" value={rent} onChange={(e) => setRent(e.target.value.replace(/\D/g, ""))} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none" placeholder="55000" />
          </Field>
          <Field label="تاريخ الدخول">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none" />
          </Field>
          {err && <div className="text-xs text-crimson text-center">{err}</div>}
        </div>
        <DialogFooter className="flex-row gap-2">
          <button onClick={() => { reset(); onClose(); }} className="flex-1 py-2.5 rounded-2xl bg-secondary text-navy font-bold text-sm">
            <X className="w-4 h-4 inline ml-1" /> إلغاء
          </button>
          <button onClick={save} className="flex-1 py-2.5 rounded-2xl bg-gradient-crimson text-crimson-foreground font-bold text-sm shadow-crimson">حفظ</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-navy mb-1.5 text-right">{label}</label>
      {children}
    </div>
  );
}
