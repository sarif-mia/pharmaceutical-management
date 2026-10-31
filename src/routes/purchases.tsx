import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field, PageTitle, Panel, selectCls, tdCls, thCls } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/meta";
import { actions, daysFromNow, taka, today, usePharmacy, type PurchaseItem } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/purchases")({
  head: pageHead("ক্রয় / চালান", "সাপ্লায়ারের চালান এন্ট্রি করুন — স্টক, কেনা দাম ও মেয়াদ নিজে থেকেই আপডেট হবে।"),
  component: Purchases,
});

function Purchases() {
  const { purchases, suppliers, medicines } = usePharmacy();
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [paid, setPaid] = useState(0);
  const [note, setNote] = useState("");
  const [row, setRow] = useState({ medicineId: "", qty: 10, cost: 0, expiry: daysFromNow(365), batchNo: "" });
  const total = items.reduce((a, i) => a + i.qty * i.cost, 0);
  const mName = (id: string) => { const m = medicines.find((x) => x.id === id); return m ? `${m.name} ${m.strength}` : "—"; };
  const sName = (id: string) => suppliers.find((s) => s.id === id)?.company ?? "—";
  const sid = supplierId || suppliers[0]?.id || "";

  return (
    <>
      <PageTitle title="ক্রয় / চালান" subtitle="নতুন মাল এলে এখানে এন্ট্রি দিন" />
      <Panel title="নতুন চালান" className="mb-6">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Field label="সাপ্লায়ার"><select className={selectCls} value={sid} onChange={(e) => setSupplierId(e.target.value)}>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.company} — {s.name}</option>)}</select></Field>
          <Field label="চালান নং / নোট"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="চালান #" /></Field>
          <Field label="এখন পরিশোধ (৳)"><Input type="number" min={0} value={paid || ""} onChange={(e) => setPaid(Number(e.target.value) || 0)} /></Field>
        </div>
        <div className="grid gap-3 rounded-xl bg-muted p-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] md:items-end">
          <Field label="ওষুধ">
            <input list="purchase-medicines" placeholder="নাম লিখে খুঁজুন…" className={`${selectCls} mb-1.5`} onChange={(e) => { const m = medicines.find((x) => `${x.name} ${x.strength} (${x.company})` === e.target.value); if (m) setRow({ ...row, medicineId: m.id, cost: m.costPrice }); }} />
            <datalist id="purchase-medicines">{medicines.map((m) => <option key={m.id} value={`${m.name} ${m.strength} (${m.company})`} />)}</datalist>
            <select className={selectCls} value={row.medicineId} onChange={(e) => { const m = medicines.find((x) => x.id === e.target.value); setRow({ ...row, medicineId: e.target.value, cost: m?.costPrice ?? 0 }); }}>
              <option value="">বেছে নিন…</option>
              {medicines.map((m) => <option key={m.id} value={m.id}>{m.name} {m.strength} ({m.company})</option>)}
            </select>
          </Field>
          <Field label="পরিমাণ"><Input type="number" min={1} value={row.qty} onChange={(e) => setRow({ ...row, qty: Number(e.target.value) })} /></Field>
          <Field label="প্রতি পিস দাম"><Input type="number" step="0.01" min={0} value={row.cost} onChange={(e) => setRow({ ...row, cost: Number(e.target.value) })} /></Field>
          <Field label="ব্যাচ নং"><Input value={row.batchNo} placeholder="B-123" onChange={(e) => setRow({ ...row, batchNo: e.target.value })} /></Field>
          <Field label="মেয়াদ"><Input type="date" value={row.expiry} onChange={(e) => setRow({ ...row, expiry: e.target.value })} /></Field>
          <Button onClick={() => { if (!row.medicineId || row.qty <= 0) return void toast.error("ওষুধ ও পরিমাণ দিন"); setItems([...items, row]); setRow({ ...row, medicineId: "", qty: 10, batchNo: "" }); }}><Plus className="h-4 w-4" /> যোগ</Button>
        </div>
        {items.length > 0 && (
          <ul className="mt-4 divide-y divide-border text-sm">
            {items.map((i, k) => (
              <li key={k} className="flex items-center justify-between py-2">
                <span className="font-medium">{mName(i.medicineId)}</span>
                <span className="text-muted-foreground">{i.qty} × {taka(i.cost)} · {i.batchNo ? `ব্যাচ ${i.batchNo} · ` : ""}মেয়াদ {i.expiry}</span>
                <span className="flex items-center gap-2 font-semibold">{taka(i.qty * i.cost)}<Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== k))}><Trash2 className="h-4 w-4 text-destructive" /></Button></span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-4">
          <span className="text-sm">মোট <b className="font-display text-xl">{taka(total)}</b> · বাকি <b className="text-destructive">{taka(Math.max(0, total - paid))}</b></span>
          <Button size="lg" disabled={!items.length} onClick={() => {
            const err = actions.addPurchase({ supplierId: sid, items, paid, date: today(), note });
            if (err) return void toast.error(err);
            toast.success("চালান সেভ হলো, স্টক আপডেট হয়েছে");
            setItems([]); setPaid(0); setNote("");
          }}>চালান সেভ করুন</Button>
        </div>
      </Panel>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground"><tr><th className={thCls}>তারিখ</th><th className={thCls}>সাপ্লায়ার</th><th className={thCls}>আইটেম</th><th className={thCls}>নোট</th><th className={thCls}>মোট</th><th className={thCls}>পরিশোধ</th><th className={thCls}>বাকি</th></tr></thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className={tdCls}>{p.date}</td>
                <td className={`${tdCls} font-medium`}>{sName(p.supplierId)}</td>
                <td className={tdCls}>{p.items.map((i) => `${mName(i.medicineId)}×${i.qty}`).join(", ")}</td>
                <td className={tdCls}>{p.note || "—"}</td>
                <td className={`${tdCls} font-semibold`}>{taka(p.total)}</td>
                <td className={tdCls}>{taka(p.paid)}</td>
                <td className={`${tdCls} ${p.total - p.paid > 0 ? "text-destructive" : ""}`}>{taka(p.total - p.paid)}</td>
              </tr>
            ))}
            {!purchases.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">কোনো চালান নেই</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
