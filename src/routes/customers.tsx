import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HandCoins, MessageCircle, Phone, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageTitle, Panel } from "@/components/shared/page-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LedgerButton } from "@/components/LedgerDialog";
import { pageHead } from "@/lib/meta";
import { actions, customerDue, taka, usePharmacy } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/customers")({
  head: pageHead("কাস্টমার ও বাকি খাতা", "নিয়মিত কাস্টমার, তাদের কেনাকাটা ও বাকির হিসাব রাখুন।"),
  component: Customers,
});

function Customers() {
  const st = usePharmacy();
  const [pay, setPay] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const has = (...v: string[]) =>
    v.some((x) => (x ?? "").toLowerCase().includes(q.trim().toLowerCase()));
  const totalDue = st.customers.reduce((a, c) => a + customerDue(st, c.id), 0);

  return (
    <>
      <PageTitle
        title="কাস্টমার ও বাকি খাতা"
        subtitle={`${st.customers.length} জন কাস্টমার · মোট বাকি ${taka(totalDue)}`}
      />
      <Panel
        title={
          <>
            <UserPlus className="h-5 w-5 text-primary" /> নতুন কাস্টমার
          </>
        }
        className="mb-6"
      >
        <form
          className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            actions.addCustomer({
              name: String(f.get("name")),
              phone: String(f.get("phone")),
              address: String(f.get("address")),
            });
            e.currentTarget.reset();
            toast.success("কাস্টমার যোগ হলো");
          }}
        >
          <Input name="name" placeholder="নাম" required />
          <Input
            name="phone"
            placeholder="মোবাইল 01XXXXXXXXX"
            pattern="01[3-9][0-9-]{8,9}"
            title="সঠিক বাংলাদেশি মোবাইল নম্বর"
          />
          <Input name="address" placeholder="ঠিকানা" />
          <Button type="submit">যোগ করুন</Button>
        </form>
      </Panel>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="নাম বা মোবাইল দিয়ে খুঁজুন…"
        className="mb-4"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {st.customers
          .filter((c) => has(c.name, c.phone, c.address))
          .map((c) => {
            const due = customerDue(st, c.id);
            const buys = st.sales.filter((s) => s.customerId === c.id);
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-lg font-semibold">{c.name}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" /> {c.phone || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.address}</div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("মুছে ফেলবেন?")) actions.removeCustomer(c.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
                  <div className="rounded-lg bg-muted p-2">
                    <div className="font-semibold">
                      {taka(buys.reduce((a, s) => a + s.total, 0))}
                    </div>
                    <div className="text-xs text-muted-foreground">মোট কেনা ({buys.length})</div>
                  </div>
                  <div
                    className={`rounded-lg p-2 ${due > 0 ? "bg-destructive/10 text-destructive" : "bg-secondary"}`}
                  >
                    <div className="font-semibold">{taka(due)}</div>
                    <div className="text-xs">বাকি</div>
                  </div>
                </div>
                {due > 0 && (
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const amt = Math.min(Number(pay[c.id]) || 0, due);
                      if (amt <= 0) return;
                      actions.addPayment({ kind: "customer", partyId: c.id, amount: amt });
                      setPay({ ...pay, [c.id]: "" });
                      toast.success(`${taka(amt)} আদায় হলো`);
                    }}
                  >
                    <Input
                      type="number"
                      min={1}
                      placeholder="আদায়ের পরিমাণ"
                      value={pay[c.id] ?? ""}
                      onChange={(e) => setPay({ ...pay, [c.id]: e.target.value })}
                    />
                    <Button type="submit" variant="outline">
                      <HandCoins className="h-4 w-4" /> আদায়
                    </Button>
                  </form>
                )}
                {due > 0 && c.phone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-primary"
                    onClick={() =>
                      remind(c.name, c.phone, due, st.settings.shopName, st.settings.phone)
                    }
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp-এ বাকি তাগাদা
                  </Button>
                )}
                <LedgerButton kind="customer" id={c.id} name={c.name} />
              </div>
            );
          })}
      </div>
    </>
  );
}

function remind(name: string, phone: string, due: number, shop: string, shopPhone: string) {
  const d = phone.replace(/\D/g, "");
  const num = d.startsWith("01") ? `88${d}` : d;
  const msg = `সম্মানিত ${name}, ${shop}-এ আপনার বকেয়া ${taka(due)}। সুবিধামতো সময়ে পরিশোধ করার অনুরোধ রইল। ধন্যবাদ।${shopPhone ? `\nযোগাযোগ: ${shopPhone}` : ""}`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
}
