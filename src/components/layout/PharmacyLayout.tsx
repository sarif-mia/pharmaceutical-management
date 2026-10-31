import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Cross, Ellipsis, LogOut } from "lucide-react";
import { canOpen, ROLE_LABEL, useShop, useSyncStatus } from "@/lib/cloud-sync";

const SYNC = { saved: ["bg-primary", "সেভ হয়েছে"], saving: ["bg-warning animate-pulse", "সেভ হচ্ছে…"], error: ["bg-destructive", "সেভ হয়নি"] } as const;
function SyncDot() {
  const s = useSyncStatus();
  const [c, t] = SYNC[s];
  return <span className="ml-1.5 inline-flex items-center gap-1" title={t}><span className={`inline-block h-1.5 w-1.5 rounded-full ${c}`} />{t}</span>;
}
import { expiresSoon, isExpired, isLow, usePharmacy } from "@/lib/pharmacy-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { navigationGroups, primaryNavigation } from "./navigation";

function AlertBell() {
  const { medicines, settings } = usePharmacy();
  const n = medicines.filter((m) => isExpired(m) || expiresSoon(m, settings.expiryDays) || isLow(m, settings)).length;
  return <Link to="/medicines" aria-label={`${n}টি ওষুধে সতর্কতা`} title="কম স্টক বা মেয়াদ সতর্কতা" className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-muted"><Bell className="h-5 w-5" />{n > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{n > 99 ? "99+" : n}</span>}</Link>;
}

export function PharmacyLayout() {
  const [open, setOpen] = useState(false);
  const { settings } = usePharmacy();
  const shop = useShop();
  const role = shop?.role ?? "cashier";
  const path = useLocation({ select: (l) => l.pathname });
  const items = primaryNavigation.filter((i) => canOpen(role, i.to));
  const signOut = async () => { const { supabase } = await import("@/integrations/supabase/client"); await supabase.auth.signOut(); };
  const nav = (mobile = false) => <nav aria-label={mobile ? "সব পাতা" : "প্রধান মেনু"} className="space-y-5">{navigationGroups.map((group) => {
    const visible = group.items.filter((i) => canOpen(role, i.to));
    if (!visible.length) return null;
    return <div key={group.title}><p className="mb-2 px-3 text-xs font-medium opacity-60">{group.title}</p><div className={mobile ? "grid grid-cols-2 gap-2" : "space-y-1"}>{visible.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} activeOptions={{ exact: true }} className={`flex min-w-0 items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors ${mobile ? "bg-muted hover:bg-secondary" : "hover:bg-sidebar-accent"}`} activeProps={{ className: mobile ? "bg-primary text-primary-foreground" : "bg-sidebar-primary text-sidebar-primary-foreground" }}><Icon className="h-4 w-4 shrink-0" /><span>{label}</span></Link>)}</div></div>;
  })}</nav>;
  return <div className="flex min-h-dvh bg-background text-foreground">
    <aside className="no-print sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex min-w-0 items-center gap-3 px-5 py-6"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Cross className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-base font-semibold">{settings.shopName}</p><p className="mt-1 text-xs opacity-60">{ROLE_LABEL[role]}<SyncDot /></p></div><div className="ml-auto"><AlertBell /></div></div>
      <div className="flex-1 overflow-y-auto px-3 pb-5">{nav()}</div>
      <Button variant="ghost" onClick={signOut} className="mx-3 mb-4 justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"><LogOut className="h-4 w-4" />লগআউট</Button>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="no-print sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
        <div className="flex min-w-0 items-center gap-2.5"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Cross className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{settings.shopName}</p><p className="text-[11px] text-muted-foreground">{ROLE_LABEL[role]}<SyncDot /></p></div></div>
        <div className="flex items-center gap-1"><AlertBell /><Button size="icon" variant="ghost" onClick={() => setOpen(true)} aria-label="সব পাতা খুলুন"><Ellipsis className="h-5 w-5" /></Button></div>
      </header>
      <main className="pharmacy-content mx-auto w-full max-w-7xl px-4 py-5 pb-28 sm:px-6 md:px-8 md:py-8">{canOpen(role, path) ? <Outlet /> : <div className="py-20 text-center text-muted-foreground">এই পাতা দেখার অনুমতি আপনার নেই</div>}</main>
    </div>
    <nav aria-label="মোবাইল মেনু" className="mobile-navigation no-print fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card px-2 pt-2 md:hidden">
      {items.map(({ to, shortLabel, icon: Icon }) => <Link key={to} to={to} activeOptions={{ exact: true }} className="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium text-muted-foreground" activeProps={{ className: "bg-primary/10 text-primary" }}><Icon className="h-5 w-5 shrink-0" />{shortLabel}</Link>)}
      <Button variant="ghost" aria-label="আরও পাতা" aria-expanded={open} onClick={() => setOpen(true)} className={`h-12 min-w-0 flex-1 flex-col gap-1 px-1 text-[11px] ${!items.some((i) => i.to === path) ? "text-primary" : "text-muted-foreground"}`}><Ellipsis className="h-5 w-5" />আরও</Button>
    </nav>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-lg px-4 pb-8 pt-5"><SheetHeader className="mb-5 text-left"><SheetTitle>{settings.shopName}</SheetTitle><SheetDescription>{ROLE_LABEL[role]}</SheetDescription></SheetHeader>{nav(true)}<Button variant="outline" className="mt-5 w-full" onClick={signOut}><LogOut className="h-4 w-4" />লগআউট</Button></SheetContent></Sheet>
    <Toaster richColors position="top-right" />
  </div>;
}