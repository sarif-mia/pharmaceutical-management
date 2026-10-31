import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer } from "lucide-react";
import { Field, PageTitle, Panel } from "@/components/shared/page-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/meta";
import { dayClosing, PAYMENT_LABEL, taka, today, usePharmacy, type PaymentMethod } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/closing")({
  head: pageHead("দিনশেষ হিসাব", "দিনের বিক্রি, বিকাশ/নগদ/কার্ড ও ক্যাশ মিলিয়ে দিন শেষ করুন।"),
  component: Closing,
});

function Closing() {
  const st = usePharmacy();
  const [date, setDate] = useState(today());
  const [counted, setCounted] = useState("");
  const z = dayClosing(st, date);
  const diff = counted === "" ? null : Number(counted) - z.expectedCash;
  return (
    <>
      <PageTitle title="দিনশেষ হিসাব (Z-রিপোর্ট)" subtitle={`${z.count}টি বিক্রি`} />
      <div className="no-print mb-3 flex gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[180px]" />
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> প্রিন্ট</Button>
      </div>
      <div className="print-area grid gap-4 lg:grid-cols-2">
        <Panel title={`${st.settings.shopName} · ${date}`}>
          <div className="space-y-1.5 text-sm">
            <Row a="মোট বিক্রি" b={taka(z.total)} bold />
            <Row a="ছাড় দেওয়া" b={taka(z.discount)} />
            {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => <Row key={m} a={`${PAYMENT_LABEL[m]} এ পাওয়া`} b={taka(z.byMethod[m])} />)}
            <Row a="নতুন বাকি" b={taka(z.due)} />
            <Row a="বাকি আদায় (ক্যাশ)" b={taka(z.collected)} />
            <Row a="খরচ" b={`- ${taka(z.expense)}`} />
            <div className="border-t border-border pt-1.5"><Row a="ড্রয়ারে থাকার কথা (ক্যাশ)" b={taka(z.expectedCash)} bold /></div>
          </div>
        </Panel>
        <Panel title="ক্যাশ গুনে মেলান" className="no-print">
          <Field label="ড্রয়ারে গুনে পাওয়া টাকা (৳)"><Input type="number" min={0} value={counted} onChange={(e) => setCounted(e.target.value)} /></Field>
          {diff !== null && (
            <div className={`mt-3 rounded-md p-3 text-sm font-semibold ${diff === 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {diff === 0 ? "হিসাব মিলেছে ✓" : diff > 0 ? `${taka(diff)} বেশি আছে` : `${taka(-diff)} কম আছে`}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function Row({ a, b, bold }: { a: string; b: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}><span>{a}</span><span>{b}</span></div>;
}
