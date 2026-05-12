import { Users, ArrowLeftRight, FileText, Wallet, HandCoins, Globe, Receipt, Building, Smartphone, MapPin, Banknote, QrCode } from "lucide-react";
import { Link } from "@tanstack/react-router";

const actions = [
  { icon: Users, label: "المستأجرون" },
  { icon: ArrowLeftRight, label: "تحويل أموال" },
  { icon: FileText, label: "سداد فواتير" },
  { icon: Wallet, label: "محافظ وبنوك" },
  { icon: HandCoins, label: "سحب وإيداع" },
  { icon: Globe, label: "حوالات نقدية" },
  { icon: Receipt, label: "كود تحويل" },
  { icon: Banknote, label: "تحويل لمشترك" },
  { icon: Building, label: "مدفوعات حكومية" },
  { icon: Smartphone, label: "فواتير الموبايل" },
  { icon: QrCode, label: "استلام حوالة" },
  { icon: MapPin, label: "شبكات محلية" },
];

export function QuickActions() {
  return (
    <section className="mx-4 mt-6 mb-28">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-extrabold text-navy text-lg">خدمات سريعة</h2>
        <Link to="/" className="text-xs text-crimson font-semibold flex items-center gap-1">⋯ تعديل</Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {actions.map(({ icon: Icon, label }) => (
          <button key={label} className="bg-secondary/70 rounded-2xl p-3 aspect-square flex flex-col items-center justify-center gap-2 hover:shadow-card active:scale-95 transition">
            <div className="w-12 h-12 rounded-xl bg-white grid place-items-center shadow-card">
              <Icon className="w-6 h-6 text-crimson" strokeWidth={1.5} />
            </div>
            <div className="text-[11px] font-semibold text-navy leading-tight text-center">{label}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
