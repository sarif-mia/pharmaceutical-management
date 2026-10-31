import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  actions,
  getState,
  loadFromStorage,
  subscribe,
  type PharmacyState,
} from "@/lib/pharmacy-store";

export type ShopRole = "owner" | "manager" | "cashier";
export type ShopSession = { shopId: string; role: ShopRole };
export const ROLE_LABEL: Record<ShopRole, string> = {
  owner: "মালিক",
  manager: "ম্যানেজার",
  cashier: "ক্যাশিয়ার",
};

/** Pages each role may open. Owner: all. (The server enforces the same limits on saved data.) */
const CASHIER = ["/", "/sales", "/invoices", "/customers", "/closing"];
const MANAGER_BLOCK = ["/settings", "/staff"];
export function canOpen(role: ShopRole, path: string) {
  if (role === "owner") return true;
  if (role === "manager") return !MANAGER_BLOCK.includes(path);
  return CASHIER.includes(path);
}

let session: ShopSession | null = null;
const ls = new Set<() => void>();
const emit = () => ls.forEach((l) => l());
export const useShop = () =>
  useSyncExternalStore(
    (l) => (ls.add(l), () => void ls.delete(l)),
    () => session,
    () => null,
  );

export type SyncStatus = "saved" | "saving" | "error";
let syncStatus: SyncStatus = "saved";
const sl = new Set<() => void>();
const setSync = (s: SyncStatus) => {
  if (s !== syncStatus) {
    syncStatus = s;
    sl.forEach((l) => l());
  }
};
export const useSyncStatus = () =>
  useSyncExternalStore(
    (l) => (sl.add(l), () => void sl.delete(l)),
    () => syncStatus,
    () => "saved" as SyncStatus,
  );

// ---- Operation log: every user action is recorded so it can be replayed on top of newer shop data ----
type AnyFn = (...a: unknown[]) => unknown;
type Op = { name: string; args: unknown[] };
const A = actions as unknown as Record<string, AnyFn>;
const original: Record<string, AnyFn> = {};
const pending: Op[] = [];
let depth = 0;
let recording = false;
for (const name of Object.keys(A)) {
  if (name === "importData") continue;
  original[name] = A[name]!;
  A[name] = (...args: unknown[]) => {
    depth++;
    try {
      const r = original[name]!(...args);
      if (depth === 1 && recording) pending.push({ name, args });
      return r;
    } finally {
      depth--;
    }
  };
}

/** Puts remote data in place, then re-applies this device's unsaved actions on top. */
function applyRemote(data: PharmacyState) {
  const was = recording;
  recording = false;
  actions.importData(data);
  for (const op of pending) {
    const r = original[op.name]!(...op.args);
    if (typeof r === "string") toast.error(`একটি কাজ বাতিল হয়েছে: ${r}`);
  }
  recording = was;
}

/** Joins/creates the user's shop, loads shared data, then saves changes safely with version checks. */
export async function startCloudSync(): Promise<() => void> {
  loadFromStorage();
  const { data: rows, error: e1 } = await supabase.rpc("ensure_shop");
  if (e1) throw e1;
  const row = rows?.[0];
  if (!row) throw new Error("no shop");
  session = { shopId: row.shop_id, role: row.role };
  emit();
  const shopId = row.shop_id;
  let version = 0;
  let stopped = false;

  const fetchRemote = async () => {
    const { data, error } = await supabase
      .from("shop_data")
      .select("data, version")
      .eq("shop_id", shopId)
      .single();
    if (error) throw error;
    return data as { data: PharmacyState | Record<string, never>; version: number };
  };

  const first = await fetchRemote();
  version = first.version;
  pending.length = 0;
  if (Object.keys(first.data).length) actions.importData(first.data as PharmacyState);
  else pending.push({ name: "__initial", args: [] }); // empty shop: upload current data
  recording = true;

  let busy = false;
  const flush = async (): Promise<void> => {
    if (busy || stopped || !pending.length) return;
    busy = true;
    setSync("saving");
    let failed = false;
    try {
      for (let attempt = 0; attempt < 5 && pending.length; attempt++) {
        const count = pending.length;
        const { data: v, error } = await supabase.rpc("save_shop_data", {
          _shop: shopId,
          _data: getState() as never,
          _version: version,
        });
        if (!error) {
          version = Number(v);
          pending.splice(0, count);
          continue;
        }
        const remote = await fetchRemote();
        version = remote.version;
        if (error.message.includes("conflict")) {
          applyRemote(remote.data as PharmacyState);
          continue;
        }
        toast.error("এই পরিবর্তনের অনুমতি আপনার নেই — বাতিল করা হলো");
        pending.length = 0;
        applyRemote(remote.data as PharmacyState);
        break;
      }
    } catch {
      failed = true;
      toast.error("অনলাইনে সেভ হয়নি — আবার চেষ্টা হবে");
    } finally {
      busy = false;
      setSync(failed ? "error" : pending.length ? "saving" : "saved");
    }
  };

  let t: ReturnType<typeof setTimeout> | undefined;
  const unsub = subscribe(() => {
    if (!recording) return;
    setSync("saving");
    clearTimeout(t);
    t = setTimeout(() => void flush(), 600);
  });
  if (pending.length) void flush();

  // pick up other staff members' changes
  const poll = setInterval(async () => {
    if (busy || pending.length) return void flush();
    const { data } = await supabase
      .from("shop_data")
      .select("version")
      .eq("shop_id", shopId)
      .single();
    if (data && data.version > version && !busy && !pending.length) {
      const remote = await fetchRemote();
      version = remote.version;
      applyRemote(remote.data as PharmacyState);
    }
  }, 5000);

  return () => {
    stopped = true;
    recording = false;
    clearTimeout(t);
    clearInterval(poll);
    unsub();
    pending.length = 0;
    session = null;
    emit();
  };
}

original["__initial"] = () => null;
