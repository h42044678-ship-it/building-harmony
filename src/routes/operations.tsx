import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { MONTHS_AR } from "@/data/building";
import { useAppData, computeYearTotals, tenantMonthlyGrid, serviceMonthlyGrid } from "@/store/data";
import { ChevronRight, FileSpreadsheet, FileText, Archive } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState } from "react";

export const Route = createFileRoute("/operations")({
  head: () => ({
    meta: [
      { title: "التقارير — عقاري" },
      { name: "description", content: "تقارير الحساب السنوي للمستأجرين والمصروفات" },
    ],
  }),
  component: ReportsPage,
});

const fmt = (n: number) => n.toLocaleString("en-US");

function Cell({ v, vacated }: { v: number | null; vacated?: boolean }) {
  if (vacated)
    return (
      <td className="border border-border bg-crimson text-crimson-foreground font-bold text-center text-xs min-w-[78px]">
        غادر
      </td>
    );
  if (v === null || v === 0) return <td className="border border-border bg-white h-10 min-w-[78px]" />;
  return (
    <td className="border border-border bg-success-soft text-navy font-semibold text-center text-xs min-w-[78px] tabular-nums">
      {fmt(v)}
    </td>
  );
}

function ExpenseCell({ v }: { v: number | null }) {
  return (
    <td className="border border-border h-10 text-center text-xs tabular-nums min-w-[78px]">
      {v !== null && v !== 0 ? fmt(v) : ""}
    </td>
  );
}

function ReportsPage() {
  const liveData = useAppData();
  const [selectedYear, setSelectedYear] = useState(liveData.currentYear);

  // When viewing an archived year, source ALL data from the archive snapshot
  // so each year is shown completely independently (no data mixing).
  const archive = liveData.archives.find((a) => a.year === selectedYear);
  const data = archive ? archive.data : liveData;

  const tenantsForYear = data.tenants.filter((t) => {
    return new Date(t.entryDate).getFullYear() <= selectedYear;
  });

  // Decoupled: derive expense rows from transaction history (not from active services).
  const yearTxs = data.transactions.filter((t) => t.year === selectedYear);
  const expenseCategories = new Map<string, { id: string; label: string }>();
  for (const t of yearTxs) {
    if (t.type !== "expense") continue;
    if (t.category === "credit-add") continue;
    // Hide "credit-withdraw" from the report table — its amount is still
    // subtracted from the grand total below, but no row/label appears.
    if (t.category === "credit-withdraw") continue;
    if (!expenseCategories.has(t.category)) {
      const liveLabel = data.services.find((s) => s.id === t.category)?.label;
      expenseCategories.set(t.category, { id: t.category, label: liveLabel ?? t.categoryLabel });
    }
  }

  const tenantGrids = tenantsForYear.map((t) => ({
    tenant: t,
    months: tenantMonthlyGrid(t.id, selectedYear, data),
  }));

  const expenseGrids = Array.from(expenseCategories.values()).map((c) => ({
    service: c,
    months: serviceMonthlyGrid(c.id, selectedYear, data),
  }));

  const tenantTotals = MONTHS_AR.map((_, i) =>
    tenantGrids.reduce((sum, row) => {
      const v = row.months[i];
      return sum + (typeof v === "number" ? v : 0);
    }, 0)
  );
  const expenseTotals = MONTHS_AR.map((_, i) =>
    expenseGrids.reduce((sum, row) => sum + (row.months[i] ?? 0), 0)
  );
  const remaining = tenantTotals.map((t, i) => t - expenseTotals[i]);

  const statementTotal = remaining.reduce((a, b) => a + b, 0);
  // Hidden credit withdrawals: subtract from grand total without showing a row.
  const hiddenWithdrawTotal = yearTxs
    .filter((t) => t.category === "credit-withdraw")
    .reduce((s, t) => s + t.amount, 0);
  const yearCredits = yearTxs
    .filter((t) => t.category === "credit-add")
    .reduce((s, t) => s + t.amount, 0);
  const previousBalance = data.previousBalance + yearCredits;
  const grand = statementTotal + previousBalance - hiddenWithdrawTotal;

  const buildSheetRows = () => {
    const header = ["البيان", ...MONTHS_AR];
    const rows: (string | number)[][] = [header];
    tenantGrids.forEach(({ tenant, months }) => {
      const name = tenant.active ? tenant.fullName : `${tenant.fullName} (غادر)`;
      rows.push([name, ...months.map((c) => (c === "vacated" ? "غادر" : c ?? ""))]);
    });
    rows.push(["الإجمالي", ...tenantTotals.map((t) => (t > 0 ? t : ""))]);
    expenseGrids.forEach(({ service, months }) => {
      rows.push([service.label, ...months.map((c) => c ?? "")]);
    });
    rows.push(["المتبقي", ...remaining.map((r) => (r !== 0 ? r : ""))]);
    rows.push([]);
    rows.push(["إجمالي الكشف", statementTotal]);
    rows.push(["الرصيد السابق", previousBalance]);
    rows.push(["الإجمالي الشامل", grand]);
    return rows;
  };

  const exportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(buildSheetRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `تقرير ${selectedYear}`);
    XLSX.writeFile(wb, `aqari-report-${selectedYear}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const rows = buildSheetRows();
    doc.setFillColor(13, 27, 62);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`Aqari - Annual Report ${selectedYear}`, 40, 26);
    autoTable(doc, {
      head: [rows[0] as string[]],
      body: rows.slice(1).map((r) => r.map((c) => String(c ?? ""))),
      startY: 60,
      styles: { fontSize: 7, halign: "center", cellPadding: 4 },
      headStyles: { fillColor: [13, 27, 62], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didParseCell: (d) => {
        const raw = d.row.raw as unknown;
        const txt = Array.isArray(raw) ? String(raw[0] ?? "") : "";
        if (txt === "الإجمالي" || txt === "المتبقي") {
          d.cell.styles.fillColor = [16, 185, 129];
          d.cell.styles.textColor = 255;
          d.cell.styles.fontStyle = "bold";
        }
        if (txt === "الإجمالي الشامل") {
          d.cell.styles.fillColor = [220, 38, 38];
          d.cell.styles.textColor = 255;
          d.cell.styles.fontStyle = "bold";
        }
      },
    });
    doc.save(`aqari-report-${selectedYear}.pdf`);
  };

  const totals = computeYearTotals(selectedYear, data);
  void totals;

  const archiveYears = liveData.archives.map((a) => a.year);
  const yearOptions = Array.from(new Set([liveData.currentYear, ...archiveYears])).sort((a, b) => b - a);

  return (
    <MobileShell>
      <header className="bg-gradient-navy text-navy-foreground header-curve px-5 pt-6 pb-8 shadow-elevated">
        <div className="flex items-center justify-between">
          <button className="p-2 rounded-xl hover:bg-white/10">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-xs opacity-75">التقارير</div>
            <h1 className="text-lg font-extrabold">تقرير عام {selectedYear}</h1>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <section className="mx-4 -mt-4 space-y-3">
        {yearOptions.length > 1 && (
          <div className="bg-white rounded-2xl shadow-card border border-border p-2 flex items-center gap-2 overflow-x-auto">
            <Archive className="w-4 h-4 text-navy/60 shrink-0" />
            {yearOptions.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${selectedYear === y ? "bg-navy text-navy-foreground" : "bg-secondary text-navy"}`}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={exportPDF}
            className="bg-white rounded-2xl shadow-card p-3 flex items-center justify-center gap-2 font-bold text-navy active:scale-95 transition"
          >
            <FileText className="w-5 h-5 text-crimson" />
            تصدير PDF
          </button>
          <button
            onClick={exportExcel}
            className="bg-white rounded-2xl shadow-card p-3 flex items-center justify-center gap-2 font-bold text-navy active:scale-95 transition"
          >
            <FileSpreadsheet className="w-5 h-5 text-success" />
            تصدير Excel
          </button>
        </div>

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
                {tenantGrids.length === 0 && (
                  <tr><td colSpan={13} className="text-center text-muted-foreground py-6">لا يوجد مستأجرون لهذا العام</td></tr>
                )}
                {tenantGrids.map(({ tenant, months }) => (
                  <tr key={tenant.id} className={!tenant.active ? "bg-crimson/5" : ""}>
                    <td className={`sticky right-0 z-10 border border-border px-3 py-2 text-right font-semibold ${!tenant.active ? "bg-crimson/15 text-crimson" : "bg-secondary text-navy"}`}>
                      {tenant.fullName}{!tenant.active && " · غادر"}
                    </td>
                    {months.map((c, i) => (
                      <Cell key={i} v={typeof c === "number" ? c : null} vacated={c === "vacated"} />
                    ))}
                  </tr>
                ))}
                {tenantGrids.length > 0 && (
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
                )}
                {expenseGrids.map(({ service, months }) => (
                  <tr key={service.id}>
                    <td className="sticky right-0 bg-secondary/70 z-10 border border-border px-3 py-2 text-right text-navy">
                      {service.label}
                    </td>
                    {months.map((c, i) => <ExpenseCell key={i} v={c} />)}
                  </tr>
                ))}
                {tenantGrids.length > 0 && (
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
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <SummaryRow label="إجمالي الكشف" value={statementTotal} />
          <SummaryRow label="رصيد سابق" value={previousBalance} />
          <SummaryRow label="الإجمالي الشامل" value={grand} highlight />
        </div>

        {/* Per-tenant statements */}
        {tenantGrids.length > 0 && (
          <div className="mt-4">
            <h3 className="font-extrabold text-navy text-sm mb-2">كشف حساب فردي</h3>
            <div className="space-y-2">
              {tenantGrids.map(({ tenant, months }) => (
                <TenantStatementButton key={tenant.id} tenantName={tenant.fullName} year={selectedYear} months={months} monthlyRent={tenant.monthlyRent} />
              ))}
            </div>
          </div>
        )}
      </section>
    </MobileShell>
  );
}

function TenantStatementButton({ tenantName, year, months, monthlyRent }: { tenantName: string; year: number; months: (number | "vacated" | null)[]; monthlyRent: number }) {
  const exportTenantPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(`Tenant Statement ${year}`, 40, 30);
    doc.text(tenantName, 40, 50);
    autoTable(doc, {
      head: [["Month", "Amount"]],
      body: MONTHS_AR.map((m, i) => [m, months[i] === "vacated" ? "غادر" : months[i] ? fmt(Number(months[i])) : "-"]),
      startY: 70,
      styles: { fontSize: 9, halign: "center" },
      headStyles: { fillColor: [13, 27, 62] },
    });
    doc.save(`tenant-${tenantName}-${year}.pdf`);
  };
  const total = months.reduce((s: number, v) => s + (typeof v === "number" ? v : 0), 0);
  const due = monthlyRent * 12;
  const remaining = Math.max(0, due - total);
  return (
    <div className="bg-white rounded-2xl border border-border p-3 flex items-center justify-between">
      <div className="text-right">
        <div className="text-sm font-bold text-navy">{tenantName}</div>
        <div className="text-[11px] text-muted-foreground">مدفوع: {fmt(total)} · متبقي: {fmt(remaining)} ر.ي</div>
      </div>
      <button onClick={exportTenantPDF} className="px-3 py-2 bg-secondary rounded-xl text-xs font-bold text-navy">
        <FileText className="w-4 h-4 inline ml-1" /> كشف PDF
      </button>
    </div>
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
