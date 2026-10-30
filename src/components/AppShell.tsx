import { Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Pill, ShoppingCart, Truck, Tags, Menu, X, Cross } from "lucide-react";
import { loadFromStorage } from "@/lib/pharmacy-store";
import { Toaster } from "@/components/ui/sonner";

const nav = [
  { to: "/", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { to: "/medicines", label: "ওষুধ ও স্টক", icon: Pill },
  { to: "/sales", label: "বিক্রি", icon: ShoppingCart },
  { to: "/suppliers", label: "সাপ্লায়ার", icon: Truck },
  { to: "/categories", label: "ক্যাটাগরি", icon: Tags },
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  useEffect(() => loadFromStorage(), []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 px-6 py-7">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Cross className="h-5 w-5" strokeWidth={3} />
          </div>
          <div>
            <div className="font-display text-xl font-semibold leading-none text-sidebar-accent-foreground">শেফা ফার্মেসি</div>
            <div className="mt-1 text-xs opacity-70">ম্যানেজমেন্ট</div>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setOpen(false)} aria-label="মেনু বন্ধ">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 px-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-5 py-4 md:hidden">
          <button onClick={() => setOpen(true)} aria-label="মেনু খুলুন">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-lg font-semibold">শেফা ফার্মেসি</span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-10 md:py-10">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
