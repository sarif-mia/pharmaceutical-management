import { useEffect, useState, type ReactNode } from "react";
import { Pill } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { startCloudSync } from "@/lib/cloud-sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";

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
    if (!user) { setReady(false); return; }
    let stop: (() => void) | undefined;
    startCloudSync(user.id).then((s) => { stop = s; setReady(true); }).catch(() => { toast.error("অনলাইন তথ্য আনা যায়নি"); setReady(true); });
    return () => stop?.();
  }, [user?.id]);

  if (user === undefined || (user && !ready)) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">লোড হচ্ছে…</div>;
  if (!user) return <Login />;
  return <>{children}</>;
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password"));
    setBusy(true);
    const { data, error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return void toast.error(error.message);
    if (mode === "up" && !data.session) toast.success("ইমেইলে পাঠানো লিংকে ক্লিক করে অ্যাকাউন্ট চালু করুন");
  };
  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google দিয়ে লগইন হয়নি");
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Toaster richColors position="top-right" />
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Pill className="h-5 w-5" /></span>
          <div><div className="font-display text-xl font-semibold">ফার্মেসি ম্যানেজার</div><div className="text-xs text-muted-foreground">{mode === "in" ? "লগইন করুন" : "নতুন অ্যাকাউন্ট খুলুন"}</div></div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input name="email" type="email" placeholder="ইমেইল" required />
          <Input name="password" type="password" placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" minLength={6} required />
          <Button className="w-full" disabled={busy}>{mode === "in" ? "লগইন" : "অ্যাকাউন্ট খুলুন"}</Button>
        </form>
        <Button variant="outline" className="mt-3 w-full" onClick={google}>Google দিয়ে চালিয়ে যান</Button>
        <button className="mt-4 w-full text-center text-sm text-primary underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "অ্যাকাউন্ট নেই? নতুন খুলুন" : "অ্যাকাউন্ট আছে? লগইন করুন"}
        </button>
      </div>
    </div>
  );
}
