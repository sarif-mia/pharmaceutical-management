import { useSyncExternalStore } from "react";

export type Category = { id: string; name: string };
export type Supplier = { id: string; name: string; phone: string; company: string; address: string };
export type DosageForm = "Tablet" | "Capsule" | "Syrup" | "Suspension" | "Injection" | "Drop" | "Cream" | "Other";
export const FORMS: DosageForm[] = ["Tablet", "Capsule", "Syrup", "Suspension", "Injection", "Drop", "Cream", "Other"];
export type Medicine = {
  id: string;
  name: string;
  generic: string;
  form: DosageForm;
  strength: string;
  company: string;
  rack: string;
  barcode: string;
  categoryId: string;
  supplierId: string;
  costPrice: number;
  price: number;
  stock: number;
  reorder: number;
  expiry: string; // YYYY-MM-DD
};
export type Customer = { id: string; name: string; phone: string; address: string };
export type PaymentMethod = "cash" | "bkash" | "nagad" | "card";
export const PAYMENT_LABEL: Record<PaymentMethod, string> = { cash: "ক্যাশ", bkash: "বিকাশ", nagad: "নগদ", card: "কার্ড" };
export type SaleItem = { medicineId: string; name: string; qty: number; price: number; cost: number };
export type Sale = {
  id: string;
  invoice: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  method: PaymentMethod;
  customerId: string | null;
  date: string;
  time: string;
};
export type PurchaseItem = { medicineId: string; qty: number; cost: number; expiry: string };
export type Purchase = { id: string; supplierId: string; items: PurchaseItem[]; total: number; paid: number; date: string; note: string };
export type Payment = { id: string; kind: "customer" | "supplier"; partyId: string; amount: number; date: string };
export type Expense = { id: string; title: string; type: string; amount: number; date: string };
export type Settings = { shopName: string; address: string; phone: string; license: string; lowStock: number; expiryDays: number };

export type PharmacyState = {
  categories: Category[];
  suppliers: Supplier[];
  medicines: Medicine[];
  customers: Customer[];
  sales: Sale[];
  purchases: Purchase[];
  payments: Payment[];
  expenses: Expense[];
  settings: Settings;
};

const KEY = "pharmacy-data-v2";
const today = () => new Date().toISOString().slice(0, 10);
const daysFromNow = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
export const uid = () => Math.random().toString(36).slice(2, 10);
const r2 = (n: number) => Math.round(n * 100) / 100;

function med(id: string, name: string, generic: string, form: DosageForm, strength: string, company: string, categoryId: string, supplierId: string, costPrice: number, price: number, stock: number, expiryDays: number, rack: string): Medicine {
  return { id, name, generic, form, strength, company, categoryId, supplierId, costPrice, price, stock, reorder: 20, expiry: daysFromNow(expiryDays), rack, barcode: "89" + id.replace(/\D/g, "").padStart(6, "0") };
}

function sale(id: string, inv: number, items: SaleItem[], day: number, method: PaymentMethod, paid?: number, customerId: string | null = null): Sale {
  const subtotal = r2(items.reduce((a, i) => a + i.qty * i.price, 0));
  const p = paid ?? subtotal;
  return { id, invoice: `INV-${1000 + inv}`, items, subtotal, discount: 0, total: subtotal, paid: p, due: r2(subtotal - p), method, customerId, date: daysFromNow(day), time: "11:30" };
}

export function makeSeed(): PharmacyState {
  const medicines = [
    med("m1", "Napa", "Paracetamol", "Tablet", "500mg", "Beximco", "c1", "s2", 0.8, 1.2, 420, 300, "A-1"),
    med("m2", "Seclo", "Omeprazole", "Capsule", "20mg", "Square", "c4", "s1", 4, 6, 18, 120, "B-2"),
    med("m3", "Azithrocin", "Azithromycin", "Tablet", "500mg", "Beximco", "c2", "s2", 30, 40, 60, 20, "C-1"),
    med("m4", "Ceevit", "Vitamin C", "Tablet", "250mg", "Square", "c3", "s1", 1.5, 2.5, 8, -5, "D-3"),
    med("m5", "Fexo", "Fexofenadine", "Tablet", "120mg", "Square", "c5", "s1", 6, 9, 150, 400, "A-4"),
    med("m6", "Maxpro", "Esomeprazole", "Tablet", "20mg", "Renata", "c4", "s3", 5, 7, 200, 250, "B-1"),
    med("m7", "Tofen", "Ketotifen", "Syrup", "100ml", "Beximco", "c5", "s2", 55, 75, 12, 180, "E-2"),
    med("m8", "Monas", "Montelukast", "Tablet", "10mg", "Acme", "c5", "s3", 12, 16, 90, 365, "A-2"),
    med("m9", "Ace Plus", "Paracetamol + Caffeine", "Tablet", "500mg", "Square", "c1", "s1", 1.8, 2.5, 300, 45, "A-1"),
    med("m10", "Orsaline-N", "Oral Rehydration Salt", "Other", "Sachet", "SMC", "c6", "s3", 4, 6, 500, 500, "F-1"),
  ];
  const it = (m: string, qty: number): SaleItem => {
    const x = medicines.find((y) => y.id === m)!;
    return { medicineId: m, name: `${x.name} ${x.strength}`, qty, price: x.price, cost: x.costPrice };
  };
  return {
    categories: [
      { id: "c1", name: "ব্যথানাশক" },
      { id: "c2", name: "অ্যান্টিবায়োটিক" },
      { id: "c3", name: "ভিটামিন" },
      { id: "c4", name: "গ্যাস্ট্রিক" },
      { id: "c5", name: "অ্যালার্জি" },
      { id: "c6", name: "সাধারণ" },
    ],
    suppliers: [
      { id: "s1", name: "রহিম উদ্দিন", phone: "01711-000000", company: "Square Pharmaceuticals", address: "মিটফোর্ড, ঢাকা" },
      { id: "s2", name: "করিম হোসেন", phone: "01811-000000", company: "Beximco Pharma", address: "চট্টগ্রাম" },
      { id: "s3", name: "জামাল মিয়া", phone: "01911-000000", company: "Renata / Acme ডিস্ট্রিবিউটর", address: "ঢাকা" },
    ],
    medicines,
    customers: [
      { id: "u1", name: "আব্দুল কাদের", phone: "01712-345678", address: "মিরপুর-১০" },
      { id: "u2", name: "ফাতেমা বেগম", phone: "01556-112233", address: "পল্লবী" },
    ],
    sales: [
      sale("x1", 1, [it("m1", 20), it("m2", 10)], 0, "cash"),
      sale("x2", 2, [it("m3", 3)], 0, "bkash"),
      sale("x3", 3, [it("m5", 10), it("m8", 5)], -1, "cash", 100, "u1"),
      sale("x4", 4, [it("m6", 14)], -2, "nagad"),
      sale("x5", 5, [it("m1", 40), it("m10", 10)], -3, "cash"),
      sale("x6", 6, [it("m7", 2), it("m9", 20)], -5, "cash", 150, "u2"),
      sale("x7", 7, [it("m3", 2), it("m6", 10)], -6, "card"),
    ],
    purchases: [
      { id: "p1", supplierId: "s1", items: [{ medicineId: "m5", qty: 100, cost: 6, expiry: daysFromNow(400) }], total: 600, paid: 400, date: daysFromNow(-8), note: "চালান #4521" },
    ],
    payments: [],
    expenses: [
      { id: "e1", title: "বিদ্যুৎ বিল", type: "বিল", amount: 1800, date: daysFromNow(-3) },
      { id: "e2", title: "কর্মচারীর নাস্তা", type: "সাধারণ", amount: 120, date: today() },
    ],
    settings: { shopName: "শেফা ফার্মেসি", address: "মিরপুর-১০, ঢাকা", phone: "01700-000000", license: "DL-12345", lowStock: 20, expiryDays: 30 },
  };
}

let seed: PharmacyState | null = null;
const getSeed = () => (seed ??= makeSeed());
let state: PharmacyState | null = null;
const cur = () => (state ??= getSeed());
const listeners = new Set<() => void>();
let loaded = false;

export function loadFromStorage() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      state = { ...getSeed(), ...(JSON.parse(raw) as PharmacyState) };
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
const patch = (p: Partial<PharmacyState>) => set({ ...cur(), ...p });

export function usePharmacy() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    cur,
    getSeed,
  );
}
export const getState = cur;

export type CartLine = { medicineId: string; qty: number };
export type CheckoutInput = { lines: CartLine[]; discount: number; paid: number; method: PaymentMethod; customerId: string | null };

export const actions = {
  addCategory: (name: string) => patch({ categories: [...cur().categories, { id: uid(), name }] }),
  removeCategory: (id: string) => patch({ categories: cur().categories.filter((c) => c.id !== id) }),
  addSupplier: (s: Omit<Supplier, "id">) => patch({ suppliers: [...cur().suppliers, { ...s, id: uid() }] }),
  removeSupplier: (id: string) => patch({ suppliers: cur().suppliers.filter((s) => s.id !== id) }),
  addCustomer: (c: Omit<Customer, "id">) => {
    const id = uid();
    patch({ customers: [...cur().customers, { ...c, id }] });
    return id;
  },
  removeCustomer: (id: string) => patch({ customers: cur().customers.filter((c) => c.id !== id) }),
  saveMedicine: (m: Omit<Medicine, "id"> & { id?: string | undefined }) => {
    const s = cur();
    if (m.id) patch({ medicines: s.medicines.map((x) => (x.id === m.id ? ({ ...m, id: m.id } as Medicine) : x)) });
    else patch({ medicines: [...s.medicines, { ...m, id: uid() }] });
  },
  removeMedicine: (id: string) => patch({ medicines: cur().medicines.filter((m) => m.id !== id) }),
  addExpense: (e: Omit<Expense, "id">) => patch({ expenses: [{ ...e, id: uid() }, ...cur().expenses] }),
  removeExpense: (id: string) => patch({ expenses: cur().expenses.filter((e) => e.id !== id) }),
  updateSettings: (s: Partial<Settings>) => patch({ settings: { ...cur().settings, ...s } }),

  /** Multi-item sale. Returns error text or the created sale. */
  checkout: (input: CheckoutInput): string | Sale => {
    const s = cur();
    if (!input.lines.length) return "কার্ট খালি";
    const items: SaleItem[] = [];
    for (const l of input.lines) {
      const m = s.medicines.find((x) => x.id === l.medicineId);
      if (!m) return "ওষুধ পাওয়া যায়নি";
      if (l.qty <= 0) return "পরিমাণ সঠিক নয়";
      if (isExpired(m)) return `${m.name} এর মেয়াদ শেষ`;
      if (m.stock < l.qty) return `${m.name} স্টকে মাত্র ${m.stock}টি আছে`;
      items.push({ medicineId: m.id, name: `${m.name} ${m.strength}`.trim(), qty: l.qty, price: m.price, cost: m.costPrice });
    }
    const subtotal = r2(items.reduce((a, i) => a + i.qty * i.price, 0));
    const discount = Math.min(Math.max(0, input.discount), subtotal);
    const total = r2(subtotal - discount);
    const paid = Math.min(Math.max(0, input.paid), total);
    const due = r2(total - paid);
    if (due > 0 && !input.customerId) return "বাকি রাখতে কাস্টমার বেছে নিন";
    const now = new Date();
    const sale: Sale = {
      id: uid(),
      invoice: `INV-${1001 + s.sales.length}`,
      items, subtotal, discount, total, paid, due,
      method: input.method,
      customerId: input.customerId,
      date: today(),
      time: now.toTimeString().slice(0, 5),
    };
    patch({
      medicines: s.medicines.map((m) => {
        const l = input.lines.find((x) => x.medicineId === m.id);
        return l ? { ...m, stock: m.stock - l.qty } : m;
      }),
      sales: [sale, ...s.sales],
    });
    return sale;
  },
  /** Single-item shortcut kept for convenience. */
  sell: (medicineId: string, quantity: number): string | null => {
    const r = actions.checkout({ lines: [{ medicineId, qty: quantity }], discount: 0, paid: Infinity, method: "cash", customerId: null });
    return typeof r === "string" ? r : null;
  },
  addPurchase: (p: Omit<Purchase, "id" | "total">): string | null => {
    if (!p.items.length) return "অন্তত একটি ওষুধ যোগ করুন";
    const s = cur();
    const total = r2(p.items.reduce((a, i) => a + i.qty * i.cost, 0));
    patch({
      purchases: [{ ...p, id: uid(), total, paid: Math.min(p.paid, total) }, ...s.purchases],
      medicines: s.medicines.map((m) => {
        const its = p.items.filter((i) => i.medicineId === m.id);
        if (!its.length) return m;
        const last = its[its.length - 1]!;
        return { ...m, stock: m.stock + its.reduce((a, i) => a + i.qty, 0), costPrice: last.cost, expiry: last.expiry || m.expiry };
      }),
    });
    return null;
  },
  addPayment: (p: Omit<Payment, "id" | "date">) => patch({ payments: [{ ...p, id: uid(), date: today() }, ...cur().payments] }),
  importData: (data: PharmacyState) => set({ ...getSeed(), ...data }),
  reset: () => set(makeSeed()),
};

export const isExpired = (m: Medicine) => m.expiry < today();
export const expiresSoon = (m: Medicine, days = 30) => !isExpired(m) && m.expiry <= daysFromNow(days);
export const isLow = (m: Medicine, s: Settings) => m.stock <= Math.max(m.reorder, 0) || m.stock <= s.lowStock;
export const taka = (n: number) => `৳ ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const saleProfit = (s: Sale) => r2(s.items.reduce((a, i) => a + i.qty * (i.price - i.cost), 0) - s.discount);

export function customerDue(st: PharmacyState, id: string) {
  const owed = st.sales.filter((s) => s.customerId === id).reduce((a, s) => a + s.due, 0);
  const paid = st.payments.filter((p) => p.kind === "customer" && p.partyId === id).reduce((a, p) => a + p.amount, 0);
  return r2(owed - paid);
}
export function supplierDue(st: PharmacyState, id: string) {
  const owed = st.purchases.filter((p) => p.supplierId === id).reduce((a, p) => a + p.total - p.paid, 0);
  const paid = st.payments.filter((p) => p.kind === "supplier" && p.partyId === id).reduce((a, p) => a + p.amount, 0);
  return r2(owed - paid);
}
export { today, daysFromNow };
