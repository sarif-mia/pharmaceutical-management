import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Banknote, PackageX, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageTitle, Panel, Stat } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/meta";
import { daysFromNow, isExpired, PAYMENT_LABEL, saleProfit, taka, today, usePharmacy, type PaymentMethod } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/reports")({
  head: pageHead("রিপোর্ট", "যেকোনো সময়ের বিক্রি, লাভ, খরচ, পেমেন্ট ও মেয়াদোত্তীর্ণ লোকসানের হিসাব।"),
  component: Reports,
});

function Reports() {
  const { sales, expenses, medicines, purchases } = usePharmacy();
  const [from, setFrom] = useState(daysFromNow(-29));
  const [to, setTo] = useState(today());
  const inR = (d: string) => d >= from && d <= to;
  const S = sales.filter((s) => inR(s.date));
  const revenue = S.reduce((a, s) => a + s.total, 0);
  const profit = S.reduce((a, s) => a + saleProfit(s), 0);
  const exp = expenses.filter((e) => inR(e.date)).reduce((a, e) => a + e.amount, 0);
  const buy = purchases.filter((p) => inR(p.date)).reduce((a, p) => a + p.total, 0);
  const expiredLoss = medicines.filter(isExpired).reduce((a, m) => a + m.stock * m.costPrice, 0);

  const byMethod = (Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((k) => ({ k, v: S.filter((s) => s.method === k).reduce((a, s) => a + s.paid, 0) }));
  const dueAdded = S.reduce((a, s) => a + s.due, 0);

  const daily: Record<string, { day: string; বিক্রি: number; লাভ: number }> = {};
  for (const s of S) {
    const d = (daily[s.date] ??= { day: s.date.slice(5), বিক্রি: 0, লাভ: 0 });
    d.বিক্রি += s.total;
    d.লাভ += saleProfit(s);
  }
  const chart = Object.entries(daily).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);

  const top = Object.values(S.flatMap((s) => s.items).reduce<Record<string, { name: string; qty: number; amt: number; profit: number }>>((acc, i) => {
    const o = (acc[i.medicineId] ??= { name: i.name, qty: 0, amt: 0, profit: 0 });
    o.qty += i.qty; o.amt += i.qty * i.price; o.profit += i.qty * (i.price - i.cost);
    return acc;
  }, {})).sort((a, b) => b.amt - a.amt).slice(0, 10);

  return (
    <>
      <PageTitle title="রিপোর্ট" subtitle="তারিখ বেছে নিন" action={
        <div className="flex items-center gap-2"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /><span>—</span><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      } />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label={`বিক্রি (${S.length} ইনভয়েস)`} value={taka(revenue)} icon={Banknote} tone="bg-primary text-primary-foreground" />
        <Stat label="মোট লাভ" value={taka(profit)} icon={TrendingUp} tone="bg-accent text-accent-foreground" />
        <Stat label="খরচ" value={taka(exp)} icon={Wallet} />
        <Stat label="নিট লাভ" value={taka(profit - exp)} icon={Receipt} tone={profit - exp >= 0 ? "bg-primary/15 text-primary" : "bg-destructive/10 text-destructive"} />
        <Stat label="মেয়াদোত্তীর্ণ লোকসান" value={taka(expiredLoss)} icon={PackageX} tone="bg-destructive/10 text-destructive" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="দৈনিক বিক্রি ও লাভ" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => taka(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="বিক্রি" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="লাভ" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="ক্যাশ রেজিস্টার">
          <ul className="space-y-2 text-sm">
            {byMethod.map(({ k, v }) => <li key={k} className="flex justify-between rounded-lg bg-muted px-3 py-2"><span>{PAYMENT_LABEL[k]}</span><b>{taka(v)}</b></li>)}
            <li className="flex justify-between rounded-lg bg-destructive/10 px-3 py-2 text-destructive"><span>নতুন বাকি</span><b>{taka(dueAdded)}</b></li>
            <li className="flex justify-between rounded-lg bg-secondary px-3 py-2"><span>মাল ক্রয়</span><b>{taka(buy)}</b></li>
          </ul>
        </Panel>
      </div>
      <Panel title="সেরা ১০ ওষুধ" className="mt-6">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground"><tr><th className="py-2 text-left">ওষুধ</th><th className="text-right">পরিমাণ</th><th className="text-right">বিক্রি</th><th className="text-right">লাভ</th></tr></thead>
          <tbody>{top.map((t) => <tr key={t.name} className="border-t border-border"><td className="py-2 font-medium">{t.name}</td><td className="text-right">{t.qty}</td><td className="text-right">{taka(t.amt)}</td><td className="text-right text-primary">{taka(t.profit)}</td></tr>)}</tbody>
        </table>
      </Panel>
    </>
  );
}
