import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { startCloudSync } from "@/lib/cloud-sync";
import { AppSkeleton } from "@/components/shared/AppSkeleton";
import { LoginScreen } from "@/components/LoginScreen";

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT" || e === "USER_UPDATED") setUser(s?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setReady(false);
      return;
    }
    let stop: (() => void) | undefined;
    startCloudSync()
      .then((s) => {
        stop = s;
        setReady(true);
      })
      .catch(() => {
        toast.error("অনলাইন তথ্য আনা যায়নি");
        setReady(true);
      });
    return () => stop?.();
  }, [user?.id]);

  if (user === undefined || (user && !ready)) return <AppSkeleton />;
  if (!user) return <LoginScreen />;
  return <>{children}</>;
}
