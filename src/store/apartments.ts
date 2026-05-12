import { useSyncExternalStore } from "react";
import { APARTMENTS as INITIAL, type Apartment } from "@/data/building";

let state: Apartment[] = INITIAL.map((a) => ({ ...a }));
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const emit = () => listeners.forEach((l) => l());

export function useApartments() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function exitTenant(id: string) {
  state = state.map((a) =>
    a.id === id
      ? { ...a, status: "vacant", tenantFirst: undefined, tenantLast: undefined, entryDate: undefined, paidMonths: undefined }
      : a,
  );
  emit();
}
