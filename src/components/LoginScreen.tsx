import { useState } from "react";
import { toast } from "sonner";
import {
  BookOpenCheck,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Lock,
  Mail,
  ScanBarcode,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { APP_NAME } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { BrandMark } from "@/components/shared/BrandMark";

const FEATURES = [
  {
    icon: ScanBarcode,
    title: "দ্রুত বিক্রি ও রসিদ",
    text: "নাম, জেনেরিক বা বারকোড দিয়ে খুঁজে সেকেন্ডে বিল, সেবনবিধিসহ রসিদ।",
  },
  {
    icon: Layers,
    title: "ব্যাচ ও মেয়াদ ট্র্যাকিং",
    text: "আগে মেয়াদ শেষ হবে এমন ব্যাচ আগে বিক্রি, মেয়াদোত্তীর্ণ ওষুধ আটকে যায়।",
  },
  {
    icon: BookOpenCheck,
    title: "বাকি খাতা ও দিনশেষ হিসাব",
    text: "ক্যাশ, বিকাশ, নগদ মিলিয়ে দিন শেষ করুন, কাস্টমারের বাকি এক নজরে।",
  },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function LoginScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState<"form" | "google" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const signUp = mode === "up";

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")),
      password = String(f.get("password"));
    setBusy("form");
    const { data, error } = signUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(null);
    if (error) return void toast.error(error.message);
    if (signUp && !data.session)
      toast.success("ইমেইলে পাঠানো লিংকে ক্লিক করে অ্যাকাউন্ট চালু করুন");
  };

  const google = async () => {
    setBusy("google");
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) {
      setBusy(null);
      toast.error("Google দিয়ে লগইন হয়নি");
    }
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="grid min-h-dvh grid-cols-1 bg-background lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel (desktop) */}
        <aside className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary/40 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <BrandMark className="h-11 w-11" />
            <span className="font-display text-xl font-semibold">{APP_NAME}</span>
          </div>

          <div className="relative max-w-md">
            <h1 className="font-display text-4xl font-semibold leading-tight xl:text-5xl">
              ফার্মেসির প্রতিদিনের হিসাব, <span className="text-accent">এক জায়গায়।</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed opacity-75">
              স্টক, বিক্রি, সাপ্লায়ার আর বাকি খাতা — কাউন্টার থেকে দিনশেষ পর্যন্ত সব মিলে যায়।
            </p>
            <ul className="mt-10 space-y-5">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed opacity-70">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative flex items-center gap-2 text-sm opacity-70">
            <Users className="h-4 w-4 shrink-0" />
            কর্মচারীরা মালিকের দেওয়া ইমেইলে লগইন করলেই দোকানে যুক্ত হয়ে যাবেন।
          </p>
        </aside>

        {/* Form */}
        <main className="flex min-w-0 flex-col items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <BrandMark className="h-11 w-11" />
              <div>
                <p className="font-display text-xl font-semibold">{APP_NAME}</p>
                <p className="text-xs text-muted-foreground">স্টক, বিক্রি ও হিসাব এক জায়গায়</p>
              </div>
            </div>

            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              {signUp ? "নতুন অ্যাকাউন্ট খুলুন" : "আবার স্বাগতম"}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {signUp
                ? "মালিক হলে আপনার নতুন দোকান তৈরি হবে। কর্মচারী হলে মালিকের দেওয়া ইমেইলটি ব্যবহার করুন।"
                : "আপনার দোকানের হিসাব দেখতে লগইন করুন।"}
            </p>

            <div
              role="tablist"
              aria-label="লগইন বা নতুন অ্যাকাউন্ট"
              className="mt-6 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm font-medium"
            >
              {(["in", "up"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`rounded-md py-2 transition-colors ${
                    mode === m
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "in" ? "লগইন" : "নতুন অ্যাকাউন্ট"}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-6 h-11 w-full"
              onClick={google}
              disabled={busy !== null}
            >
              {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              Google দিয়ে চালিয়ে যান
            </Button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              অথবা ইমেইল দিয়ে
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">ইমেইল</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-11 pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">পাসওয়ার্ড</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={signUp ? "new-password" : "current-password"}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    minLength={6}
                    className="h-11 pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
                    className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button className="h-11 w-full text-base" disabled={busy !== null}>
                {busy === "form" && <Loader2 className="h-4 w-4 animate-spin" />}
                {signUp ? "অ্যাকাউন্ট খুলুন" : "লগইন"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {signUp ? "আগে থেকেই অ্যাকাউন্ট আছে?" : "অ্যাকাউন্ট নেই?"}{" "}
              <button
                type="button"
                onClick={() => setMode(signUp ? "in" : "up")}
                className="font-semibold text-primary hover:underline"
              >
                {signUp ? "লগইন করুন" : "নতুন খুলুন"}
              </button>
            </p>
          </div>

          <p className="mt-10 text-xs text-muted-foreground lg:hidden">
            কর্মচারীরা মালিকের দেওয়া ইমেইলে লগইন করলেই দোকানে যুক্ত হবেন।
          </p>
        </main>
      </div>
    </>
  );
}
