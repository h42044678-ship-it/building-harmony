import { useState } from "react";
import { useApartments, exitTenant } from "@/store/apartments";
import type { Apartment } from "@/data/building";
import { AlertCircle, CheckCircle2, Plus, DoorClosed, X, CalendarDays, Wallet, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function monthsSince(iso?: string) {
  if (!iso) return 0;
  const d = new Date(iso);
  const now = new Date();
  return Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
}

function ApartmentCard({ a, onClick }: { a: Apartment; onClick: () => void }) {
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
  const [selected, setSelected] = useState<Apartment | null>(null);
  const floors = [3, 2, 1];

  const elapsed = selected ? monthsSince(selected.entryDate) : 0;
  const paid = selected?.paidMonths ?? 0;
  const remainingMonths = Math.max(0, elapsed - paid);
  const remainingAmount = remainingMonths * (selected?.monthlyRent ?? 0);

  return (
    <section className="mx-4 mt-6">
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
                  <ApartmentCard key={a.id} a={a} onClick={() => setSelected(a)} />
                ))}
              </div>
            </div>
          );
        })}
        <div className="h-3 bg-gradient-navy rounded-b-2xl rounded-t-md mt-2 opacity-90" />
      </div>

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
                <Row icon={<CheckCircle2 className="w-4 h-4 text-success" />} label="الأشهر المسددة" value={`${paid} شهر`} />
                <div className="bg-secondary/60 rounded-2xl p-3 border border-border">
                  <div className="text-xs text-muted-foreground">المتبقي على المستأجر</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-2xl font-extrabold text-crimson">
                      {remainingAmount.toLocaleString("en-US")} <span className="text-sm font-semibold">ر.ي</span>
                    </div>
                    <div className="text-xs text-navy/70">{remainingMonths} شهر</div>
                  </div>
                </div>
                <Row icon={<Phone className="w-4 h-4" />} label="رقم الهاتف" value="—" />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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
