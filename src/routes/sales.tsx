import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, isExpired, taka, usePharmacy } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "বিক্রি — শেফা ফার্মেসি" },
      { name: "description", content: "দ্রুত ওষুধ বিক্রি করুন, স্টক নিজে থেকেই কমবে।" },
      { property: "og:title", content: "বিক্রি — শেফা ফার্মেসি" },
      { property: "og:description", content: "দ্রুত ওষুধ বিক্রি করুন, স্টক নিজে থেকেই কমবে।" },
    ],
  }),
  component: Sales,
});

function Sales() {
  const { medicines, sales } = usePharmacy();
  const available = medicines.filter((m) => m.stock > 0 && !isExpired(m));
  const [medId, setMedId] = useState("");
  const [qty, setQty] = useState(1);
  const med = medicines.find((m) => m.id === (medId || available[0]?.id));
  const name = (id: string) => medicines.find((m) => m.id === id)?.name ?? "—";

  return (
    <>
      <PageTitle title="বিক্রি" subtitle="ওষুধ বেছে নিন, পরিমাণ দিন — ব্যস!" />
      <form
        className="mb-8 grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (!med) return;
          const err = actions.sell(med.id, qty);
          if (err) toast.error(err);
          else { toast.success(`${med.name} বিক্রি হলো — ${taka(med.price * qty)}`); setQty(1); }
        }}
      >
        <label className="grid gap-1.5 text-sm font-medium">ওষুধ
          <select value={med?.id ?? ""} onChange={(e) => setMedId(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3">
            {available.map((m) => <option key={m.id} value={m.id}>{m.name} (স্টক {m.stock})</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">পরিমাণ
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        </label>
        <div className="text-sm"><div className="text-muted-foreground">মোট</div><div className="font-display text-2xl font-semibold">{taka((med?.price ?? 0) * qty)}</div></div>
        <Button type="submit" size="lg" disabled={!med}>বিক্রি করুন</Button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground"><tr><th className="px-4 py-3">তারিখ</th><th>ওষুধ</th><th>পরিমাণ</th><th className="px-4 text-right">মোট</th></tr></thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-border"><td className="px-4 py-3 text-muted-foreground">{s.date}</td><td className="font-semibold">{name(s.medicineId)}</td><td>{s.quantity}</td><td className="px-4 text-right">{taka(s.total)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
