import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Printer, Search } from "lucide-react";
import { PageTitle, tdCls, thCls } from "@/components/AppShell";
import { Receipt } from "@/components/Receipt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/meta";
import { PAYMENT_LABEL, taka, usePharmacy, type Sale } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/invoices")({
  head: pageHead("ইনভয়েস", "সব বিক্রির ইনভয়েস খুঁজুন, দেখুন ও আবার প্রিন্ট করুন।"),
  component: Invoices,
});

function Invoices() {
  const { sales, customers } = usePharmacy();
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [view, setView] = useState<Sale | null>(null);
  const cust = (id: string | null) => customers.find((c) => c.id === id);
  const s = q.toLowerCase();
  const list = sales.filter((x) => (!date || x.date === date) && (!s || x.invoice.toLowerCase().includes(s) || x.items.some((i) => i.name.toLowerCase().includes(s)) || (cust(x.customerId)?.name ?? "").includes(q)));
  const total = list.reduce((a, x) => a + x.total, 0);

  return (
    <>
      <PageTitle title="ইনভয়েস" subtitle={`${list.length}টি ইনভয়েস · মোট ${taka(total)}`} />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="ইনভয়েস নং, ওষুধ বা কাস্টমার…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Input type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr><th className={thCls}>ইনভয়েস</th><th className={thCls}>তারিখ</th><th className={thCls}>কাস্টমার</th><th className={thCls}>আইটেম</th><th className={thCls}>পেমেন্ট</th><th className={thCls}>মোট</th><th className={thCls}>বাকি</th><th className={thCls}></th></tr>
          </thead>
          <tbody>
            {list.map((x) => (
              <tr key={x.id} className="border-t border-border hover:bg-muted/40">
                <td className={`${tdCls} font-mono font-semibold`}>{x.invoice}</td>
                <td className={tdCls}>{x.date} <span className="text-muted-foreground">{x.time}</span></td>
                <td className={tdCls}>{cust(x.customerId)?.name ?? "সাধারণ"}</td>
                <td className={`${tdCls} max-w-64 truncate`}>{x.items.map((i) => `${i.name}×${i.qty}`).join(", ")}</td>
                <td className={tdCls}><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">{PAYMENT_LABEL[x.method]}</span></td>
                <td className={`${tdCls} font-semibold`}>{taka(x.total)}</td>
                <td className={`${tdCls} ${x.due > 0 ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{x.due > 0 ? taka(x.due) : "—"}</td>
                <td className={tdCls}><Button size="icon" variant="ghost" onClick={() => setView(x)} aria-label="দেখুন"><Eye className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">কোনো ইনভয়েস নেই</td></tr>}
          </tbody>
        </table>
      </div>
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="no-print">{view?.invoice}</DialogTitle></DialogHeader>
          {view && <div className="print-area"><Receipt sale={view} /></div>}
          <Button className="no-print" onClick={() => window.print()}><Printer className="h-4 w-4" /> প্রিন্ট</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
