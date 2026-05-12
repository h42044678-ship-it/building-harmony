export type ApartmentStatus = "paid" | "unpaid" | "vacant";

export interface Apartment {
  id: string;
  floor: number;
  unit: number; // 1 or 2
  tenantFirst?: string;
  tenantLast?: string;
  monthlyRent: number;
  status: ApartmentStatus;
}

export const APARTMENTS: Apartment[] = [
  { id: "3A", floor: 3, unit: 1, tenantFirst: "صالح", tenantLast: "ناصر المشفق", monthlyRent: 50000, status: "paid" },
  { id: "3B", floor: 3, unit: 2, tenantFirst: "ياسر", tenantLast: "محمد الجنوبي", monthlyRent: 55000, status: "paid" },
  { id: "2A", floor: 2, unit: 1, tenantFirst: "عبدالخالق", tenantLast: "الوهبي", monthlyRent: 55000, status: "unpaid" },
  { id: "2B", floor: 2, unit: 2, tenantFirst: "أحمد", tenantLast: "محمد الشيخ", monthlyRent: 55000, status: "paid" },
  { id: "1A", floor: 1, unit: 1, tenantFirst: "قاسم", tenantLast: "علي الحميري", monthlyRent: 55000, status: "unpaid" },
  { id: "1B", floor: 1, unit: 2, monthlyRent: 0, status: "vacant" },
];

export const MONTHS_AR = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export type Cell = number | "vacated" | null;

export interface TenantRow {
  name: string;
  months: Cell[]; // length 12
}

export const TENANT_ROWS: TenantRow[] = [
  { name: "صالح ناصر المشفق", months: [50000,50000,50000,50000,50000,null,null,null,null,null,null,null] },
  { name: "ياسر محمد الجنوبي", months: [55000,55000,55000,55000,30000,55000,null,null,null,null,null,null] },
  { name: "عبدالخالق الوهبي", months: [50000,55000,55000,55000,55000,55000,19000,null,null,null,null,null] },
  { name: "أحمد محمد الشيخ", months: [null,null,null,null,55000,55000,55000,55000,null,null,null,null] },
  { name: "قاسم علي الحميري", months: [null,null,null,null,55000,52000,"vacated",null,null,null,null,null] },
  { name: "عبدالناصر جبران", months: [null,null,null,null,null,null,null,null,null,null,null,null] },
];

export interface ExpenseRow {
  name: string;
  months: (number | null)[];
}

export const EXPENSE_ROWS: ExpenseRow[] = [
  { name: "صرف صحي / شفط", months: [null,null,75000,null,null,null,null,75000,null,null,null,null] },
  { name: "سباكة وإصلاح", months: [null,null,null,null,null,null,null,23000,null,null,null,null] },
  { name: "مسحوبات عبركم", months: [null,null,70000,30000,null,10000,null,null,null,null,null,null] },
  { name: "مسحوبات عبرنا", months: [null,null,null,null,20000,null,null,null,null,null,null,null] },
  { name: "ضريبة العقار", months: [125000,null,null,null,null,null,null,null,null,null,null,null] },
  { name: "سمسار", months: [null,10000,null,10000,null,10000,null,null,null,null,null,null] },
  { name: "مسلم بيد حسين", months: [30000,null,500000,null,null,null,500000,90000,null,null,null,null] },
];

export const PREVIOUS_BALANCE = 384000;
