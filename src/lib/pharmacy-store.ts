import { useSyncExternalStore } from "react";

export type Category = { id: string; name: string };
export type Supplier = {
  id: string;
  name: string;
  phone: string;
  company: string;
  address: string;
};
export type DosageForm =
  "Tablet" | "Capsule" | "Syrup" | "Suspension" | "Injection" | "Drop" | "Cream" | "Other";
export const FORMS: DosageForm[] = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Suspension",
  "Injection",
  "Drop",
  "Cream",
  "Other",
];
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
  packSize?: number; // pieces per strip/box (1 = sold singly)
  expiry: string; // YYYY-MM-DD — earliest expiry among stocked batches
  batches?: Batch[]; // stock split by batch; sum(qty) === stock
};
export type Batch = { id: string; no: string; qty: number; expiry: string; cost: number };

/** Batches of a medicine (legacy medicines without batches become one batch). */
export function getBatches(m: Medicine): Batch[] {
  if (m.batches && m.batches.length) return m.batches;
  return m.stock > 0
    ? [{ id: "b0", no: "-", qty: m.stock, expiry: m.expiry, cost: m.costPrice }]
    : [];
}
/** Pieces that can be sold right now (non-expired batches). */
export function sellableStock(m: Medicine): number {
  const t = new Date().toISOString().slice(0, 10);
  return getBatches(m)
    .filter((b) => b.expiry >= t)
    .reduce((a, b) => a + b.qty, 0);
}
function withBatches(m: Medicine, batches: Batch[]): Medicine {
  const live = batches.filter((b) => b.qty > 0).sort((a, b) => a.expiry.localeCompare(b.expiry));
  return {
    ...m,
    batches: live,
    stock: live.reduce((a, b) => a + b.qty, 0),
    expiry: live[0]?.expiry ?? m.expiry,
  };
}
export type Customer = { id: string; name: string; phone: string; address: string };
export type PaymentMethod = "cash" | "bkash" | "nagad" | "card";
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "ক্যাশ",
  bkash: "বিকাশ",
  nagad: "নগদ",
  card: "কার্ড",
};
export type SaleItem = {
  medicineId: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
  dose?: string;
};
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
  trxId?: string;
  cashPart?: number; // split bill: part of `paid` received in cash, rest via `method`
  customerId: string | null;
  date: string;
  time: string;
};
export type PurchaseItem = {
  medicineId: string;
  qty: number;
  cost: number;
  expiry: string;
  batchNo?: string;
};
export type Purchase = {
  id: string;
  supplierId: string;
  items: PurchaseItem[];
  total: number;
  paid: number;
  date: string;
  note: string;
};
export type Payment = {
  id: string;
  kind: "customer" | "supplier";
  partyId: string;
  amount: number;
  date: string;
  note?: string;
};
export type AdjustReason = "damage" | "expired" | "lost" | "supplier";
export const ADJUST_LABEL: Record<AdjustReason, string> = {
  damage: "নষ্ট/ভাঙা",
  expired: "মেয়াদোত্তীর্ণ ফেলে দেওয়া",
  lost: "হারানো/গরমিল",
  supplier: "সাপ্লায়ারকে ফেরত",
};
export type Adjustment = {
  id: string;
  medicineId: string;
  name: string;
  batchNo: string;
  qty: number;
  cost: number;
  reason: AdjustReason;
  supplierId?: string;
  note: string;
  date: string;
};
export type Expense = { id: string; title: string; type: string; amount: number; date: string };
export type Settings = {
  shopName: string;
  address: string;
  phone: string;
  license: string;
  lowStock: number;
  expiryDays: number;
  receiptWidth?: "58" | "80";
};

export type PharmacyState = {
  categories: Category[];
  suppliers: Supplier[];
  medicines: Medicine[];
  customers: Customer[];
  sales: Sale[];
  purchases: Purchase[];
  payments: Payment[];
  expenses: Expense[];
  adjustments?: Adjustment[];
  settings: Settings;
};

const KEY = "pharmacy-data-v2";
const today = () => new Date().toISOString().slice(0, 10);
const daysFromNow = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
export const uid = () => Math.random().toString(36).slice(2, 10);
const r2 = (n: number) => Math.round(n * 100) / 100;

function med(
  id: string,
  name: string,
  generic: string,
  form: DosageForm,
  strength: string,
  company: string,
  categoryId: string,
  supplierId: string,
  costPrice: number,
  price: number,
  stock: number,
  expiryDays: number,
  rack: string,
): Medicine {
  return {
    id,
    name,
    generic,
    form,
    strength,
    company,
    categoryId,
    supplierId,
    costPrice,
    price,
    stock,
    reorder: 20,
    packSize: form === "Tablet" || form === "Capsule" ? 10 : 1,
    expiry: daysFromNow(expiryDays),
    rack,
    barcode: "89" + id.replace(/\D/g, "").padStart(6, "0"),
  };
}

function sale(
  id: string,
  inv: number,
  items: SaleItem[],
  day: number,
  method: PaymentMethod,
  paid?: number,
  customerId: string | null = null,
): Sale {
  const subtotal = r2(items.reduce((a, i) => a + i.qty * i.price, 0));
  const p = paid ?? subtotal;
  return {
    id,
    invoice: `INV-${1000 + inv}`,
    items,
    subtotal,
    discount: 0,
    total: subtotal,
    paid: p,
    due: r2(subtotal - p),
    method,
    customerId,
    date: daysFromNow(day),
    time: "11:30",
  };
}

export function makeSeed(): PharmacyState {
  const medicines = [
    med(
      "m1",
      "Napa",
      "Paracetamol",
      "Tablet",
      "500mg",
      "Beximco",
      "c1",
      "s2",
      0.8,
      1.2,
      420,
      300,
      "A-1",
    ),
    med("m2", "Seclo", "Omeprazole", "Capsule", "20mg", "Square", "c4", "s1", 4, 6, 18, 120, "B-2"),
    med(
      "m3",
      "Azithrocin",
      "Azithromycin",
      "Tablet",
      "500mg",
      "Beximco",
      "c2",
      "s2",
      30,
      40,
      60,
      20,
      "C-1",
    ),
    med(
      "m4",
      "Ceevit",
      "Vitamin C",
      "Tablet",
      "250mg",
      "Square",
      "c3",
      "s1",
      1.5,
      2.5,
      8,
      -5,
      "D-3",
    ),
    med(
      "m5",
      "Fexo",
      "Fexofenadine",
      "Tablet",
      "120mg",
      "Square",
      "c5",
      "s1",
      6,
      9,
      150,
      400,
      "A-4",
    ),
    med(
      "m6",
      "Maxpro",
      "Esomeprazole",
      "Tablet",
      "20mg",
      "Renata",
      "c4",
      "s3",
      5,
      7,
      200,
      250,
      "B-1",
    ),
    med(
      "m7",
      "Tofen",
      "Ketotifen",
      "Syrup",
      "100ml",
      "Beximco",
      "c5",
      "s2",
      55,
      75,
      12,
      180,
      "E-2",
    ),
    med("m8", "Monas", "Montelukast", "Tablet", "10mg", "Acme", "c5", "s3", 12, 16, 90, 365, "A-2"),
    med(
      "m9",
      "Ace Plus",
      "Paracetamol + Caffeine",
      "Tablet",
      "500mg",
      "Square",
      "c1",
      "s1",
      1.8,
      2.5,
      300,
      45,
      "A-1",
    ),
    med(
      "m10",
      "Orsaline-N",
      "Oral Rehydration Salt",
      "Other",
      "Sachet",
      "SMC",
      "c6",
      "s3",
      4,
      6,
      500,
      500,
      "F-1",
    ),
  ];
  const it = (m: string, qty: number): SaleItem => {
    const x = medicines.find((y) => y.id === m)!;
    return {
      medicineId: m,
      name: `${x.name} ${x.strength}`,
      qty,
      price: x.price,
      cost: x.costPrice,
    };
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
      {
        id: "s1",
        name: "রহিম উদ্দিন",
        phone: "01711-000000",
        company: "Square Pharmaceuticals",
        address: "মিটফোর্ড, ঢাকা",
      },
      {
        id: "s2",
        name: "করিম হোসেন",
        phone: "01811-000000",
        company: "Beximco Pharma",
        address: "চট্টগ্রাম",
      },
      {
        id: "s3",
        name: "জামাল মিয়া",
        phone: "01911-000000",
        company: "Renata / Acme ডিস্ট্রিবিউটর",
        address: "ঢাকা",
      },
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
      {
        id: "p1",
        supplierId: "s1",
        items: [{ medicineId: "m5", qty: 100, cost: 6, expiry: daysFromNow(400) }],
        total: 600,
        paid: 400,
        date: daysFromNow(-8),
        note: "চালান #4521",
      },
    ],
    payments: [],
    expenses: [
      { id: "e1", title: "বিদ্যুৎ বিল", type: "বিল", amount: 1800, date: daysFromNow(-3) },
      { id: "e2", title: "কর্মচারীর নাস্তা", type: "সাধারণ", amount: 120, date: today() },
    ],
    settings: {
      shopName: "শেফা ফার্মেসি",
      address: "মিরপুর-১০, ঢাকা",
      phone: "01700-000000",
      license: "DL-12345",
      lowStock: 20,
      expiryDays: 30,
    },
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

export type CartLine = { medicineId: string; qty: number; dose?: string };
export const DOSE_PRESETS = [
  "১+০+১ (খাবার পর)",
  "১+১+১ (খাবার পর)",
  "১+০+০ (সকালে)",
  "০+০+১ (রাতে)",
  "১+০+১ (খাবার আগে)",
  "১ চামচ ৩ বার",
  "প্রয়োজনে",
];
export type CheckoutInput = {
  lines: CartLine[];
  discount: number;
  paid: number;
  method: PaymentMethod;
  customerId: string | null;
  trxId?: string;
  cashPart?: number;
};

export const actions = {
  addCategory: (name: string) => patch({ categories: [...cur().categories, { id: uid(), name }] }),
  removeCategory: (id: string) =>
    patch({ categories: cur().categories.filter((c) => c.id !== id) }),
  addSupplier: (s: Omit<Supplier, "id">) =>
    patch({ suppliers: [...cur().suppliers, { ...s, id: uid() }] }),
  removeSupplier: (id: string) => patch({ suppliers: cur().suppliers.filter((s) => s.id !== id) }),
  addCustomer: (c: Omit<Customer, "id">) => {
    const id = uid();
    patch({ customers: [...cur().customers, { ...c, id }] });
    return id;
  },
  removeCustomer: (id: string) => patch({ customers: cur().customers.filter((c) => c.id !== id) }),
  saveMedicine: (m: Omit<Medicine, "id"> & { id?: string | undefined }) => {
    const s = cur();
    const fix = (x: Medicine, old?: Medicine): Medicine => {
      // keep batches when stock & expiry were not edited by hand; otherwise reset to one batch
      if (old && old.batches?.length && old.stock === x.stock && old.expiry === x.expiry)
        return { ...x, batches: old.batches };
      return {
        ...x,
        batches:
          x.stock > 0
            ? [{ id: uid(), no: "-", qty: x.stock, expiry: x.expiry, cost: x.costPrice }]
            : [],
      };
    };
    if (m.id)
      patch({
        medicines: s.medicines.map((x) =>
          x.id === m.id ? fix({ ...m, id: m.id } as Medicine, x) : x,
        ),
      });
    else patch({ medicines: [...s.medicines, fix({ ...m, id: uid() } as Medicine)] });
  },
  removeMedicine: (id: string) => patch({ medicines: cur().medicines.filter((m) => m.id !== id) }),
  addExpense: (e: Omit<Expense, "id">) =>
    patch({ expenses: [{ ...e, id: uid() }, ...cur().expenses] }),
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
      const can = sellableStock(m);
      if (can === 0 && m.stock > 0) return `${m.name} এর মেয়াদ শেষ`;
      if (can < l.qty) return `${m.name} স্টকে মাত্র ${can}টি আছে`;
      items.push({
        medicineId: m.id,
        name: `${m.name} ${m.strength}`.trim(),
        qty: l.qty,
        price: m.price,
        cost: m.costPrice,
        ...(l.dose?.trim() ? { dose: l.dose.trim() } : {}),
      });
    }
    // FEFO: take from the earliest-expiring non-expired batch first
    const t = today();
    const nextMeds = new Map<string, Medicine>();
    for (const l of input.lines) {
      const m = nextMeds.get(l.medicineId) ?? s.medicines.find((x) => x.id === l.medicineId)!;
      let left = l.qty,
        costSum = 0;
      const bs = getBatches(m)
        .map((b) => ({ ...b }))
        .sort((a, b) => a.expiry.localeCompare(b.expiry));
      for (const b of bs) {
        if (left <= 0 || b.expiry < t) continue;
        const take = Math.min(b.qty, left);
        b.qty -= take;
        left -= take;
        costSum += take * b.cost;
      }
      const item = items.find((i) => i.medicineId === m.id && i.qty === l.qty);
      if (item) item.cost = r2(costSum / l.qty);
      nextMeds.set(m.id, withBatches(m, bs));
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
      items,
      subtotal,
      discount,
      total,
      paid,
      due,
      method: input.method,
      ...(input.trxId?.trim() ? { trxId: input.trxId.trim() } : {}),
      ...(input.method !== "cash" && (input.cashPart ?? 0) > 0
        ? { cashPart: r2(Math.min(input.cashPart!, paid)) }
        : {}),
      customerId: input.customerId,
      date: today(),
      time: now.toTimeString().slice(0, 5),
    };
    patch({
      medicines: s.medicines.map((m) => {
        return nextMeds.get(m.id) ?? m;
      }),
      sales: [sale, ...s.sales],
    });
    return sale;
  },
  /** Single-item shortcut kept for convenience. */
  sell: (medicineId: string, quantity: number): string | null => {
    const r = actions.checkout({
      lines: [{ medicineId, qty: quantity }],
      discount: 0,
      paid: Infinity,
      method: "cash",
      customerId: null,
    });
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
        const added: Batch[] = its.map((i) => ({
          id: uid(),
          no: i.batchNo || "-",
          qty: i.qty,
          expiry: i.expiry || m.expiry,
          cost: i.cost,
        }));
        return withBatches({ ...m, costPrice: last.cost }, [...getBatches(m), ...added]);
      }),
    });
    return null;
  },
  addPayment: (p: Omit<Payment, "id" | "date">) =>
    patch({ payments: [{ ...p, id: uid(), date: today() }, ...cur().payments] }),
  /** Customer returns pieces from a sale: stock comes back, bill shrinks, due is cut first, rest is cash refund. */
  returnSale: (saleId: string, lines: CartLine[]): string | { refund: number } => {
    const s = cur();
    const sale = s.sales.find((x) => x.id === saleId);
    if (!sale) return "ইনভয়েস পাওয়া যায়নি";
    const ls = lines.filter((l) => l.qty > 0);
    if (!ls.length) return "ফেরতের পরিমাণ দিন";
    const items = sale.items.map((i) => ({ ...i }));
    let amount = 0;
    for (const l of ls) {
      const it = items.find((i) => i.medicineId === l.medicineId);
      if (!it || l.qty > it.qty) return "বিক্রির চেয়ে বেশি ফেরত নেওয়া যাবে না";
      it.qty -= l.qty;
      amount += l.qty * it.price;
    }
    const subtotal = r2(items.reduce((a, i) => a + i.qty * i.price, 0));
    const discount = Math.min(sale.discount, subtotal);
    const total = r2(subtotal - discount);
    const credit = r2(sale.total - total);
    const due = r2(Math.max(0, sale.due - credit));
    const refund = r2(credit - (sale.due - due));
    const next: Sale = {
      ...sale,
      items: items.filter((i) => i.qty > 0),
      subtotal,
      discount,
      total,
      due,
      paid: r2(total - due),
    };
    patch({
      sales: s.sales.map((x) => (x.id === saleId ? next : x)),
      medicines: s.medicines.map((m) => {
        const l = ls.find((x) => x.medicineId === m.id);
        if (!l) return m;
        const it = sale.items.find((i) => i.medicineId === m.id)!;
        return withBatches(m, [
          ...getBatches(m),
          { id: uid(), no: `ফেরত ${sale.invoice}`, qty: l.qty, expiry: m.expiry, cost: it.cost },
        ]);
      }),
    });
    void amount;
    return { refund };
  },
  /** Remove pieces from one batch (damage/expired/lost/supplier return). Supplier return credits the supplier's due. */
  adjustStock: (a: {
    medicineId: string;
    batchId: string;
    qty: number;
    reason: AdjustReason;
    supplierId?: string;
    note?: string;
  }): string | null => {
    const s = cur();
    const m = s.medicines.find((x) => x.id === a.medicineId);
    if (!m) return "ওষুধ পাওয়া যায়নি";
    const bs = getBatches(m).map((b) => ({ ...b }));
    const b = bs.find((x) => x.id === a.batchId);
    if (!b) return "ব্যাচ পাওয়া যায়নি";
    if (!(a.qty > 0) || a.qty > b.qty) return `এই ব্যাচে মাত্র ${b.qty} পিস আছে`;
    if (a.reason === "supplier" && !a.supplierId) return "সাপ্লায়ার বেছে নিন";
    b.qty -= a.qty;
    const adj: Adjustment = {
      id: uid(),
      medicineId: m.id,
      name: `${m.name} ${m.strength}`.trim(),
      batchNo: b.no,
      qty: a.qty,
      cost: b.cost,
      reason: a.reason,
      note: a.note?.trim() ?? "",
      date: today(),
      ...(a.supplierId ? { supplierId: a.supplierId } : {}),
    };
    patch({
      medicines: s.medicines.map((x) => (x.id === m.id ? withBatches(m, bs) : x)),
      adjustments: [adj, ...(s.adjustments ?? [])],
      ...(a.reason === "supplier" && a.supplierId
        ? {
            payments: [
              {
                id: uid(),
                kind: "supplier" as const,
                partyId: a.supplierId,
                amount: r2(a.qty * b.cost),
                date: today(),
                note: `ফেরত ${adj.name} ×${a.qty}`,
              },
              ...s.payments,
            ],
          }
        : {}),
    });
    return null;
  },
  importData: (data: PharmacyState) => set({ ...getSeed(), ...data }),
  reset: () => set(makeSeed()),
};

export const isExpired = (m: Medicine) => m.expiry < today();
export const expiresSoon = (m: Medicine, days = 30) =>
  !isExpired(m) && m.expiry <= daysFromNow(days);
export const isLow = (m: Medicine, s: Settings) =>
  m.stock <= Math.max(m.reorder, 0) || m.stock <= s.lowStock;
export const packOf = (m: Medicine) => Math.max(1, Math.floor(m.packSize ?? 1));
/** Same-generic, same-strength, sellable alternatives (different brands). */
export const alternatives = (list: Medicine[], m: Medicine) =>
  list.filter(
    (x) =>
      x.id !== m.id &&
      x.generic.trim().toLowerCase() === m.generic.trim().toLowerCase() &&
      x.strength === m.strength &&
      !isExpired(x) &&
      x.stock > 0,
  );
export const taka = (n: number) => `৳ ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const saleProfit = (s: Sale) =>
  r2(s.items.reduce((a, i) => a + i.qty * (i.price - i.cost), 0) - s.discount);

export function customerDue(st: PharmacyState, id: string) {
  const owed = st.sales.filter((s) => s.customerId === id).reduce((a, s) => a + s.due, 0);
  const paid = st.payments
    .filter((p) => p.kind === "customer" && p.partyId === id)
    .reduce((a, p) => a + p.amount, 0);
  return r2(owed - paid);
}
export function supplierDue(st: PharmacyState, id: string) {
  const owed = st.purchases
    .filter((p) => p.supplierId === id)
    .reduce((a, p) => a + p.total - p.paid, 0);
  const paid = st.payments
    .filter((p) => p.kind === "supplier" && p.partyId === id)
    .reduce((a, p) => a + p.amount, 0);
  return r2(owed - paid);
}
export { today, daysFromNow };

export type LedgerRow = {
  date: string;
  ref: string;
  debit: number;
  credit: number;
  balance: number;
};
/** Debit = they owe more (sale due / purchase due), credit = payment. Oldest first, running balance. */
export function ledger(st: PharmacyState, kind: "customer" | "supplier", id: string): LedgerRow[] {
  const raw: Omit<LedgerRow, "balance">[] =
    kind === "customer"
      ? st.sales
          .filter((s) => s.customerId === id && s.due > 0)
          .map((s) => ({
            date: s.date,
            ref: `বিক্রি ${s.invoice} (মোট ${s.total})`,
            debit: s.due,
            credit: 0,
          }))
      : st.purchases
          .filter((p) => p.supplierId === id && p.total - p.paid > 0)
          .map((p) => ({
            date: p.date,
            ref: `চালান ${p.note || ""} (মোট ${p.total})`.trim(),
            debit: r2(p.total - p.paid),
            credit: 0,
          }));
  st.payments
    .filter((p) => p.kind === kind && p.partyId === id)
    .forEach((p) =>
      raw.push({ date: p.date, ref: p.note || "পরিশোধ", debit: 0, credit: p.amount }),
    );
  raw.sort((a, b) => a.date.localeCompare(b.date));
  let bal = 0;
  return raw.map((r) => ({ ...r, balance: (bal = r2(bal + r.debit - r.credit)) }));
}
export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Day-end (Z) report. Customer due collections are counted as cash. */
export const adjustmentLoss = (st: PharmacyState, from: string, to: string) =>
  r2(
    (st.adjustments ?? [])
      .filter((a) => a.reason !== "supplier" && a.date >= from && a.date <= to)
      .reduce((x, a) => x + a.qty * a.cost, 0),
  );
export function dayClosing(st: PharmacyState, date: string) {
  const sales = st.sales.filter((s) => s.date === date);
  const byMethod: Record<PaymentMethod, number> = { cash: 0, bkash: 0, nagad: 0, card: 0 };
  for (const s of sales)
    for (const [k, v] of Object.entries(paidBy(s)) as [PaymentMethod, number][])
      byMethod[k] = r2(byMethod[k] + v);
  const collected = r2(
    st.payments
      .filter((p) => p.kind === "customer" && p.date === date)
      .reduce((a, p) => a + p.amount, 0),
  );
  const expense = r2(st.expenses.filter((e) => e.date === date).reduce((a, e) => a + e.amount, 0));
  return {
    count: sales.length,
    total: r2(sales.reduce((a, s) => a + s.total, 0)),
    discount: r2(sales.reduce((a, s) => a + s.discount, 0)),
    due: r2(sales.reduce((a, s) => a + s.due, 0)),
    byMethod,
    collected,
    expense,
    expectedCash: r2(byMethod.cash + collected - expense),
  };
}

/** Re-order list: low/out-of-stock medicines grouped by company, with a suggested order qty in pieces. */
export function shortageList(st: PharmacyState) {
  const groups = new Map<string, { m: Medicine; suggest: number }[]>();
  for (const m of st.medicines) {
    if (!isLow(m, st.settings)) continue;
    const target = Math.max(m.reorder, st.settings.lowStock) * 2;
    const pack = Math.max(m.packSize ?? 1, 1);
    const suggest = Math.max(Math.ceil((target - m.stock) / pack) * pack, pack);
    const key = m.company?.trim() || "অন্যান্য";
    groups.set(key, [...(groups.get(key) ?? []), { m, suggest }]);
  }
  return [...groups.entries()]
    .map(([company, items]) => ({ company, items }))
    .sort((a, b) => a.company.localeCompare(b.company));
}

/** How a sale's paid amount splits across payment methods (split bills: cash + bKash etc.). */
export function paidBy(s: Sale): Partial<Record<PaymentMethod, number>> {
  const cash = s.method === "cash" ? s.paid : Math.min(s.cashPart ?? 0, s.paid);
  const out: Partial<Record<PaymentMethod, number>> = {};
  if (cash > 0) out.cash = r2(cash);
  if (s.method !== "cash" && s.paid - cash > 0) out[s.method] = r2(s.paid - cash);
  return out;
}
