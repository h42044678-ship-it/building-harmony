import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { MONTHS_AR, TENANT_ROWS, EXPENSE_ROWS, PREVIOUS_BALANCE } from "@/data/building";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/operations")({
  head: () => ({
    meta: [
      { title: "كشف حساب العمارة 2026" },
      { name: "description", content: "كشف الحساب السنوي للمستأجرين والمصروفات" },
    ],
  }),
  component: OperationsPage,
});

const fmt = (n: number) => n.toLocaleString("en-US");

function Cell({ v }: { v: number | "vacated" | null }) {
  if (v === null) return <td className="border border-border bg-white h-10 min-w-[78px]" />;
  if (v === "vacated")
    return (
      <td className="border border-border bg-crimson text-crimson-foreground font-bold text-center text-xs min-w-[78px]">
        غادر
      </td>
    );
  return (
    <td className="border border-border bg-success-soft text-navy font-semibold text-center text-xs min-w-[78px] tabular-nums">
      {fmt(v)}
    </td>
  );
}

function ExpenseCell({ v }: { v: number | null }) {
  return (
    <td className="border border-border h-10 text-center text-xs tabular-nums min-w-[78px]">
      {v !== null ? fmt(v) : ""}
    </td>
  );
}

function OperationsPage() {
  const tenantTotals = MONTHS_AR.map((_, i) =>
    TENANT_ROWS.reduce((s, r) => s + (typeof r.months[i] === "number" ? (r.months[i] as number) : 0), 0)
  );
  const expenseTotals = MONTHS_AR.map((_, i) =>
    EXPENSE_ROWS.reduce((s, r) => s + (r.months[i] ?? 0), 0)
  );
  const remaining = tenantTotals.map((t, i) => t - expenseTotals[i]);

  const statementTotal = remaining.reduce((a, b) => a + b, 0);
  const grand = statementTotal + PREVIOUS_BALANCE;

  return (
    <MobileShell>
      <header className="bg-gradient-navy text-navy-foreground header-curve px-5 pt-6 pb-8 shadow-elevated">
        <div className="flex items-center justify-between">
          <button className="p-2 rounded-xl hover:bg-white/10">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-xs opacity-75">العمليات</div>
            <h1 className="text-lg font-extrabold">كشف حساب العمارة 2026</h1>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <section className="mx-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-elevated p-2 overflow-hidden">
          <div className="overflow-x-auto" dir="rtl">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="sticky right-0 bg-navy text-navy-foreground z-10 border border-navy-deep px-3 py-2 text-right min-w-[140px]">
                    الاسم
                  </th>
                  {MONTHS_AR.map((m) => (
                    <th key={m} className="bg-navy text-navy-foreground border border-navy-deep px-2 py-2 font-semibold min-w-[78px]">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TENANT_ROWS.map((row) => (
                  <tr key={row.name}>
                    <td className="sticky right-0 bg-secondary z-10 border border-border px-3 py-2 text-right font-semibold text-navy">
                      {row.name}
                    </td>
                    {row.months.map((c, i) => <Cell key={i} v={c} />)}
                  </tr>
                ))}
                <tr>
                  <td className="sticky right-0 bg-navy/90 text-navy-foreground z-10 border border-navy-deep px-3 py-2 text-right font-bold">
                    الإجمالي
                  </td>
                  {tenantTotals.map((t, i) => (
                    <td key={i} className="border border-border bg-navy/10 text-navy font-bold text-center text-xs tabular-nums min-w-[78px]">
                      {t > 0 ? fmt(t) : "-"}
                    </td>
                  ))}
                </tr>

                {EXPENSE_ROWS.map((row) => (
                  <tr key={row.name}>
                    <td className="sticky right-0 bg-secondary/70 z-10 border border-border px-3 py-2 text-right text-navy">
                      {row.name}
                    </td>
                    {row.months.map((c, i) => <ExpenseCell key={i} v={c} />)}
                  </tr>
                ))}

                <tr>
                  <td className="sticky right-0 bg-success/90 text-success-foreground z-10 border border-success px-3 py-2 text-right font-bold">
                    المتبقي
                  </td>
                  {remaining.map((r, i) => (
                    <td key={i} className="border border-border bg-success-soft text-navy font-bold text-center text-xs tabular-nums min-w-[78px]">
                      {r !== 0 ? fmt(r) : "-"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <SummaryRow label="إجمالي الكشف" value={statementTotal} />
          <SummaryRow label="رصيد سابق" value={PREVIOUS_BALANCE} />
          <SummaryRow label="الإجمالي الشامل" value={grand} highlight />
        </div>
      </section>
    </MobileShell>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${
        highlight
          ? "bg-gradient-crimson text-crimson-foreground border-transparent shadow-crimson"
          : "bg-white border-border shadow-card"
      }`}
    >
      <span className={`font-bold ${highlight ? "" : "text-navy"}`}>{label}</span>
      <span className="text-lg font-extrabold tabular-nums">
        {fmt(value)} <span className="text-xs opacity-80">ر.ي</span>
      </span>
    </div>
  );
}
