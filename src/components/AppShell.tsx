import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { canOpen, ROLE_LABEL, useShop } from "@/lib/cloud-sync";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Pill, ShoppingCart, Truck, Tags, Menu, X, Cross, Receipt, PackagePlus, Users, Wallet, BarChart3, Settings, LogOut, UserCog,
} from "lucide-react";
import { loadFromStorage, usePharmacy } from "@/lib/pharmacy-store";
import { Toaster } from "@/components/ui/sonner";

const groups = [
  { title: "প্রধান", items: [
    { to: "/", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
    { to: "/sales", label: "বিক্রি (POS)", icon: ShoppingCart },
    { to: "/invoices", label: "ইনভয়েস", icon: Receipt },
  ] },
  { title: "স্টক", items: [
    { to: "/medicines", label: "ওষুধ ও স্টক", icon: Pill },
    { to: "/purchases", label: "ক্রয় / চালান", icon: PackagePlus },
    { to: "/categories", label: "ক্যাটাগরি", icon: Tags },
  ] },
  { title: "খাতা", items: [
    { to: "/customers", label: "কাস্টমার ও বাকি", icon: Users },
    { to: "/suppliers", label: "সাপ্লায়ার", icon: Truck },
    { to: "/expenses", label: "খরচ", icon: Wallet },
    { to: "/reports", label: "রিপোর্ট", icon: BarChart3 },
    { to: "/staff", label: "কর্মচারী", icon: UserCog },
    { to: "/settings", label: "সেটিংস", icon: Settings },
  ] },
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { settings } = usePharmacy();
  const shop = useShop();
  const path = useLocation({ select: (l) => l.pathname });
  const role = shop?.role ?? "cashier";
  useEffect(() => loadFromStorage(), []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto bg-sidebar text-sidebar-foreground transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Cross className="h-5 w-5" strokeWidth={3} />
          </div>
          <div>
            <div className="font-display text-lg font-semibold leading-none text-sidebar-accent-foreground">{settings.shopName}</div>
            <div className="mt-1 text-xs opacity-70">ফার্মেসি ম্যানেজার{shop ? ` · ${ROLE_LABEL[shop.role]}` : ""}</div>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setOpen(false)} aria-label="মেনু বন্ধ">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-5 px-3 pb-8">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="px-4 pb-1.5 text-[11px] font-semibold uppercase tracking-widest opacity-50">{g.title}</div>
              <div className="space-y-0.5">
                {g.items.filter((i) => canOpen(role, i.to)).map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: to === "/" }}
                    className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent"
                    activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" }}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <button
          onClick={async () => { const { supabase } = await import("@/integrations/supabase/client"); await supabase.auth.signOut(); }}
          className="mx-4 mb-4 mt-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium hover:bg-sidebar-accent"
        ><LogOut className="h-4 w-4" /> লগআউট</button>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex items-center gap-3 border-b border-border px-5 py-4 md:hidden">
          <button onClick={() => setOpen(true)} aria-label="মেনু খুলুন">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-lg font-semibold">{settings.shopName}</span>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 md:px-10 md:py-10">
          {canOpen(role, path) ? <Outlet /> : <div className="py-20 text-center text-muted-foreground">এই পাতা দেখার অনুমতি আপনার নেই</div>}
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="no-print mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, className = "", action }: { title?: React.ReactNode; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="flex items-center gap-2 font-display text-lg font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, icon: Icon, tone = "bg-secondary text-secondary-foreground" }: { label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }>; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-2xl font-semibold md:text-3xl">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
export const thCls = "px-4 py-3 text-left font-medium";
export const tdCls = "px-4 py-3";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{text}</div>;
}
