import { createFileRoute } from "@tanstack/react-router";
import { Phone, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, usePharmacy } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "সাপ্লায়ার — শেফা ফার্মেসি" },
      { name: "description", content: "ওষুধ সরবরাহকারীদের তালিকা ও যোগাযোগ।" },
      { property: "og:title", content: "সাপ্লায়ার — শেফা ফার্মেসি" },
      { property: "og:description", content: "ওষুধ সরবরাহকারীদের তালিকা ও যোগাযোগ।" },
    ],
  }),
  component: Suppliers,
});

function Suppliers() {
  const { suppliers } = usePharmacy();
  return (
    <>
      <PageTitle title="সাপ্লায়ার" subtitle={`${suppliers.length} জন সরবরাহকারী`} />
      <form
        className="mb-8 grid gap-3 rounded-2xl border border-border bg-card p-6 md:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          actions.addSupplier({ name: String(f.get("name")), company: String(f.get("company")), phone: String(f.get("phone")), address: String(f.get("address")) });
          e.currentTarget.reset();
          toast.success("সাপ্লায়ার যোগ হয়েছে");
        }}
      >
        <Input name="name" placeholder="নাম" required />
        <Input name="company" placeholder="কোম্পানি" required />
        <Input name="phone" placeholder="ফোন" />
        <Input name="address" placeholder="ঠিকানা" />
        <Button type="submit">যোগ করুন</Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-lg font-semibold">{s.company}</div>
                <div className="text-sm text-muted-foreground">{s.name}</div>
              </div>
              <Button size="icon" variant="ghost" aria-label="মুছুন" onClick={() => actions.removeSupplier(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              {s.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" />{s.phone}</div>}
              {s.address && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" />{s.address}</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
