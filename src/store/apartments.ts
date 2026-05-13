// Backwards-compat adapter — delegates to unified data store
import { useAppData, dataActions, getActiveTenantOfApartment, tenantDue, type Apartment as A, type Tenant } from "./data";

export type ApartmentView = {
  id: string;
  floor: number;
  unit: number;
  status: "paid" | "unpaid" | "vacant";
  tenantFirst?: string;
  tenantLast?: string;
  tenantId?: string;
  monthlyRent: number;
  entryDate?: string;
  paidMonths?: number;
  remainingAmount: number;
  phone?: string;
};

export function useApartments(): ApartmentView[] {
  const data = useAppData();
  return data.apartments.map((apt) => {
    const tenant = getActiveTenantOfApartment(apt, data.tenants);
    if (!tenant) {
      return { id: apt.id, floor: apt.floor, unit: apt.unit, status: "vacant", monthlyRent: 0, remainingAmount: 0 };
    }
    const due = tenantDue(tenant, data.transactions);
    const [first, ...rest] = tenant.fullName.split(" ");
    return {
      id: apt.id,
      floor: apt.floor,
      unit: apt.unit,
      status: due.remaining > 0 ? "unpaid" : "paid",
      tenantFirst: first,
      tenantLast: rest.join(" "),
      tenantId: tenant.id,
      monthlyRent: tenant.monthlyRent,
      entryDate: tenant.entryDate,
      paidMonths: Math.floor(due.paid / Math.max(1, tenant.monthlyRent)),
      remainingAmount: due.remaining,
      phone: tenant.phone,
    };
  });
}

export function exitTenant(apartmentOrTenantId: string) {
  // accept apartment id or tenant id
  const data = (window as any).__lastData;
  // Simpler: just look up via dataActions — find tenant by apartment id first
  // We can't access state directly here; do best-effort:
  // Try as tenantId then as apartmentId
  // Use a quick lookup via data store
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: _ } = { default: null };
  // Lookup via fresh snapshot
  const snap = require("./data") as typeof import("./data");
  const cur = snap as any;
  // get current state via useAppData isn't allowed outside React; use exported helper instead
  // We expose findTenantByApartment via dataActions
  const tenant = findTenant(apartmentOrTenantId);
  if (tenant) dataActions.exitTenant(tenant.id);
}

function findTenant(idOrApt: string): Tenant | undefined {
  // Re-read from localStorage directly
  try {
    const raw = localStorage.getItem("aqari-data-v1");
    if (!raw) return undefined;
    const data = JSON.parse(raw);
    const byId = data.tenants?.find((t: Tenant) => t.id === idOrApt);
    if (byId) return byId;
    const apt = data.apartments?.find((a: A) => a.id === idOrApt);
    if (apt?.currentTenantId) return data.tenants.find((t: Tenant) => t.id === apt.currentTenantId);
  } catch {}
  return undefined;
}
