import { beforeEach, describe, expect, it } from "vitest";
import { actions, usePharmacy } from "@/lib/pharmacy-store";
import { renderHook } from "@testing-library/react";

const get = () => renderHook(() => usePharmacy()).result.current;

describe("selling medicine", () => {
  beforeEach(() => actions.reset());
  it("reduces stock", () => {
    const before = get().medicines.find((m) => m.id === "m1")!.stock;
    expect(actions.sell("m1", 5)).toBeNull();
    expect(get().medicines.find((m) => m.id === "m1")!.stock).toBe(before - 5);
  });
  it("blocks selling more than stock", () => {
    expect(actions.sell("m2", 999)).not.toBeNull();
  });
  it("blocks expired medicine", () => {
    expect(actions.sell("m4", 1)).toBe("এই ওষুধের মেয়াদ শেষ");
  });
});
