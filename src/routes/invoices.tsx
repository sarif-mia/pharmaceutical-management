import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, MessageCircle, Printer, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { PageTitle, tdCls, thCls } from "@/components/shared/page-ui";
import { Receipt } from "@/components/Receipt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/meta";
import { actions, PAYMENT_LABEL, taka, usePharmacy, type Sale } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/invoices")({
  head: pageHead("ইনভয়েস", "সব বিক্রির ইনভয়েস খুঁজুন, দেখুন, প্রিন্ট, WhatsApp ও ফেরত নিন।"),
  component: Invoices,
});

function Invoices() {
  const { sales, customers, settings } = usePharmacy();
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [view, setView] = useState<Sale | null>(null);
  const [ret, setRet] = useState<Sale | null>(null);
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
        <Input type="date" className="w-full sm:w-44" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-2 md:hidden">
        {list.map((x) => (
          <button key={x.id} type="button" onClick={() => setView(x)} className="w-full rounded-xl border border-border bg-card p-3 text-left active:bg-muted/50">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-sm font-semibold">{x.invoice}</span>
              <span className="shrink-0 font-semibold">{taka(x.total)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="min-w-0 truncate">{cust(x.customerId)?.name ?? "সাধারণ"} · {x.date} {x.time}</span>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 font-semibold text-foreground">{PAYMENT_LABEL[x.method]}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate text-muted-foreground">{x.items.map((i) => `${i.name}×${i.qty}`).join(", ")}</span>
              {x.due > 0 && <span className="shrink-0 font-semibold text-destructive">বাকি {taka(x.due)}</span>}
            </div>
          </button>
        ))}
        {!list.length && <p className="rounded-xl border border-border bg-card py-8 text-center text-sm text-muted-foreground">কোনো ইনভয়েস নেই</p>}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card md:block">
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
          <div className="no-print grid grid-cols-3 gap-2">
            <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> প্রিন্ট</Button>
            <Button variant="outline" onClick={() => view && shareWhatsApp(view, cust(view.customerId)?.phone ?? "", settings.shopName)}><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
            <Button variant="outline" onClick={() => { setRet(view); setView(null); }}><Undo2 className="h-4 w-4" /> ফেরত</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ReturnDialog sale={ret} onClose={() => setRet(null)} />
    </>
  );
}

function shareWhatsApp(sale: Sale, phone: string, shop: string) {
  const lines = sale.items.map((i) => `${i.name} x${i.qty} = ${taka(i.qty * i.price)}`).join("\n");
  const text = `${shop}\nইনভয়েস: ${sale.invoice} (${sale.date})\n\n${lines}\n\nমোট: ${taka(sale.total)}\nপরিশোধ: ${taka(sale.paid)}${sale.due > 0 ? `\nবাকি: ${taka(sale.due)}` : ""}\nধন্যবাদ!`;
  let num = phone.replace(/\D/g, "");
  if (num.startsWith("01")) num = `88${num}`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
}

function ReturnDialog({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const close = () => { setQty({}); onClose(); };
  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>ওষুধ ফেরত · {sale?.invoice}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {sale?.items.map((i) => (
            <div key={i.medicineId} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
              <div className="min-w-0"><p className="truncate font-medium">{i.name}</p><p className="text-xs text-muted-foreground">বিক্রি {i.qty}টি · {taka(i.price)}</p></div>
              <Input type="number" min={0} max={i.qty} className="w-20" value={qty[i.medicineId] ?? ""} placeholder="0"
                onChange={(e) => setQty({ ...qty, [i.medicineId]: Math.min(i.qty, Math.max(0, Number(e.target.value) || 0)) })} />
            </div>
          ))}
        </div>
        <Button onClick={() => {
          if (!sale) return;
          const r = actions.returnSale(sale.id, Object.entries(qty).map(([medicineId, q]) => ({ medicineId, qty: q })));
          if (typeof r === "string") { toast.error(r); return; }
          toast.success(r.refund > 0 ? `ফেরত হলো · কাস্টমারকে ${taka(r.refund)} ফেরত দিন` : "ফেরত হলো · বাকি থেকে কেটে নেওয়া হয়েছে");
          close();
        }}>ফেরত নিশ্চিত করুন</Button>
      </DialogContent>
    </Dialog>
  );
}
