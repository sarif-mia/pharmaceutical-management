import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, Printer, Search, ShoppingCart, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Field, PageTitle, Panel, selectCls } from "@/components/shared/page-ui";
import { Receipt } from "@/components/Receipt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/meta";
import { actions, alternatives, packOf, isExpired, PAYMENT_LABEL, taka, usePharmacy, type CartLine, type PaymentMethod, type Sale } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/sales")({
  head: pageHead("বিক্রি (POS)", "নাম, জেনেরিক বা বারকোড দিয়ে খুঁজে দ্রুত বিল করুন, রসিদ প্রিন্ট করুন।"),
  component: POS,
});

function POS() {
  const { medicines, customers } = usePharmacy();
  const [q, setQ] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [customerId, setCustomerId] = useState("");
  const [done, setDone] = useState<Sale | null>(null);
  const [newCust, setNewCust] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = medicines.filter((m) => !s || m.name.toLowerCase().includes(s) || m.generic.toLowerCase().includes(s) || m.barcode === s || m.company.toLowerCase().includes(s));
    return list.slice(0, 30);
  }, [q, medicines]);

  const lines = cart.flatMap((l) => { const m = medicines.find((m) => m.id === l.medicineId); return m ? [{ ...l, m }] : []; });
  const subtotal = lines.reduce((a, l) => a + l.qty * l.m.price, 0);
  const total = Math.max(0, subtotal - discount);
  const paidNum = paid === "" ? total : Number(paid);
  const change = paidNum > total ? paidNum - total : 0;
  const due = Math.max(0, total - paidNum);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const add = (id: string, n = 1) => {
    const m = medicines.find((x) => x.id === id);
    if (!m) return;
    if (isExpired(m)) return void toast.error(`${m.name} এর মেয়াদ শেষ`);
    const inCart = cart.find((c) => c.medicineId === id)?.qty ?? 0;
    if (inCart + n > m.stock) return void toast.error(`স্টকে মাত্র ${m.stock}টি আছে`);
    setCart((c) => (inCart ? c.map((x) => (x.medicineId === id ? { ...x, qty: x.qty + n } : x)) : [...c, { medicineId: id, qty: n }]));
  };
  const setQty = (id: string, qty: number) => {
    const m = medicines.find((x) => x.id === id);
    if (!m) return;
    const v = Math.max(1, Math.min(m.stock, Math.floor(qty) || 1));
    setCart((c) => c.map((x) => (x.medicineId === id ? { ...x, qty: v } : x)));
  };

  const checkout = () => {
    const r = actions.checkout({ lines: cart, discount, paid: Math.min(paidNum, total), method, customerId: customerId || null });
    if (typeof r === "string") return void toast.error(r);
    toast.success(`বিক্রি সম্পন্ন — ${taka(r.total)}`);
    setDone(r);
    setCartOpen(false); setCart([]); setDiscount(0); setPaid(""); setCustomerId(""); setMethod("cash"); setQ("");
  };

  return (
    <>
      <PageTitle title="বিক্রি (POS)" />
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-md bg-muted p-1 lg:hidden"><Button variant={cartOpen ? "ghost" : "default"} onClick={() => setCartOpen(false)}>ওষুধ</Button><Button variant={cartOpen ? "default" : "ghost"} onClick={() => setCartOpen(true)}><ShoppingCart className="h-4 w-4" />কার্ট ({lines.length})</Button></div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className={cartOpen ? "hidden lg:block" : ""}>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && results[0]) { add(results[0].id); setQ(""); } }}
              placeholder="নাম, জেনেরিক বা বারকোড…"
              className="h-12 pl-10 text-base"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((m) => {
              const bad = isExpired(m) || m.stock <= 0;
              return (
                <div key={m.id} className="flex flex-col gap-1">
                <Button
                  variant="outline"
                  disabled={bad}
                  onClick={() => { add(m.id); searchRef.current?.focus(); }}
                  className="group block h-auto w-full whitespace-normal rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold">{m.name} <span className="text-xs font-normal text-muted-foreground">{m.strength}</span></div>
                      <div className="text-xs text-muted-foreground">{m.generic}</div>
                    </div>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-bold text-primary">{taka(m.price)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{m.form} · {m.company}</span>
                    <span className={m.stock < 20 ? "font-semibold text-destructive" : ""}>{isExpired(m) ? "মেয়াদ শেষ" : `স্টক ${m.stock}`}</span>
                  </div>
                </Button>
                {!bad && packOf(m) > 1 && m.stock >= packOf(m) && (
                  <Button variant="outline" onClick={() => add(m.id, packOf(m))} className="h-8 rounded-md border-dashed border-primary/50 text-xs text-primary">
                    + ১ পাতা ({packOf(m)} পিস) · {taka(m.price * packOf(m))}
                  </Button>
                )}
                {bad && alternatives(medicines, m).length > 0 && (
                  <div className="rounded-lg bg-accent/40 p-1.5 text-xs">
                    <span className="text-muted-foreground">বিকল্প: </span>
                    {alternatives(medicines, m).slice(0, 3).map((a) => (
                      <Button variant="link" key={a.id} onClick={() => add(a.id)} className="mr-1 h-auto p-0 text-xs font-semibold text-primary underline">{a.name} ({taka(a.price)})</Button>
                    ))}
                  </div>
                )}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className={`${cartOpen ? "" : "hidden lg:block"} lg:sticky lg:top-6 lg:self-start`} title={<><ShoppingCart className="h-5 w-5 text-primary" /> কার্ট ({lines.length})</>}>
          {!lines.length ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">কার্ট খালি</div>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {lines.map((l) => (
                <li key={l.medicineId} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-2 text-sm">
                  <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
                    <div className="truncate font-medium">{l.m.name} {l.m.strength}</div>
                    <div className="text-xs text-muted-foreground">{packOf(l.m) > 1 && l.qty >= packOf(l.m) && <span className="mr-1 rounded bg-primary/10 px-1 text-primary">{Math.floor(l.qty / packOf(l.m))} পাতা{l.qty % packOf(l.m) ? ` + ${l.qty % packOf(l.m)} পিস` : ""}</span>}{taka(l.m.price)} × {l.qty} = <b>{taka(l.m.price * l.qty)}</b></div>
                  </div>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.medicineId, l.qty - 1)}><Minus className="h-3 w-3" /></Button>
                  <Input className="h-7 w-14 px-1 text-center" value={l.qty} onChange={(e) => setQty(l.medicineId, Number(e.target.value))} />
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.medicineId, l.qty + 1)}><Plus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setCart((c) => c.filter((x) => x.medicineId !== l.medicineId))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <Field label="কাস্টমার (বাকির জন্য দরকার)">
              <div className="flex gap-2">
                <select className={selectCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">সাধারণ কাস্টমার</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                </select>
                <Button variant="outline" size="icon" onClick={() => setNewCust(true)} aria-label="নতুন কাস্টমার"><UserPlus className="h-4 w-4" /></Button>
              </div>
            </Field>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => (
                <Button key={p} aria-pressed={method === p} size="sm" variant={method === p ? "default" : "outline"} onClick={() => setMethod(p)} className="text-xs">{PAYMENT_LABEL[p]}</Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ছাড় (৳)"><Input type="number" min={0} value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value) || 0)} /></Field>
              <Field label="পরিশোধ (৳)"><Input type="number" min={0} placeholder={total.toFixed(2)} value={paid} onChange={(e) => setPaid(e.target.value)} /></Field>
            </div>
            <div className="space-y-1 rounded-xl bg-muted p-3 text-sm">
              <div className="flex justify-between"><span>সাবটোটাল</span><span>{taka(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between"><span>ছাড়</span><span>- {taka(discount)}</span></div>}
              <div className="flex justify-between font-display text-xl font-semibold"><span>মোট</span><span>{taka(total)}</span></div>
              {change > 0 && <div className="flex justify-between text-primary"><span>ফেরত দিন</span><span>{taka(change)}</span></div>}
              {due > 0 && <div className="flex justify-between font-semibold text-destructive"><span>বাকি</span><span>{taka(due)}</span></div>}
            </div>
            <Button size="lg" className="h-12 w-full text-base" disabled={!lines.length} onClick={checkout}>বিল করুন · {taka(total)}</Button>
          </div>
        </Panel>
      </div>

      {!cartOpen && lines.length > 0 && <div className="pos-cart-bar no-print fixed inset-x-3 z-20 lg:hidden"><Button onClick={() => setCartOpen(true)} className="h-10 w-full justify-between rounded-full px-4 text-sm shadow-lg"><span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />{lines.length}টি আইটেম</span><span className="font-semibold">{taka(total)} →</span></Button></div>}
      <Dialog open={!!done} onOpenChange={(o) => !o && setDone(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="no-print">রসিদ</DialogTitle></DialogHeader>
          {done && <div className="print-area"><Receipt sale={done} /></div>}
          <div className="no-print flex gap-2">
            <Button className="flex-1" onClick={() => window.print()}><Printer className="h-4 w-4" /> প্রিন্ট</Button>
            <Button variant="outline" className="flex-1" onClick={() => setDone(null)}>নতুন বিক্রি</Button>
          </div>
        </DialogContent>
      </Dialog>

      <NewCustomerDialog open={newCust} onClose={() => setNewCust(false)} onCreated={setCustomerId} />
    </>
  );
}

function NewCustomerDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>নতুন কাস্টমার</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const name = String(f.get("name")).trim();
            if (!name) return;
            const id = actions.addCustomer({ name, phone: String(f.get("phone")), address: String(f.get("address")) });
            toast.success("কাস্টমার যোগ হলো");
            onCreated?.(id);
            onClose();
          }}
        >
          <Field label="নাম"><Input name="name" required /></Field>
          <Field label="মোবাইল"><Input name="phone" placeholder="01XXXXXXXXX" /></Field>
          <Field label="ঠিকানা"><Input name="address" /></Field>
          <Button type="submit" className="w-full">সেভ করুন</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
