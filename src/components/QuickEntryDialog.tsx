import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAppData, dataActions } from "@/store/data";
import { TrendingUp, TrendingDown } from "lucide-react";

export function QuickEntryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const data = useAppData();
  const [serviceId, setServiceId] = useState<string>("rent");
  const [tenantQuery, setTenantQuery] = useState("");
  const [tenantId, setTenantId] = useState<string | undefined>();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const service = data.services.find((s) => s.id === serviceId) ?? data.services[0];
  const isRent = service?.id === "rent";

  const suggestions = useMemo(() => {
    const q = tenantQuery.trim();
    if (!q) return [] as typeof data.tenants;
    return data.tenants.filter((t) => t.active && t.fullName.includes(q)).slice(0, 5);
  }, [tenantQuery, data.tenants]);

  const reset = () => { setServiceId("rent"); setTenantQuery(""); setTenantId(undefined); setAmount(""); setNote(""); setErr(null); };

  const submit = () => {
    setErr(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) return setErr("المبلغ غير صحيح");
    if (isRent && !tenantId) return setErr("اختر المستأجر");
    if (!service) return;
    dataActions.addTransaction({
      type: service.kind,
      category: service.id,
      categoryLabel: service.label,
      amount: amt,
      tenantId: isRent ? tenantId : undefined,
      note: note || undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-right">إدخال عملية سريعة</DialogTitle>
          <DialogDescription className="text-right">سجّل دخلاً أو مصروفاً جديداً.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5 text-right">نوع العملية</label>
            <select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setTenantId(undefined); setTenantQuery(""); }} className="w-full bg-secondary rounded-xl px-3 py-3 text-sm outline-none">
              {data.services.map((s) => (
                <option key={s.id} value={s.id}>{s.label} {s.kind === "income" ? "(دخل)" : "(مصروف)"}</option>
              ))}
            </select>
          </div>

          {isRent && (
            <div className="relative">
              <label className="block text-xs font-semibold text-navy mb-1.5 text-right">المستأجر</label>
              <input
                dir="rtl" value={tenantQuery}
                onChange={(e) => { setTenantQuery(e.target.value); setTenantId(undefined); }}
                placeholder="ابدأ بكتابة اسم المستأجر..."
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none"
              />
              {suggestions.length > 0 && !tenantId && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-border rounded-xl shadow-card max-h-40 overflow-y-auto">
                  {suggestions.map((t) => (
                    <button key={t.id} onClick={() => { setTenantId(t.id); setTenantQuery(t.fullName); setAmount(String(t.monthlyRent)); }} className="w-full text-right px-4 py-2 text-sm hover:bg-secondary">
                      {t.fullName} <span className="text-[11px] text-muted-foreground">· {t.monthlyRent.toLocaleString()} ر.ي</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5 text-right">المبلغ (ر.ي)</label>
            <input dir="ltr" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5 text-right">ملاحظة (اختياري)</label>
            <input dir="rtl" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          {err && <div className="text-xs text-crimson text-center">{err}</div>}
          <div className={`text-xs font-bold text-center ${service?.kind === "income" ? "text-success" : "text-crimson"}`}>
            {service?.kind === "income" ? <><TrendingUp className="w-4 h-4 inline" /> دخل</> : <><TrendingDown className="w-4 h-4 inline" /> مصروف</>}
          </div>
        </div>
        <DialogFooter>
          <button onClick={submit} className="w-full bg-gradient-crimson text-crimson-foreground rounded-2xl py-3 font-bold shadow-crimson">حفظ العملية</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
