import { Banknote, Store, Tv, CreditCard } from "lucide-react";

const items = [
  { icon: Banknote, label: "سحب نقدي", sub: "ATM" },
  { icon: Store, label: "مشتريات" },
  { icon: Tv, label: "ترفيه" },
  { icon: CreditCard, label: "بطاقات افتراضية" },
];

export function QuickServices() {
  return (
    <div className="bg-white rounded-2xl shadow-elevated px-3 py-4 mx-4 -mt-14 relative z-10 grid grid-cols-4 gap-2">
      {items.map(({ icon: Icon, label, sub }) => (
        <button key={label} className="flex flex-col items-center gap-1.5 py-1 active:scale-95 transition">
          <div className="w-11 h-11 grid place-items-center text-crimson">
            <Icon className="w-7 h-7" strokeWidth={1.6} />
          </div>
          <div className="text-[11px] font-medium text-foreground leading-tight text-center">
            {label}
            {sub && <div className="text-[10px] opacity-70">{sub}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}
