import { useSyncExternalStore } from "react";

// ============ Types ============
export type ApartmentStatus = "occupied" | "vacant";

export interface Tenant {
  id: string;
  fullName: string;
  phone?: string;
  monthlyRent: number;
  entryDate: string; // ISO
  exitDate?: string; // ISO when exited
  apartmentId: string;
  active: boolean;
  extraCredit?: number; // credit balance (overpayment) for tenant
}

export interface Apartment {
  id: string;
  floor: number;
  unit: number;
  currentTenantId?: string;
}

export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxType;
  category: string; // service id or label
  categoryLabel: string;
  tenantId?: string;
  tenantName?: string;
  amount: number;
  date: string; // ISO
  year: number;
  month: number; // 0-11
  note?: string;
}

export interface ServiceDef {
  id: string;
  label: string;
  iconKey: string;
  kind: TxType;
  builtin?: boolean;
}

export interface YearArchive {
  year: number;
  data: AppData;
  archivedAt: string;
}

export interface AppData {
  apartments: Apartment[];
  tenants: Tenant[];
  transactions: Transaction[];
  services: ServiceDef[];
  previousBalance: number; // carry-over from prior years
  currentYear: number;
  archives: YearArchive[];
}

// ============ Defaults ============
const DEFAULT_APARTMENTS: Apartment[] = [
  { id: "3A", floor: 3, unit: 1 },
  { id: "3B", floor: 3, unit: 2 },
  { id: "2A", floor: 2, unit: 1 },
  { id: "2B", floor: 2, unit: 2 },
  { id: "1A", floor: 1, unit: 1 },
  { id: "1B", floor: 1, unit: 2 },
];

export const DEFAULT_SERVICES: ServiceDef[] = [
  { id: "rent", label: "دفع الإيجار", iconKey: "HandCoins", kind: "income", builtin: true },
  { id: "sewage", label: "الصرف الصحي", iconKey: "Droplets", kind: "expense", builtin: true },
  { id: "plumb", label: "السباكة وإصلاحات", iconKey: "Wrench", kind: "expense", builtin: true },
  { id: "tax", label: "ضريبة العقار", iconKey: "Landmark", kind: "expense", builtin: true },
  { id: "broker", label: "أجر سمسار", iconKey: "UserSquare2", kind: "expense", builtin: true },
  { id: "hussein", label: "مسلم بيد حسين", iconKey: "UserCheck", kind: "expense", builtin: true },
];

const INITIAL_DATA: AppData = {
  apartments: DEFAULT_APARTMENTS,
  tenants: [],
  transactions: [],
  services: DEFAULT_SERVICES,
  previousBalance: 0,
  currentYear: new Date().getFullYear(),
  archives: [],
};

const STORAGE_KEY = "aqari-data-v1";

// ============ Persistence ============
function loadFromStorage(): AppData {
  if (typeof window === "undefined") return INITIAL_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_DATA;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      apartments: parsed.apartments?.length ? parsed.apartments : DEFAULT_APARTMENTS,
      tenants: parsed.tenants ?? [],
      transactions: parsed.transactions ?? [],
      services: parsed.services?.length ? parsed.services : DEFAULT_SERVICES,
      previousBalance: parsed.previousBalance ?? 0,
      currentYear: parsed.currentYear ?? new Date().getFullYear(),
      archives: parsed.archives ?? [],
    };
  } catch {
    return INITIAL_DATA;
  }
}

let state: AppData = typeof window !== "undefined" ? loadFromStorage() : INITIAL_DATA;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("persist failed", e);
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const getSnapshot = () => state;

export function useAppData() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ============ Helpers ============
function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getActiveTenantOfApartment(apt: Apartment, tenants: Tenant[]): Tenant | undefined {
  if (!apt.currentTenantId) return undefined;
  return tenants.find((t) => t.id === apt.currentTenantId && t.active);
}

export function monthsBetween(fromIso: string, toDate: Date = new Date()) {
  const d = new Date(fromIso);
  return Math.max(0, (toDate.getFullYear() - d.getFullYear()) * 12 + (toDate.getMonth() - d.getMonth()) + 1);
}

export function tenantPaidAmount(tenantId: string, txs: Transaction[]) {
  return txs
    .filter((t) => t.tenantId === tenantId && t.category === "rent")
    .reduce((s, t) => s + t.amount, 0);
}

export function tenantDue(tenant: Tenant, txs: Transaction[]) {
  const elapsedMonths = monthsBetween(tenant.entryDate);
  const totalDue = elapsedMonths * tenant.monthlyRent;
  const paid = tenantPaidAmount(tenant.id, txs);
  const remaining = Math.max(0, totalDue - paid);
  return { elapsedMonths, totalDue, paid, remaining };
}

// ============ Mutations ============
export const dataActions = {
  addTenant(input: { fullName: string; phone?: string; monthlyRent: number; entryDate: string; apartmentId: string }) {
    const id = uid();
    const tenant: Tenant = {
      id,
      fullName: input.fullName.trim(),
      phone: input.phone?.trim() || undefined,
      monthlyRent: input.monthlyRent,
      entryDate: input.entryDate,
      apartmentId: input.apartmentId,
      active: true,
      extraCredit: 0,
    };
    state = {
      ...state,
      tenants: [...state.tenants, tenant],
      apartments: state.apartments.map((a) => (a.id === input.apartmentId ? { ...a, currentTenantId: id } : a)),
    };
    emit();
    return tenant;
  },

  exitTenant(tenantId: string) {
    const t = state.tenants.find((x) => x.id === tenantId);
    if (!t) return;
    state = {
      ...state,
      tenants: state.tenants.map((x) => (x.id === tenantId ? { ...x, active: false, exitDate: new Date().toISOString() } : x)),
      apartments: state.apartments.map((a) => (a.id === t.apartmentId ? { ...a, currentTenantId: undefined } : a)),
    };
    emit();
  },

  addService(s: { label: string; iconKey: string; kind: TxType }) {
    const svc: ServiceDef = { id: uid(), label: s.label.trim(), iconKey: s.iconKey, kind: s.kind };
    state = { ...state, services: [...state.services, svc] };
    emit();
    return svc;
  },

  removeService(id: string) {
    state = { ...state, services: state.services.filter((s) => s.id !== id || s.builtin) };
    emit();
  },

  addTransaction(input: { type: TxType; category: string; categoryLabel: string; amount: number; date?: string; tenantId?: string; note?: string }) {
    const date = input.date ?? new Date().toISOString();
    const d = new Date(date);
    const tenant = input.tenantId ? state.tenants.find((t) => t.id === input.tenantId) : undefined;
    const tx: Transaction = {
      id: uid(),
      type: input.type,
      category: input.category,
      categoryLabel: input.categoryLabel,
      tenantId: input.tenantId,
      tenantName: tenant?.fullName,
      amount: input.amount,
      date,
      year: d.getFullYear(),
      month: d.getMonth(),
      note: input.note,
    };
    state = { ...state, transactions: [tx, ...state.transactions] };
    // handle overpayment credit when paying rent
    if (tx.category === "rent" && tenant) {
      const { totalDue, paid } = tenantDue(tenant, state.transactions);
      if (paid > totalDue) {
        const credit = paid - totalDue;
        state = {
          ...state,
          tenants: state.tenants.map((t) => (t.id === tenant.id ? { ...t, extraCredit: credit } : t)),
        };
      }
    }
    emit();
    return tx;
  },

  removeTransaction(id: string) {
    state = { ...state, transactions: state.transactions.filter((t) => t.id !== id) };
    emit();
  },

  // Add credit (income, no tenant) — goes into overall balance
  addCredit(amount: number, note?: string) {
    return this.addTransaction({
      type: "income",
      category: "credit-add",
      categoryLabel: "إضافة رصيد",
      amount,
      note,
    });
  },

  // Withdraw credit to tenant (expense without showing as service)
  withdrawToTenant(input: { tenantId: string; amount: number; note?: string }) {
    const tenant = state.tenants.find((t) => t.id === input.tenantId);
    return this.addTransaction({
      type: "expense",
      category: "credit-withdraw",
      categoryLabel: "سحب رصيد",
      amount: input.amount,
      tenantId: input.tenantId,
      note: input.note ?? (tenant ? `سحب لـ ${tenant.fullName}` : undefined),
    });
  },

  startNewYear() {
    const totals = computeYearTotals(state.currentYear, state);
    const grand = totals.totalIncome - totals.totalExpense + state.previousBalance;
    const archive: YearArchive = {
      year: state.currentYear,
      data: JSON.parse(JSON.stringify(state)),
      archivedAt: new Date().toISOString(),
    };
    state = {
      ...state,
      archives: [archive, ...state.archives],
      previousBalance: grand,
      currentYear: state.currentYear + 1,
      // keep tenants/apartments/services; clear transactions for clean next year
      transactions: [],
    };
    emit();
  },

  importData(json: string) {
    const parsed = JSON.parse(json) as AppData;
    if (!parsed || !Array.isArray(parsed.apartments)) throw new Error("ملف غير صالح");
    state = parsed;
    emit();
  },

  exportData(): string {
    return JSON.stringify(state, null, 2);
  },

  reset() {
    state = INITIAL_DATA;
    emit();
  },
};

// ============ Derivations ============
export function computeYearTotals(year: number, data: AppData = state) {
  const txs = data.transactions.filter((t) => t.year === year);
  const totalIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { totalIncome, totalExpense, net: totalIncome - totalExpense };
}

export function computeOverallBalance(data: AppData = state) {
  const t = computeYearTotals(data.currentYear, data);
  return t.net + data.previousBalance;
}

// monthly grid for tenant
export function tenantMonthlyGrid(tenantId: string, year: number, data: AppData = state): (number | "vacated" | null)[] {
  const tenant = data.tenants.find((t) => t.id === tenantId);
  if (!tenant) return Array(12).fill(null);
  const grid: (number | "vacated" | null)[] = Array(12).fill(null);
  const exitMonth = tenant.exitDate && new Date(tenant.exitDate).getFullYear() === year
    ? new Date(tenant.exitDate).getMonth()
    : null;
  data.transactions
    .filter((t) => t.tenantId === tenantId && t.category === "rent" && t.year === year)
    .forEach((t) => {
      grid[t.month] = (grid[t.month] ? Number(grid[t.month]) : 0) + t.amount;
    });
  if (exitMonth !== null) {
    for (let i = exitMonth + 1; i < 12; i++) grid[i] = "vacated";
    if (grid[exitMonth] === null) grid[exitMonth] = "vacated";
  }
  return grid;
}

// monthly grid for an expense service
export function serviceMonthlyGrid(serviceId: string, year: number, data: AppData = state): (number | null)[] {
  const grid: (number | null)[] = Array(12).fill(null);
  data.transactions
    .filter((t) => t.category === serviceId && t.year === year)
    .forEach((t) => {
      grid[t.month] = (grid[t.month] ?? 0) + t.amount;
    });
  return grid;
}
