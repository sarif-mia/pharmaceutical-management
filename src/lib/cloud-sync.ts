import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { actions, getState, loadFromStorage, subscribe, type PharmacyState } from "@/lib/pharmacy-store";

export type ShopRole = "owner" | "manager" | "cashier";
export type ShopSession = { shopId: string; role: ShopRole };
export const ROLE_LABEL: Record<ShopRole, string> = { owner: "মালিক", manager: "ম্যানেজার", cashier: "ক্যাশিয়ার" };

/** Pages each role may open. Owner: all. */
const CASHIER = ["/", "/sales", "/invoices", "/customers"];
const MANAGER_BLOCK = ["/settings", "/staff"];
export function canOpen(role: ShopRole, path: string) {
  if (role === "owner") return true;
  if (role === "manager") return !MANAGER_BLOCK.includes(path);
  return CASHIER.includes(path);
}

let session: ShopSession | null = null;
const ls = new Set<() => void>();
export const useShop = () => useSyncExternalStore((l) => (ls.add(l), () => void ls.delete(l)), () => session, () => null);

/** Joins/creates the user's shop, loads shared data, then saves every change back (debounced). */
export async function startCloudSync(): Promise<() => void> {
  loadFromStorage();
  const { data: rows, error: e1 } = await supabase.rpc("ensure_shop");
  if (e1) throw e1;
  const row = rows?.[0];
  if (!row) throw new Error("no shop");
  session = { shopId: row.shop_id, role: row.role };
  ls.forEach((l) => l());
  const shopId = row.shop_id;
  const { data, error } = await supabase.from("shop_data").select("data").eq("shop_id", shopId).maybeSingle();
  if (error) throw error;
  if (data && data.data && Object.keys(data.data as object).length) actions.importData(data.data as unknown as PharmacyState);
  else await supabase.from("shop_data").upsert({ shop_id: shopId, data: getState() as never });
  let t: ReturnType<typeof setTimeout> | undefined;
  const unsub = subscribe(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      void supabase.from("shop_data").upsert({ shop_id: shopId, data: getState() as never, updated_at: new Date().toISOString() });
    }, 800);
  });
  return () => { clearTimeout(t); unsub(); session = null; ls.forEach((l) => l()); };
}
