import { useState } from "react";
import { toast } from "sonner";
import { Field, selectCls } from "@/components/shared/page-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { actions, ADJUST_LABEL, getBatches, taka, today, usePharmacy, type AdjustReason, type Medicine } from "@/lib/pharmacy-store";

/** Shows every batch of a medicine and lets owner/manager remove damaged, expired or returned pieces. */
export function BatchDialog({ medicineId, onClose }: { medicineId: string; onClose: () => void }) {
  const st = usePharmacy();
  const m = st.medicines.find((x) => x.id === medicineId) as Medicine | undefined;
  const [pick, setPick] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState<AdjustReason>("damage");
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  if (!m) return null;
  const batches = getBatches(m);
  const history = (st.adjustments ?? []).filter((a) => a.medicineId === m.id).slice(0, 8);
  const t = today();
  const sid = supplierId || m.supplierId || st.suppliers[0]?.id || "";

  const save = () => {
    if (!pick) return;
    const err = actions.adjustStock({ medicineId: m.id, batchId: pick, qty, reason, note, ...(reason === "supplier" ? { supplierId: sid } : {}) });
    if (err) return void toast.error(err);
    toast.success(reason === "supplier" ? "সাপ্লায়ারকে ফেরত হলো, তার পাওনা কমেছে" : "স্টক কমানো হলো");
    setPick(null); setQty(1); setNote("");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{m.name} {m.strength} — ব্যাচ</DialogTitle>
          <DialogDescription>মোট {m.stock} পিস · আগে মেয়াদ শেষ হওয়া ব্যাচ আগে বিক্রি হয়</DialogDescription>
        </DialogHeader>
        <ul className="divide-y divide-border rounded-lg border border-border text-sm">
          {batches.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="font-medium">ব্যাচ {b.no} · {b.qty} পিস</p>
                <p className={`text-xs ${b.expiry < t ? "text-destructive" : "text-muted-foreground"}`}>মেয়াদ {b.expiry} · কেনা {taka(b.cost)}</p>
              </div>
              <Button size="sm" variant={pick === b.id ? "default" : "outline"} onClick={() => { setPick(b.id); setQty(b.qty); setReason(b.expiry < t ? "expired" : "damage"); }}>স্টক কমান</Button>
            </li>
          ))}
          {!batches.length && <li className="px-3 py-6 text-center text-muted-foreground">স্টক নেই</li>}
        </ul>
        {pick && (
          <div className="grid gap-3 rounded-lg bg-muted p-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="কারণ"><select className={selectCls} value={reason} onChange={(e) => setReason(e.target.value as AdjustReason)}>{(Object.keys(ADJUST_LABEL) as AdjustReason[]).map((k) => <option key={k} value={k}>{ADJUST_LABEL[k]}</option>)}</select></Field>
              <Field label="পরিমাণ (পিস)"><Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} /></Field>
            </div>
            {reason === "supplier" && <Field label="সাপ্লায়ার"><select className={selectCls} value={sid} onChange={(e) => setSupplierId(e.target.value)}>{st.suppliers.map((s) => <option key={s.id} value={s.id}>{s.company}</option>)}</select></Field>}
            <Field label="নোট"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ঐচ্ছিক" /></Field>
            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setPick(null)}>বাতিল</Button><Button className="flex-1" onClick={save}>সেভ করুন</Button></div>
          </div>
        )}
        {history.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">আগের সমন্বয়</p>
            <ul className="space-y-1 text-xs">{history.map((a) => <li key={a.id} className="flex justify-between gap-2"><span>{a.date} · {ADJUST_LABEL[a.reason]} · ব্যাচ {a.batchNo}</span><span className="font-medium">-{a.qty} পিস</span></li>)}</ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
