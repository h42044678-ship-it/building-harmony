import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useState } from "react";
import {
  HandCoins, Droplets, Wrench, Landmark, UserSquare2, UserCheck, Plus, X, type LucideIcon,
  Receipt, Zap, Flame, Wifi, ShieldCheck, Trash2, Hammer, Paintbrush, Building, Home,
} from "lucide-react";

interface Service {
  id: string;
  label: string;
  iconKey: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  HandCoins, Droplets, Wrench, Landmark, UserSquare2, UserCheck,
  Receipt, Zap, Flame, Wifi, ShieldCheck, Trash2, Hammer, Paintbrush, Building, Home,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const DEFAULT_SERVICES: Service[] = [
  { id: "rent", label: "دفع الإيجار", iconKey: "HandCoins" },
  { id: "sewage", label: "الصرف الصحي", iconKey: "Droplets" },
  { id: "plumb", label: "السباكة وإصلاحات", iconKey: "Wrench" },
  { id: "tax", label: "ضريبة العقار", iconKey: "Landmark" },
  { id: "broker", label: "أجر سمسار", iconKey: "UserSquare2" },
  { id: "hussein", label: "مسلم بيد حسين", iconKey: "UserCheck" },
];

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "الخدمات — عمارة المنصور" }] }),
  component: ServicesPage,
});

function ServicesPage() {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [iconKey, setIconKey] = useState<string>("Receipt");

  const addService = () => {
    if (!label.trim()) return;
    setServices((s) => [...s, { id: crypto.randomUUID(), label: label.trim(), iconKey }]);
    setLabel("");
    setIconKey("Receipt");
    setOpen(false);
  };

  return (
    <MobileShell>
      <header className="bg-gradient-navy text-navy-foreground header-curve px-5 pt-8 pb-10 text-center shadow-elevated">
        <h1 className="text-xl font-extrabold">الخدمات</h1>
        <p className="text-xs opacity-75 mt-1">جميع خدمات إدارة العقار</p>
      </header>

      <section className="mx-4 mt-6 mb-28">
        <div className="grid grid-cols-3 gap-3">
          {services.map((s) => {
            const Icon = ICON_MAP[s.iconKey] ?? Receipt;
            return (
              <button
                key={s.id}
                className="bg-secondary/70 rounded-2xl p-3 aspect-square flex flex-col items-center justify-center gap-2 hover:shadow-card active:scale-95 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-white grid place-items-center shadow-card">
                  <Icon className="w-6 h-6 text-crimson" strokeWidth={1.6} />
                </div>
                <div className="text-[11px] font-semibold text-navy leading-tight text-center">
                  {s.label}
                </div>
              </button>
            );
          })}
          <button
            onClick={() => setOpen(true)}
            className="rounded-2xl p-3 aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-navy/30 text-navy/70 hover:border-crimson hover:text-crimson active:scale-95 transition"
          >
            <Plus className="w-7 h-7" />
            <div className="text-[11px] font-semibold leading-tight text-center">إضافة خدمة</div>
          </button>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm grid place-items-end sm:place-items-center" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-elevated"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-navy text-lg">إضافة خدمة جديدة</h2>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-secondary">
                <X className="w-5 h-5 text-navy" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-navy mb-2">اسم الخدمة</label>
            <input
              dir="rtl"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="مثال: فاتورة الكهرباء"
              className="w-full bg-secondary/70 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-crimson"
            />

            <label className="block text-xs font-semibold text-navy mt-4 mb-2">اختر الأيقونة</label>
            <div className="grid grid-cols-6 gap-2 max-h-44 overflow-y-auto p-1">
              {ICON_OPTIONS.map((key) => {
                const Icon = ICON_MAP[key];
                const active = iconKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setIconKey(key)}
                    className={`aspect-square rounded-xl grid place-items-center transition ${active ? "bg-crimson text-crimson-foreground shadow-crimson" : "bg-secondary/70 text-navy hover:bg-secondary"}`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>

            <button
              onClick={addService}
              className="mt-5 w-full bg-gradient-crimson text-crimson-foreground rounded-2xl py-3 font-bold shadow-crimson active:scale-[.98] transition"
            >
              إضافة الخدمة
            </button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
