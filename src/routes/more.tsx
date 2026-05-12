import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Bot, Sparkles, FileText, Settings, Shield, HelpCircle, LogOut } from "lucide-react";

export const Route = createFileRoute("/more")({
  head: () => ({ meta: [{ title: "المزيد — عمارة المنصور" }] }),
  component: MorePage,
});

function MorePage() {
  return (
    <MobileShell>
      <header className="bg-gradient-navy text-navy-foreground header-curve px-5 pt-8 pb-10 text-center shadow-elevated">
        <h1 className="text-xl font-extrabold">المزيد</h1>
        <p className="text-xs opacity-75 mt-1">الإعدادات والمساعد الذكي</p>
      </header>

      <section className="mx-4 -mt-4">
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
          <button className="mt-4 w-full bg-white text-crimson font-bold rounded-xl py-2.5 text-sm">
            بدء المحادثة
          </button>
        </div>

        <div className="mt-5 bg-white rounded-2xl shadow-card border border-border divide-y divide-border">
          {[
            { i: FileText, l: "التقارير والكشوفات" },
            { i: Settings, l: "الإعدادات" },
            { i: Shield, l: "الأمان والخصوصية" },
            { i: HelpCircle, l: "المساعدة" },
            { i: LogOut, l: "تسجيل الخروج" },
          ].map(({ i: Icon, l }) => (
            <button key={l} className="w-full flex items-center gap-3 px-4 py-3.5 text-right hover:bg-secondary/50 transition">
              <Icon className="w-5 h-5 text-navy" />
              <span className="flex-1 font-semibold text-sm text-navy">{l}</span>
              <span className="text-muted-foreground">›</span>
            </button>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
