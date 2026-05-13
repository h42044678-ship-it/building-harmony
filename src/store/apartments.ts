// Adapter — derives view-model from unified data store
import { useAppData, dataActions, getActiveTenantOfApartment, tenantDue } from "./data";

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
    const parts = tenant.fullName.trim().split(/\s+/);
    const first = parts[0] ?? "";
    const last = parts.slice(1).join(" ");
    return {
      id: apt.id,
      floor: apt.floor,
      unit: apt.unit,
      status: due.remaining > 0 ? "unpaid" : "paid",
      tenantFirst: first,
      tenantLast: last,
      tenantId: tenant.id,
      monthlyRent: tenant.monthlyRent,
      entryDate: tenant.entryDate,
      paidMonths: tenant.monthlyRent ? Math.floor(due.paid / tenant.monthlyRent) : 0,
      remainingAmount: due.remaining,
      phone: tenant.phone,
    };
  });
}

export function exitTenant(tenantId: string) {
  dataActions.exitTenant(tenantId);
}
