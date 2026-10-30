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
