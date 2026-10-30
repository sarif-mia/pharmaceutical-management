import { useSyncExternalStore } from "react";

export type Category = { id: string; name: string };
export type Supplier = { id: string; name: string; phone: string; company: string; address: string };
export type Medicine = {
  id: string;
  name: string;
  categoryId: string;
  supplierId: string;
  costPrice: number;
  price: number;
  stock: number;
  expiry: string; // YYYY-MM-DD
};
export type Sale = { id: string; medicineId: string; quantity: number; total: number; date: string };

export type PharmacyState = {
  categories: Category[];
  suppliers: Supplier[];
  medicines: Medicine[];
  sales: Sale[];
};

const KEY = "pharmacy-data-v1";
const today = () => new Date().toISOString().slice(0, 10);
const daysFromNow = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
export const uid = () => Math.random().toString(36).slice(2, 10);

const seed: PharmacyState = {
  categories: [
    { id: "c1", name: "ব্যথানাশক" },
    { id: "c2", name: "অ্যান্টিবায়োটিক" },
    { id: "c3", name: "ভিটামিন" },
    { id: "c4", name: "গ্যাস্ট্রিক" },
  ],
  suppliers: [
    { id: "s1", name: "রহিম উদ্দিন", phone: "01711-000000", company: "Square Pharma", address: "ঢাকা" },
    { id: "s2", name: "করিম হোসেন", phone: "01811-000000", company: "Beximco", address: "চট্টগ্রাম" },
  ],
  medicines: [
    { id: "m1", name: "Napa 500mg", categoryId: "c1", supplierId: "s2", costPrice: 0.8, price: 1.2, stock: 420, expiry: daysFromNow(300) },
    { id: "m2", name: "Seclo 20mg", categoryId: "c4", supplierId: "s1", costPrice: 4, price: 6, stock: 18, expiry: daysFromNow(120) },
    { id: "m3", name: "Azithrocin 500", categoryId: "c2", supplierId: "s2", costPrice: 30, price: 40, stock: 60, expiry: daysFromNow(20) },
    { id: "m4", name: "Ceevit 250", categoryId: "c3", supplierId: "s1", costPrice: 1.5, price: 2.5, stock: 8, expiry: daysFromNow(-5) },
    { id: "m5", name: "Fexo 120", categoryId: "c1", supplierId: "s1", costPrice: 6, price: 9, stock: 150, expiry: daysFromNow(400) },
  ],
  sales: [
    { id: "x1", medicineId: "m1", quantity: 20, total: 24, date: today() },
    { id: "x2", medicineId: "m3", quantity: 3, total: 120, date: today() },
    { id: "x3", medicineId: "m5", quantity: 10, total: 90, date: daysFromNow(-1) },
    { id: "x4", medicineId: "m2", quantity: 14, total: 84, date: daysFromNow(-2) },
    { id: "x5", medicineId: "m1", quantity: 40, total: 48, date: daysFromNow(-4) },
  ],
};

let state: PharmacyState = seed;
const listeners = new Set<() => void>();
let loaded = false;

export function loadFromStorage() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      state = JSON.parse(raw) as PharmacyState;
      listeners.forEach((l) => l());
    }
  } catch {
    /* ignore */
  }
}

function set(next: PharmacyState) {
  state = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function usePharmacy() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => seed,
  );
}

export const actions = {
  addCategory: (name: string) => set({ ...state, categories: [...state.categories, { id: uid(), name }] }),
  removeCategory: (id: string) => set({ ...state, categories: state.categories.filter((c) => c.id !== id) }),
  addSupplier: (s: Omit<Supplier, "id">) => set({ ...state, suppliers: [...state.suppliers, { ...s, id: uid() }] }),
  removeSupplier: (id: string) => set({ ...state, suppliers: state.suppliers.filter((s) => s.id !== id) }),
  addMedicine: (m: Omit<Medicine, "id">) => set({ ...state, medicines: [...state.medicines, { ...m, id: uid() }] }),
  removeMedicine: (id: string) => set({ ...state, medicines: state.medicines.filter((m) => m.id !== id) }),
  restock: (id: string, qty: number) =>
    set({ ...state, medicines: state.medicines.map((m) => (m.id === id ? { ...m, stock: m.stock + qty } : m)) }),
  sell: (medicineId: string, quantity: number): string | null => {
    const med = state.medicines.find((m) => m.id === medicineId);
    if (!med) return "ওষুধ পাওয়া যায়নি";
    if (quantity <= 0) return "পরিমাণ সঠিক নয়";
    if (med.stock < quantity) return `স্টকে মাত্র ${med.stock}টি আছে`;
    if (isExpired(med)) return "এই ওষুধের মেয়াদ শেষ";
    set({
      ...state,
      medicines: state.medicines.map((m) => (m.id === medicineId ? { ...m, stock: m.stock - quantity } : m)),
      sales: [{ id: uid(), medicineId, quantity, total: +(med.price * quantity).toFixed(2), date: today() }, ...state.sales],
    });
    return null;
  },
  reset: () => set(seed),
};

export const LOW_STOCK = 20;
export const isExpired = (m: Medicine) => m.expiry < today();
export const expiresSoon = (m: Medicine) => !isExpired(m) && m.expiry <= daysFromNow(30);
export const taka = (n: number) => `৳ ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export { today };
