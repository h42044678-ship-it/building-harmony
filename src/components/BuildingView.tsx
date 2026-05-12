import { APARTMENTS, type Apartment } from "@/data/building";
import { AlertCircle, CheckCircle2, Plus, DoorClosed } from "lucide-react";

function ApartmentCard({ a }: { a: Apartment }) {
  if (a.status === "vacant") {
    return (
      <button className="apt-vacant rounded-2xl p-3 h-24 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-navy transition">
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
    <div className={`${isPaid ? "apt-paid" : "apt-unpaid"} rounded-2xl p-3 h-24 flex flex-col justify-between transition`}>
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
    </div>
  );
}

export function BuildingView() {
  const floors = [3, 2, 1];
  return (
    <section className="mx-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-extrabold text-navy text-lg">العمارة</h2>
        <span className="text-xs text-muted-foreground">٣ طوابق · ٦ شقق</span>
      </div>
      <div className="bg-secondary/60 rounded-3xl p-3 shadow-card border border-border space-y-2">
        {floors.map((f) => {
          const units = APARTMENTS.filter((a) => a.floor === f);
          return (
            <div key={f} className="relative">
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-navy/50 rotate-90 origin-center">
                ط{f}
              </div>
              <div className="grid grid-cols-2 gap-2 px-4">
                {units.map((a) => <ApartmentCard key={a.id} a={a} />)}
              </div>
            </div>
          );
        })}
        <div className="h-3 bg-gradient-navy rounded-b-2xl rounded-t-md mt-2 opacity-90" />
      </div>
    </section>
  );
}
