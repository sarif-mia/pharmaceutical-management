import { beforeEach, describe, expect, it } from "vitest";
import { actions, customerDue, getState } from "@/lib/pharmacy-store";

const stock = (id: string) => getState().medicines.find((m) => m.id === id)!.stock;

describe("pharmacy rules", () => {
  beforeEach(() => actions.reset());
  it("multi-item checkout reduces stock of each item", () => {
    const a = stock("m1"), b = stock("m5");
    const r = actions.checkout({ lines: [{ medicineId: "m1", qty: 5 }, { medicineId: "m5", qty: 2 }], discount: 0, paid: 1000, method: "cash", customerId: null });
    expect(typeof r).not.toBe("string");
    expect(stock("m1")).toBe(a - 5);
    expect(stock("m5")).toBe(b - 2);
  });
  it("blocks selling more than stock", () => {
    expect(actions.sell("m2", 999)).not.toBeNull();
  });
  it("blocks expired medicine", () => {
    expect(actions.sell("m4", 1)).toContain("মেয়াদ শেষ");
  });
  it("due sale requires a customer and adds to their khata", () => {
    const line = [{ medicineId: "m3", qty: 1 }];
    expect(actions.checkout({ lines: line, discount: 0, paid: 10, method: "cash", customerId: null })).toBe("বাকি রাখতে কাস্টমার বেছে নিন");
    const before = customerDue(getState(), "u1");
    actions.checkout({ lines: line, discount: 0, paid: 10, method: "cash", customerId: "u1" });
    expect(customerDue(getState(), "u1")).toBe(before + 30);
  });
  it("return puts stock back, cuts due first, then refunds cash", () => {
    const a = stock("m3");
    const before = customerDue(getState(), "u1");
    const sale = actions.checkout({ lines: [{ medicineId: "m3", qty: 1 }], discount: 0, paid: 10, method: "cash", customerId: "u1" });
    if (typeof sale === "string") throw new Error(sale);
    expect(actions.returnSale(sale.id, [{ medicineId: "m3", qty: 2 }])).toBe("বিক্রির চেয়ে বেশি ফেরত নেওয়া যাবে না");
    expect(actions.returnSale(sale.id, [{ medicineId: "m3", qty: 1 }])).toEqual({ refund: 10 });
    expect(stock("m3")).toBe(a);
    expect(customerDue(getState(), "u1")).toBe(before);
  });
  it("purchase adds stock", () => {
    const a = stock("m2");
    actions.addPurchase({ supplierId: "s1", items: [{ medicineId: "m2", qty: 50, cost: 4, expiry: "2030-01-01" }], paid: 0, date: "2026-01-01", note: "" });
    expect(stock("m2")).toBe(a + 50);
  });
});

import { alternatives, packOf } from "@/lib/pharmacy-store";
describe("strip & generic", () => {
  beforeEach(() => actions.reset());
  it("tablets default to 10 pieces per strip", () => {
    expect(packOf(getState().medicines.find((m) => m.id === "m1")!)).toBe(10);
  });
  it("alternatives match same generic + strength only", () => {
    const st = getState();
    const napa = st.medicines.find((m) => m.id === "m1")!;
    const alt = alternatives([...st.medicines, { ...napa, id: "z", name: "Ace" }], napa);
    expect(alt.map((a) => a.id)).toEqual(["z"]);
  });
});

import { ledger } from "@/lib/pharmacy-store";
describe("ledger", () => {
  beforeEach(() => actions.reset());
  it("payment lowers running balance", () => {
    actions.addPayment({ kind: "supplier", partyId: "s1", amount: 50 });
    const rows = ledger(getState(), "supplier", "s1");
    expect(rows.at(-1)!.balance).toBe(150);
  });
});

import { describe as d2, it as i2, expect as e2, beforeEach as be2 } from "vitest";
import { actions as A, getState as G, makeSeed as MS } from "@/lib/pharmacy-store";
const DF = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
d2("batch inventory", () => {
  be2(() => A.importData(MS()));
  i2("purchase adds a new batch and sale takes earliest-expiry batch first", () => {
    const m = G().medicines[0]!;
    const before = m.stock;
    A.addPurchase({ supplierId: "s1", items: [{ medicineId: m.id, qty: 5, cost: 1, expiry: DF(900), batchNo: "NEW" }], paid: 0, date: DF(0), note: "" });
    const after = G().medicines.find((x) => x.id === m.id)!;
    e2(after.stock).toBe(before + 5);
    e2(after.batches!.length).toBe(2);
    A.sell(m.id, before);
    const sold = G().medicines.find((x) => x.id === m.id)!;
    e2(sold.stock).toBe(5);
    e2(sold.batches![0]!.no).toBe("NEW");
  });
  i2("expired batch is not sold even if a newer one has stock", () => {
    const m = G().medicines[0]!;
    A.saveMedicine({ ...m, stock: 10, expiry: DF(-1) });
    A.addPurchase({ supplierId: "s1", items: [{ medicineId: m.id, qty: 3, cost: 1, expiry: DF(300) }], paid: 0, date: DF(0), note: "" });
    e2(A.sell(m.id, 4)).toContain("3");
    e2(A.sell(m.id, 3)).toBeNull();
  });
});

import { canOpen } from "@/lib/cloud-sync";
d2("staff roles", () => {
  i2("cashier only sees sales, invoices, customers and dashboard", () => {
    e2(canOpen("cashier", "/sales")).toBe(true);
    e2(canOpen("cashier", "/purchases")).toBe(false);
    e2(canOpen("cashier", "/reports")).toBe(false);
  });
  i2("manager sees everything except settings and staff", () => {
    e2(canOpen("manager", "/reports")).toBe(true);
    e2(canOpen("manager", "/settings")).toBe(false);
    e2(canOpen("manager", "/staff")).toBe(false);
    e2(canOpen("owner", "/staff")).toBe(true);
  });
});

d2("mfs trx id", () => {
  be2(() => A.reset());
  i2("bKash sale stores the TrxID", () => {
    const r = A.checkout({ lines: [{ medicineId: "m1", qty: 1 }], discount: 0, paid: 1000, method: "bkash", customerId: null, trxId: " 9A7B3XK2 " });
    if (typeof r === "string") throw new Error(r);
    e2(r.trxId).toBe("9A7B3XK2");
  });
});

import { dayClosing } from "@/lib/pharmacy-store";
d2("day closing", () => {
  be2(() => A.reset());
  i2("expected cash = cash sales + due collected - expenses", () => {
    const d = G().sales.length ? "2099-01-01" : "2099-01-01";
    const s = { ...G() };
    const z0 = dayClosing(s, d);
    e2(z0.expectedCash).toBe(0);
    const st = { ...s, sales: [{ ...s.sales[0]!, date: d, method: "cash" as const, paid: 100 }, { ...s.sales[0]!, id: "x", date: d, method: "bkash" as const, paid: 50 }], payments: [{ id: "p", kind: "customer" as const, partyId: "u1", amount: 30, date: d }], expenses: [{ id: "e", title: "t", type: "বিল", amount: 20, date: d }] };
    const z = dayClosing(st, d);
    e2(z.byMethod.bkash).toBe(50);
    e2(z.expectedCash).toBe(110);
  });
});

import { getBatches as gb, supplierDue as sd } from "@/lib/pharmacy-store";
d2("stock adjustment", () => {
  be2(() => A.reset());
  i2("damage cuts batch stock; cannot remove more than batch has", () => {
    const m = G().medicines.find((x) => x.id === "m1")!;
    const b = gb(m)[0]!;
    e2(A.adjustStock({ medicineId: "m1", batchId: b.id, qty: b.qty + 1, reason: "damage" })).toBeTruthy();
    e2(A.adjustStock({ medicineId: "m1", batchId: b.id, qty: 5, reason: "damage" })).toBeNull();
    e2(G().medicines.find((x) => x.id === "m1")!.stock).toBe(m.stock - 5);
    e2(G().adjustments?.[0]?.qty).toBe(5);
  });
  i2("supplier return lowers what we owe that supplier by qty x batch cost", () => {
    const m = G().medicines.find((x) => x.id === "m1")!;
    const b = gb(m)[0]!;
    const before = sd(G(), "s2");
    e2(A.adjustStock({ medicineId: "m1", batchId: b.id, qty: 10, reason: "supplier", supplierId: "s2" })).toBeNull();
    e2(sd(G(), "s2")).toBeCloseTo(before - 10 * b.cost);
  });
});

import { shortageList, makeSeed as seedS } from "@/lib/pharmacy-store";
describe("shortage list", () => {
  it("lists only low stock, grouped by company, rounded up to whole strips", () => {
    const st = seedS();
    st.settings.lowStock = 20;
    st.medicines = [
      { ...st.medicines[0]!, id: "a", company: "Square", stock: 5, reorder: 10, packSize: 10, batches: [] },
      { ...st.medicines[0]!, id: "b", company: "Square", stock: 500, reorder: 10, batches: [] },
    ];
    const g = shortageList(st);
    expect(g).toHaveLength(1);
    expect(g[0]!.company).toBe("Square");
    expect(g[0]!.items.map((i) => i.m.id)).toEqual(["a"]);
    expect(g[0]!.items[0]!.suggest).toBe(40); // target 40 - 5 = 35 → 4 strips of 10
  });
});

import { actions as AD, getState as GD } from "@/lib/pharmacy-store";
describe("dosage", () => {
  it("saves trimmed dosage on the sale item, none when blank", () => {
    AD.reset();
    const m = GD().medicines.find((x) => x.id === "m1")!;
    const r = AD.checkout({ lines: [{ medicineId: m.id, qty: 1, dose: " ১+০+১ " }], discount: 0, paid: m.price, method: "cash", customerId: null });
    expect(typeof r === "object" && r.items[0]!.dose).toBe("১+০+১");
    const r2 = AD.checkout({ lines: [{ medicineId: m.id, qty: 1, dose: "  " }], discount: 0, paid: m.price, method: "cash", customerId: null });
    expect(typeof r2 === "object" && r2.items[0]!.dose).toBeUndefined();
  });
});

import { actions as AS, dayClosing as DC, getState as GS, today as TD } from "@/lib/pharmacy-store";
describe("split payment", () => {
  it("cash part goes to cash drawer, rest to bKash", () => {
    AS.reset();
    const before = DC(GS(), TD());
    const m = GS().medicines.find((x) => x.id === "m1")!;
    const total = m.price * 10;
    const r = AS.checkout({ lines: [{ medicineId: "m1", qty: 10 }], discount: 0, paid: total, method: "bkash", customerId: null, cashPart: 30 });
    expect(typeof r === "object" && r.cashPart).toBe(30);
    const z = DC(GS(), TD());
    expect(z.byMethod.cash - before.byMethod.cash).toBeCloseTo(30);
    expect(z.byMethod.bkash - before.byMethod.bkash).toBeCloseTo(total - 30);
  });
});
