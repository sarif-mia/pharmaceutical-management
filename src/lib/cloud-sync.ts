import { supabase } from "@/integrations/supabase/client";
import { actions, getState, loadFromStorage, subscribe, type PharmacyState } from "@/lib/pharmacy-store";

/** Loads the signed-in user's data from Lovable Cloud, then saves every change back (debounced). */
export async function startCloudSync(userId: string): Promise<() => void> {
  loadFromStorage();
  const { data, error } = await supabase.from("pharmacy_data").select("data").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (data && data.data && Object.keys(data.data as object).length) actions.importData(data.data as unknown as PharmacyState);
  else await supabase.from("pharmacy_data").upsert({ user_id: userId, data: getState() as never });
  let t: ReturnType<typeof setTimeout> | undefined;
  const unsub = subscribe(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      void supabase.from("pharmacy_data").upsert({ user_id: userId, data: getState() as never, updated_at: new Date().toISOString() });
    }, 800);
  });
  return () => { clearTimeout(t); unsub(); };
}
