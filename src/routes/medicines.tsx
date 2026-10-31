import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { BatchDialog } from "@/components/BatchDialog";
import { toast } from "sonner";
import { Field, PageTitle, selectCls, tdCls, thCls } from "@/components/shared/page-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/meta";
import {
  actions,
  expiresSoon,
  FORMS,
  isExpired,
  getBatches,
  isLow,
  taka,
  usePharmacy,
  type DosageForm,
  type Medicine,
} from "@/lib/pharmacy-store";

export const Route = createFileRoute("/medicines")({
  head: pageHead(
    "ওষুধ ও স্টক",
    "ব্র্যান্ড, জেনেরিক, কোম্পানি, র‍্যাক, দাম, স্টক ও মেয়াদ এক জায়গায়।",
  ),
  component: Medicines,
});

type Filter = "all" | "low" | "soon" | "expired";

function Medicines() {
  const { medicines, categories, settings } = usePharmacy();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [edit, setEdit] = useState<Partial<Medicine> | null>(null);
  const [batchOf, setBatchOf] = useState<string | null>(null);
  const s = q.toLowerCase();
  const list = medicines.filter(
    (m) =>
      (!s ||
        [m.name, m.generic, m.company, m.barcode, m.rack].some((x) =>
          x.toLowerCase().includes(s),
        )) &&
      (!cat || m.categoryId === cat) &&
      (filter === "all" ||
        (filter === "low" && isLow(m, settings)) ||
        (filter === "soon" && expiresSoon(m, settings.expiryDays)) ||
        (filter === "expired" && isExpired(m))),
  );
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";
  const stockValue = medicines.reduce((a, m) => a + m.stock * m.costPrice, 0);

  const exportCsv = () => {
    const rows = [
      ["Name", "Generic", "Strength", "Form", "Company", "Rack", "Cost", "MRP", "Stock", "Expiry"],
      ...list.map((m) => [
        m.name,
        m.generic,
        m.strength,
        m.form,
        m.company,
        m.rack,
        m.costPrice,
        m.price,
        m.stock,
        m.expiry,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "medicines.csv";
    a.click();
  };

  const tabs: [Filter, string][] = [
    ["all", "সব"],
    ["low", "কম স্টক"],
    ["soon", "শীঘ্রই মেয়াদ শেষ"],
    ["expired", "মেয়াদ শেষ"],
  ];

  return (
    <>
      <PageTitle
        title="ওষুধ ও স্টক"
        subtitle={`মোট ${medicines.length}টি ওষুধ · স্টকের মূল্য ${taka(stockValue)}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button onClick={() => setEdit({})}>
              <Plus className="h-4 w-4" /> নতুন ওষুধ
            </Button>
          </div>
        }
      />
      <div className="mb-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="নাম, জেনেরিক, কোম্পানি, র‍্যাক বা বারকোড…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className={`${selectCls} sm:w-44`}
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="">সব ক্যাটাগরি</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex min-w-0 overflow-x-auto rounded-lg border border-border bg-card p-1">
          {tabs.map(([k, l]) => (
            <Button
              key={k}
              size="sm"
              variant={filter === k ? "default" : "ghost"}
              onClick={() => setFilter(k)}
              className="h-9 shrink-0 px-2 text-xs"
            >
              {l}
            </Button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-border border-y border-border bg-card sm:hidden">
        {list.map((m) => (
          <article key={m.id} className="py-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">
                  {m.name} <span className="font-normal text-muted-foreground">{m.strength}</span>
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.generic} · {m.form}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.company} · র‍্যাক {m.rack || "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{taka(m.price)}</p>
                <p
                  className={`mt-1 text-xs ${isLow(m, settings) ? "text-destructive" : "text-muted-foreground"}`}
                >
                  স্টক {m.stock} পিস
                </p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <div className="min-w-0 text-xs">
                <span className={isExpired(m) ? "text-destructive" : "text-muted-foreground"}>
                  মেয়াদ {m.expiry}
                </span>
                <button
                  type="button"
                  className="ml-2 text-primary underline-offset-2 hover:underline"
                  onClick={() => setBatchOf(m.id)}
                >
                  {getBatches(m).length} ব্যাচ
                </button>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`${m.name} ব্যাচ ও স্টক সমন্বয়`}
                  onClick={() => setBatchOf(m.id)}
                >
                  <Layers className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`${m.name} এডিট`}
                  onClick={() => setEdit(m)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`${m.name} মুছুন`}
                  onClick={() => {
                    if (confirm(`${m.name} মুছে ফেলবেন?`)) actions.removeMedicine(m.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </article>
        ))}
        {!list.length && (
          <p className="py-8 text-center text-sm text-muted-foreground">কিছু পাওয়া যায়নি</p>
        )}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className={thCls}>ওষুধ</th>
              <th className={thCls}>কোম্পানি</th>
              <th className={thCls}>ক্যাটাগরি</th>
              <th className={thCls}>র‍্যাক</th>
              <th className={thCls}>কেনা / MRP</th>
              <th className={thCls}>স্টক</th>
              <th className={thCls}>মেয়াদ</th>
              <th className={`${thCls} text-right`}>কাজ</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t border-border hover:bg-muted/40">
                <td className={tdCls}>
                  <div className="font-semibold">
                    {m.name} <span className="font-normal text-muted-foreground">{m.strength}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.generic} · {m.form}
                  </div>
                </td>
                <td className={tdCls}>{m.company}</td>
                <td className={tdCls}>{catName(m.categoryId)}</td>
                <td className={tdCls}>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {m.rack || "—"}
                  </span>
                </td>
                <td className={tdCls}>
                  <span className="text-muted-foreground">{taka(m.costPrice)}</span> /{" "}
                  <b>{taka(m.price)}</b>
                </td>
                <td className={tdCls}>
                  <span
                    className={isLow(m, settings) ? "font-bold text-destructive" : "font-semibold"}
                  >
                    {m.stock}
                  </span>
                </td>
                <td className={tdCls}>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isExpired(m) ? "bg-destructive/10 text-destructive" : expiresSoon(m, settings.expiryDays) ? "bg-accent/30 text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}
                  >
                    {m.expiry}
                  </span>
                  <button
                    type="button"
                    className="mt-1 block text-xs text-primary hover:underline"
                    onClick={() => setBatchOf(m.id)}
                  >
                    {getBatches(m).length}টি ব্যাচ
                  </button>
                </td>
                <td className={`${tdCls} whitespace-nowrap text-right`}>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="ব্যাচ ও স্টক সমন্বয়"
                    onClick={() => setBatchOf(m.id)}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="এডিট" onClick={() => setEdit(m)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="মুছুন"
                    onClick={() => {
                      if (confirm(`${m.name} মুছে ফেলবেন?`)) actions.removeMedicine(m.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  কিছু পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {batchOf && <BatchDialog medicineId={batchOf} onClose={() => setBatchOf(null)} />}
      {edit && <MedicineDialog med={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function MedicineDialog({ med, onClose }: { med: Partial<Medicine>; onClose: () => void }) {
  const { categories, suppliers } = usePharmacy();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{med.id ? "ওষুধ এডিট" : "নতুন ওষুধ যোগ করুন"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const g = (k: string) => String(f.get(k) ?? "").trim();
            const price = Number(g("price")),
              costPrice = Number(g("costPrice"));
            if (price < costPrice) toast.warning("বিক্রয় মূল্য কেনা দামের চেয়ে কম!");
            actions.saveMedicine({
              id: med.id,
              name: g("name"),
              generic: g("generic"),
              form: g("form") as DosageForm,
              strength: g("strength"),
              company: g("company"),
              rack: g("rack"),
              barcode: g("barcode"),
              categoryId: g("categoryId"),
              supplierId: g("supplierId"),
              costPrice,
              price,
              stock: Number(g("stock")),
              reorder: Number(g("reorder")) || 0,
              packSize: Math.max(1, Number(g("packSize")) || 1),
              expiry: g("expiry"),
            });
            toast.success("সেভ হয়েছে");
            onClose();
          }}
        >
          <Field label="ব্র্যান্ড নাম">
            <Input name="name" defaultValue={med.name} required placeholder="Napa" />
          </Field>
          <Field label="জেনেরিক নাম">
            <Input name="generic" defaultValue={med.generic} placeholder="Paracetamol" />
          </Field>
          <Field label="শক্তি">
            <Input name="strength" defaultValue={med.strength} placeholder="500mg" />
          </Field>
          <Field label="ধরন">
            <select name="form" className={selectCls} defaultValue={med.form ?? "Tablet"}>
              {FORMS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="কোম্পানি">
            <Input name="company" defaultValue={med.company} placeholder="Square" />
          </Field>
          <Field label="র‍্যাক / শেলফ">
            <Input name="rack" defaultValue={med.rack} placeholder="A-1" />
          </Field>
          <Field label="ক্যাটাগরি">
            <select name="categoryId" className={selectCls} defaultValue={med.categoryId}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="সাপ্লায়ার">
            <select name="supplierId" className={selectCls} defaultValue={med.supplierId}>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company}
                </option>
              ))}
            </select>
          </Field>
          <Field label="বারকোড">
            <Input name="barcode" defaultValue={med.barcode} />
          </Field>
          <Field label="কেনা দাম (৳)">
            <Input
              name="costPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={med.costPrice}
              required
            />
          </Field>
          <Field label="বিক্রয় মূল্য / MRP (৳)">
            <Input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={med.price}
              required
            />
          </Field>
          <Field label="স্টক">
            <Input name="stock" type="number" min="0" defaultValue={med.stock ?? 0} required />
          </Field>
          <Field label="প্রতি পাতায় পিস">
            <Input name="packSize" type="number" min="1" defaultValue={med.packSize ?? 10} />
          </Field>
          <Field label="রি-অর্ডার লেভেল">
            <Input name="reorder" type="number" min="0" defaultValue={med.reorder ?? 20} />
          </Field>
          <Field label="মেয়াদ">
            <Input name="expiry" type="date" defaultValue={med.expiry} required />
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
