import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HandCoins, Phone, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { PageTitle, Panel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LedgerButton } from "@/components/LedgerDialog";
import { pageHead } from "@/lib/meta";
import { actions, supplierDue, taka, usePharmacy } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/suppliers")({
  head: pageHead("সাপ্লায়ার", "সাপ্লায়ার/কোম্পানির তথ্য, চালান ও পাওনা পরিশোধের হিসাব।"),
  component: Suppliers,
});

function Suppliers() {
  const st = usePharmacy();
  const [pay, setPay] = useState<Record<string, string>>({});
  const totalDue = st.suppliers.reduce((a, s) => a + supplierDue(st, s.id), 0);
  return (
    <>
      <PageTitle title="সাপ্লায়ার" subtitle={`${st.suppliers.length} জন · মোট পাওনা ${taka(totalDue)}`} />
      <Panel title={<><Truck className="h-5 w-5 text-primary" /> নতুন সাপ্লায়ার</>} className="mb-6">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          actions.addSupplier({ name: String(f.get("name")), phone: String(f.get("phone")), company: String(f.get("company")), address: String(f.get("address")) });
          e.currentTarget.reset();
          toast.success("সাপ্লায়ার যোগ হলো");
        }}>
          <Input name="company" placeholder="কোম্পানি" required />
          <Input name="name" placeholder="প্রতিনিধির নাম (MPO)" required />
          <Input name="phone" placeholder="মোবাইল" />
          <Input name="address" placeholder="ঠিকানা" />
          <Button type="submit">যোগ করুন</Button>
        </form>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {st.suppliers.map((s) => {
          const due = supplierDue(st, s.id);
          const n = st.purchases.filter((p) => p.supplierId === s.id).length;
          return (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-lg font-semibold">{s.company}</div>
                  <div className="text-sm">{s.name}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground"><Phone className="h-3 w-3" /> {s.phone || "—"} · {s.address}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => { if (confirm("মুছে ফেলবেন?")) actions.removeSupplier(s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
                <div className="rounded-lg bg-muted p-2"><div className="font-semibold">{n}টি</div><div className="text-xs text-muted-foreground">চালান</div></div>
                <div className={`rounded-lg p-2 ${due > 0 ? "bg-destructive/10 text-destructive" : "bg-secondary"}`}><div className="font-semibold">{taka(due)}</div><div className="text-xs">পাওনা</div></div>
              </div>
              {due > 0 && (
                <form className="mt-3 flex gap-2" onSubmit={(e) => {
                  e.preventDefault();
                  const amt = Math.min(Number(pay[s.id]) || 0, due);
                  if (amt <= 0) return;
                  actions.addPayment({ kind: "supplier", partyId: s.id, amount: amt });
                  setPay({ ...pay, [s.id]: "" });
                  toast.success(`${taka(amt)} পরিশোধ হলো`);
                }}>
                  <Input type="number" min={1} placeholder="পরিশোধের পরিমাণ" value={pay[s.id] ?? ""} onChange={(e) => setPay({ ...pay, [s.id]: e.target.value })} />
                  <Button type="submit" variant="outline"><HandCoins className="h-4 w-4" /> পরিশোধ</Button>
                </form>
              )}
              <LedgerButton kind="supplier" id={s.id} name={s.company} />
            </div>
          );
        })}
      </div>
    </>
  );
}
