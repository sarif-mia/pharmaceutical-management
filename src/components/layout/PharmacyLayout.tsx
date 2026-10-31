import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, ChevronRight, Ellipsis, LogOut, Maximize2, Minimize2, Moon, Plus, Search, Sun } from "lucide-react";
import { canOpen, ROLE_LABEL, useShop, useSyncStatus } from "@/lib/cloud-sync";
import { expiresSoon, isExpired, isLow, taka, usePharmacy } from "@/lib/pharmacy-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { BrandMark } from "@/components/shared/BrandMark";
import { allNavigation, mobileCenter, mobileLeft, mobileRight, navigationGroups } from "./navigation";
import { GlobalSearch } from "./GlobalSearch";

const SYNC = { saved: ["bg-primary", "সেভ হয়েছে"], saving: ["bg-warning animate-pulse", "সেভ হচ্ছে…"], error: ["bg-destructive", "সেভ হয়নি"] } as const;
function SyncDot() {
  const s = useSyncStatus();
  const [c, t] = SYNC[s];
  return <span className="ml-1.5 inline-flex items-center gap-1" title={t}><span className={`inline-block h-1.5 w-1.5 rounded-full ${c}`} />{t}</span>;
}

function AlertBell() {
  const { medicines, settings } = usePharmacy();
  const n = medicines.filter((m) => isExpired(m) || expiresSoon(m, settings.expiryDays) || isLow(m, settings)).length;
  return <Link to="/medicines" aria-label={`${n}টি ওষুধে সতর্কতা`} title="কম স্টক বা মেয়াদ সতর্কতা" className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-muted"><Bell className="h-5 w-5" />{n > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{n > 99 ? "99+" : n}</span>}</Link>;
}

function TodaySales() {
  const { sales } = usePharmacy();
  const d = new Date().toISOString().slice(0, 10);
  const list = sales.filter((s) => s.date.startsWith(d));
  return <div className="hidden text-right leading-tight lg:block"><p className="text-[11px] text-muted-foreground">আজকের বিক্রি · {list.length}টি</p><p className="font-display text-sm font-semibold tabular-nums">{taka(list.reduce((a, s) => a + s.total, 0))}</p></div>;
}

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(localStorage.getItem("theme") === "dark"); }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  const toggle = () => setDark((v) => { localStorage.setItem("theme", v ? "light" : "dark"); return !v; });
  return [dark, toggle] as const;
}

export function PharmacyLayout() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [counter, setCounter] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const { settings } = usePharmacy();
  const shop = useShop();
  const role = shop?.role ?? "cashier";
  const path = useLocation({ select: (l) => l.pathname });
  const current = allNavigation.find((i) => i.to === path);
  const signOut = async () => { const { supabase } = await import("@/integrations/supabase/client"); await supabase.auth.signOut(); };
  const ThemeIcon = dark ? Sun : Moon;

  const nav = (mobile = false) => <nav aria-label={mobile ? "সব পাতা" : "প্রধান মেনু"} className="space-y-5">{navigationGroups.map((group) => {
    const visible = group.items.filter((i) => canOpen(role, i.to));
    if (!visible.length) return null;
    return <div key={group.title}><p className="mb-2 px-3 text-xs font-medium opacity-60">{group.title}</p><div className={mobile ? "grid grid-cols-3 gap-2" : "space-y-1"}>{visible.map(({ to, label, shortLabel, icon: Icon }) => mobile
      ? <Link key={to} to={to} onClick={() => setOpen(false)} activeOptions={{ exact: true }} className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-3 text-center text-xs font-medium" activeProps={{ className: "border-primary bg-primary/10 text-primary" }}><Icon className="h-5 w-5 shrink-0" /><span className="truncate">{shortLabel}</span></Link>
      : <Link key={to} to={to} activeOptions={{ exact: true }} className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground" }}><Icon className="h-4 w-4 shrink-0" /><span>{label}</span></Link>)}</div></div>;
  })}</nav>;

  const tab = ({ to, shortLabel, icon: Icon }: (typeof allNavigation)[number]) => canOpen(role, to) && <Link key={to} to={to} activeOptions={{ exact: true }} className="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium text-muted-foreground" activeProps={{ className: "text-primary" }}><Icon className="h-5 w-5 shrink-0" />{shortLabel}</Link>;
  const inBar = [...mobileLeft, mobileCenter, ...mobileRight].some((i) => i.to === path);

  return <div className={`flex min-h-dvh bg-background text-foreground ${counter ? "counter-mode" : ""}`}>
    <aside className="no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex min-w-0 items-center gap-3 px-5 py-5"><BrandMark className="h-9 w-9" /><div className="min-w-0"><p className="truncate text-base font-semibold">{settings.shopName}</p><p className="mt-1 text-xs opacity-60">{ROLE_LABEL[role]}<SyncDot /></p></div></div>
      <div className="flex-1 overflow-y-auto px-3 pb-5">{nav()}</div>
      <Button variant="ghost" onClick={signOut} className="mx-3 mb-4 justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"><LogOut className="h-4 w-4" />লগআউট</Button>
    </aside>
    <div className="min-w-0 flex-1">
      {/* Desktop top bar */}
      <header className="no-print sticky top-0 z-20 hidden h-14 items-center gap-3 border-b border-border bg-card/95 px-6 backdrop-blur md:flex">
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          {counter && <span className="mr-2 font-semibold text-foreground">{settings.shopName}</span>}
          <span className="truncate">{current?.group ?? "পাতা"}</span><ChevronRight className="h-3.5 w-3.5 shrink-0" /><span className="truncate font-medium text-foreground">{current?.label ?? ""}</span>
        </div>
        <button onClick={() => setSearch(true)} className="ml-auto flex h-9 w-64 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-muted lg:w-80"><Search className="h-4 w-4" />খুঁজুন…<kbd className="ml-auto rounded border border-border bg-muted px-1.5 text-[10px] font-medium">Ctrl K</kbd></button>
        <TodaySales />
        {canOpen(role, "/sales") && <Button asChild size="sm"><Link to="/sales"><Plus className="h-4 w-4" />নতুন বিক্রি</Link></Button>}
        <Button size="icon" variant="ghost" onClick={() => setCounter((v) => !v)} aria-label={counter ? "সাধারণ মোড" : "কাউন্টার মোড"} title={counter ? "মেনু দেখান" : "কাউন্টার মোড (মেনু লুকান)"}>{counter ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</Button>
        <Button size="icon" variant="ghost" onClick={toggleDark} aria-label="থিম বদলান" title={dark ? "দিনের থিম" : "রাতের থিম"}><ThemeIcon className="h-4 w-4" /></Button>
        <AlertBell />
      </header>
      {/* Mobile header */}
      <header className="no-print sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
        <div className="flex min-w-0 items-center gap-2.5"><BrandMark className="h-8 w-8" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{settings.shopName}</p><p className="text-[11px] text-muted-foreground">{ROLE_LABEL[role]}<SyncDot /></p></div></div>
        <div className="flex items-center"><Button size="icon" variant="ghost" onClick={() => setSearch(true)} aria-label="খুঁজুন"><Search className="h-5 w-5" /></Button><Button size="icon" variant="ghost" onClick={toggleDark} aria-label="থিম বদলান"><ThemeIcon className="h-5 w-5" /></Button><AlertBell /></div>
      </header>
      <main className="pharmacy-content mx-auto w-full max-w-7xl px-4 py-5 pb-28 sm:px-6 md:px-8 md:py-7">{canOpen(role, path) ? <Outlet /> : <div className="py-20 text-center text-muted-foreground">এই পাতা দেখার অনুমতি আপনার নেই</div>}</main>
    </div>
    {/* Mobile bottom bar with raised center POS button */}
    <nav aria-label="মোবাইল মেনু" className="mobile-navigation no-print fixed inset-x-0 bottom-0 z-30 flex items-end justify-around border-t border-border bg-card px-2 pt-1.5 md:hidden">
      {mobileLeft.map(tab)}
      {canOpen(role, mobileCenter.to) && <Link to={mobileCenter.to} className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[11px] font-semibold text-primary"><span className="-mt-6 grid h-14 w-14 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg"><mobileCenter.icon className="h-6 w-6" /></span>{mobileCenter.shortLabel}</Link>}
      {mobileRight.map(tab)}
      <Button variant="ghost" aria-label="আরও পাতা" aria-expanded={open} onClick={() => setOpen(true)} className={`h-12 min-w-0 flex-1 flex-col gap-1 px-1 text-[11px] ${!inBar ? "text-primary" : "text-muted-foreground"}`}><Ellipsis className="h-5 w-5" />আরও</Button>
    </nav>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-xl px-4 pb-8 pt-5"><SheetHeader className="mb-5 text-left"><SheetTitle>{settings.shopName}</SheetTitle><SheetDescription>{ROLE_LABEL[role]}</SheetDescription></SheetHeader>{nav(true)}<Button variant="outline" className="mt-5 w-full" onClick={signOut}><LogOut className="h-4 w-4" />লগআউট</Button></SheetContent></Sheet>
    <GlobalSearch open={search} onOpenChange={setSearch} role={role} />
    <Toaster richColors position="top-right" />
  </div>;
}
