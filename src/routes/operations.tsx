import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { MONTHS_AR } from "@/data/building";
import { useAppData, computeYearTotals, tenantMonthlyGrid, serviceMonthlyGrid } from "@/store/data";
import { ChevronRight, FileSpreadsheet, FileText, Archive } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { useRef, useState } from "react";

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
  const reportRef = useRef<HTMLDivElement>(null);

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

  // Color palette mirroring the app theme (matches tailwind tokens visually).
  const COLOR = {
    navy: "0D1B3E",
    navyText: "FFFFFF",
    secondary: "F1F4F9",
    navyDark: "0D1B3E",
    success: "10B981",
    successSoft: "DCFCE7",
    crimson: "DC2626",
    crimsonSoft: "FEE2E2",
    grandRed: "B91C1C",
    border: "C9D1DC",
  };

  const cellStyle = (
    bg: string,
    color = "000000",
    bold = false,
    align: "center" | "right" = "center",
  ) => ({
    fill: { patternType: "solid", fgColor: { rgb: bg } },
    font: { name: "Arial", color: { rgb: color }, bold, sz: 10 },
    alignment: { horizontal: align, vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: COLOR.border } },
      bottom: { style: "thin", color: { rgb: COLOR.border } },
      left: { style: "thin", color: { rgb: COLOR.border } },
      right: { style: "thin", color: { rgb: COLOR.border } },
    },
  });

  const exportExcel = () => {
    const wsRows: { v: string | number; s: object }[][] = [];

    // header row: name + months
    wsRows.push([
      { v: "البيان", s: cellStyle(COLOR.navy, COLOR.navyText, true) },
      ...MONTHS_AR.map((m) => ({ v: m, s: cellStyle(COLOR.navy, COLOR.navyText, true) })),
    ]);

    // tenant rows
    tenantGrids.forEach(({ tenant, months }) => {
      const name = tenant.active ? tenant.fullName : `${tenant.fullName} · غادر`;
      const labelBg = tenant.active ? COLOR.secondary : COLOR.crimsonSoft;
      const labelFg = tenant.active ? "0D1B3E" : COLOR.crimson;
      const row: { v: string | number; s: object }[] = [
        { v: name, s: cellStyle(labelBg, labelFg, true, "right") },
      ];
      months.forEach((c) => {
        if (c === "vacated") row.push({ v: "غادر", s: cellStyle(COLOR.crimson, "FFFFFF", true) });
        else if (typeof c === "number" && c > 0) row.push({ v: c, s: cellStyle(COLOR.successSoft, "0D1B3E", true) });
        else row.push({ v: "", s: cellStyle("FFFFFF") });
      });
      wsRows.push(row);
    });

    // totals row
    if (tenantGrids.length > 0) {
      wsRows.push([
        { v: "الإجمالي", s: cellStyle(COLOR.navy, COLOR.navyText, true, "right") },
        ...tenantTotals.map((t) => ({
          v: t > 0 ? t : "",
          s: cellStyle("E2E8F0", "0D1B3E", true),
        })),
      ]);
    }

    // expense rows
    expenseGrids.forEach(({ service, months }) => {
      const row: { v: string | number; s: object }[] = [
        { v: service.label, s: cellStyle(COLOR.secondary, "0D1B3E", false, "right") },
      ];
      months.forEach((c) => {
        row.push({ v: c ?? "", s: cellStyle("FFFFFF") });
      });
      wsRows.push(row);
    });

    // remaining row (success row)
    if (tenantGrids.length > 0) {
      wsRows.push([
        { v: "المتبقي", s: cellStyle(COLOR.success, "FFFFFF", true, "right") },
        ...remaining.map((r) => ({
          v: r !== 0 ? r : "",
          s: cellStyle(COLOR.successSoft, "0D1B3E", true),
        })),
      ]);
    }

    // spacer + summary rows
    wsRows.push([]);
    wsRows.push([
      { v: "إجمالي الكشف", s: cellStyle("FFFFFF", "0D1B3E", true, "right") },
      { v: statementTotal, s: cellStyle("FFFFFF", "0D1B3E", true) },
    ]);
    wsRows.push([
      { v: "الرصيد السابق", s: cellStyle("FFFFFF", "0D1B3E", true, "right") },
      { v: previousBalance, s: cellStyle("FFFFFF", "0D1B3E", true) },
    ]);
    wsRows.push([
      { v: "الإجمالي الشامل", s: cellStyle(COLOR.grandRed, "FFFFFF", true, "right") },
      { v: grand, s: cellStyle(COLOR.grandRed, "FFFFFF", true) },
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsRows.map((r) => r.map((c) => (c ? c.v : ""))));
    // re-apply styled cells (xlsx-js-style)
    wsRows.forEach((r, ri) => {
      r.forEach((c, ci) => {
        if (!c) return;
        const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
        (ws as Record<string, unknown>)[addr] = { v: c.v, s: c.s, t: typeof c.v === "number" ? "n" : "s" };
      });
    });
    ws["!cols"] = [{ wch: 22 }, ...MONTHS_AR.map(() => ({ wch: 12 }))];
    (ws as Record<string, unknown>)["!views"] = [{ RTL: true }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `تقرير ${selectedYear}`);
    XLSX.writeFile(wb, `aqari-report-${selectedYear}.xlsx`);
  };

  const exportPDF = async () => {
    const node = reportRef.current;
    if (!node) return;
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth: node.scrollWidth,
    });
    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    // Header band matching app navy
    doc.setFillColor(13, 27, 62);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`Aqari - Annual Report ${selectedYear}`, 40, 26);

    const margin = 20;
    const availW = pageW - margin * 2;
    const ratio = canvas.height / canvas.width;
    const imgW = availW;
    const imgH = imgW * ratio;
    const startY = 50;
    // single page if it fits
    if (imgH + startY <= pageH - margin) {
      doc.addImage(imgData, "PNG", margin, startY, imgW, imgH);
    } else {
      // paginate by slicing
      const pxPerPt = canvas.width / imgW;
      const sliceHeightPt = pageH - startY - margin;
      const sliceHeightPx = sliceHeightPt * pxPerPt;
      let y = 0;
      let first = true;
      while (y < canvas.height) {
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(sliceHeightPx, canvas.height - y);
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, y, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
        if (!first) {
          doc.addPage();
          doc.setFillColor(13, 27, 62);
          doc.rect(0, 0, pageW, 40, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.text(`Aqari - Annual Report ${selectedYear}`, 40, 26);
        }
        doc.addImage(
          sliceCanvas.toDataURL("image/png"),
          "PNG",
          margin,
          startY,
          imgW,
          (sliceCanvas.height / pxPerPt),
        );
        y += sliceCanvas.height;
        first = false;
      }
    }
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
