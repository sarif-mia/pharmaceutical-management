import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { actions, expiresSoon, isExpired, LOW_STOCK, taka, usePharmacy } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/medicines")({
  head: () => ({
    meta: [
      { title: "ওষুধ ও স্টক — শেফা ফার্মেসি" },
      { name: "description", content: "সব ওষুধ, দাম, স্টক ও মেয়াদ দেখুন ও যোগ করুন।" },
      { property: "og:title", content: "ওষুধ ও স্টক — শেফা ফার্মেসি" },
      { property: "og:description", content: "সব ওষুধ, দাম, স্টক ও মেয়াদ দেখুন ও যোগ করুন।" },
    ],
  }),
  component: Medicines,
});

function Medicines() {
  const { medicines, categories, suppliers } = usePharmacy();
  const [q, setQ] = useState("");
  const list = medicines.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));
  const cat = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <>
      <PageTitle title="ওষুধ ও স্টক" subtitle={`মোট ${medicines.length}টি ওষুধ`} action={<AddMedicine />} />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="ওষুধ খুঁজুন…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr><th className="px-4 py-3">নাম</th><th>ক্যাটাগরি</th><th>বিক্রয় মূল্য</th><th>স্টক</th><th>মেয়াদ</th><th className="px-4 text-right">কাজ</th></tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{m.name}</td>
                <td>{cat(m.categoryId)}</td>
                <td>{taka(m.price)}</td>
                <td><span className={m.stock < LOW_STOCK ? "font-semibold text-destructive" : ""}>{m.stock}</span></td>
                <td>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isExpired(m) ? "bg-destructive/10 text-destructive" : expiresSoon(m) ? "bg-accent/30 text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
                    {m.expiry}
                  </span>
                </td>
                <td className="px-4 text-right">
                  <Button size="sm" variant="outline" className="mr-2" onClick={() => { actions.restock(m.id, 50); toast.success(`${m.name}: ৫০টি স্টকে যোগ হলো`); }}>+৫০</Button>
                  <Button size="icon" variant="ghost" aria-label="মুছুন" onClick={() => actions.removeMedicine(m.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">কিছু পাওয়া যায়নি</td></tr>}
          </tbody>
        </table>
      </div>
      {!suppliers.length && <p className="mt-3 text-sm text-muted-foreground">টিপ: আগে একজন সাপ্লায়ার যোগ করুন।</p>}
    </>
  );
}

function AddMedicine() {
  const { categories, suppliers } = usePharmacy();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> নতুন ওষুধ</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>নতুন ওষুধ যোগ করুন</DialogTitle></DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            actions.addMedicine({
              name: String(f.get("name")),
              categoryId: String(f.get("categoryId")),
              supplierId: String(f.get("supplierId")),
              costPrice: Number(f.get("costPrice")),
              price: Number(f.get("price")),
              stock: Number(f.get("stock")),
              expiry: String(f.get("expiry")),
            });
            toast.success("ওষুধ যোগ হয়েছে");
            setOpen(false);
          }}
        >
          <Input name="name" placeholder="ওষুধের নাম" required />
          <div className="grid grid-cols-2 gap-3">
            <select name="categoryId" className="h-9 rounded-md border border-input bg-background px-3 text-sm">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select name="supplierId" className="h-9 rounded-md border border-input bg-background px-3 text-sm">{suppliers.map((s) => <option key={s.id} value={s.id}>{s.company}</option>)}</select>
            <Input name="costPrice" type="number" step="0.01" min="0" placeholder="কেনা দাম" required />
            <Input name="price" type="number" step="0.01" min="0" placeholder="বিক্রয় মূল্য" required />
            <Input name="stock" type="number" min="0" placeholder="পরিমাণ" required />
            <Input name="expiry" type="date" required />
          </div>
          <Button type="submit">সংরক্ষণ করুন</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
