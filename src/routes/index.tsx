import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Banknote, PackageX, Pill, TrendingUp } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { expiresSoon, isExpired, LOW_STOCK, taka, today, usePharmacy } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ড্যাশবোর্ড — শেফা ফার্মেসি" },
      { name: "description", content: "আজকের বিক্রি, কম স্টক ও মেয়াদোত্তীর্ণ ওষুধ এক নজরে।" },
      { property: "og:title", content: "ড্যাশবোর্ড — শেফা ফার্মেসি" },
      { property: "og:description", content: "আজকের বিক্রি, কম স্টক ও মেয়াদোত্তীর্ণ ওষুধ এক নজরে।" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { medicines, sales } = usePharmacy();
  const t = today();
  const todaySales = sales.filter((s) => s.date === t);
  const todayTotal = todaySales.reduce((a, s) => a + s.total, 0);
  const expired = medicines.filter(isExpired);
  const low = medicines.filter((m) => m.stock < LOW_STOCK);
  const soon = medicines.filter(expiresSoon);
  const name = (id: string) => medicines.find((m) => m.id === id)?.name ?? "—";

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10);
    return { day: d.slice(5), total: sales.filter((s) => s.date === d).reduce((a, s) => a + s.total, 0) };
  });

  const stats = [
    { label: "আজকের বিক্রি", value: taka(todayTotal), icon: Banknote, tone: "bg-primary text-primary-foreground" },
    { label: "মোট ওষুধ", value: medicines.length, icon: Pill, tone: "bg-secondary text-secondary-foreground" },
    { label: "কম স্টক", value: low.length, icon: AlertTriangle, tone: "bg-accent text-accent-foreground" },
    { label: "মেয়াদ শেষ", value: expired.length, icon: PackageX, tone: "bg-destructive text-destructive-foreground" },
  ];

  return (
    <>
      <PageTitle title="আসসালামু আলাইকুম 👋" subtitle="আজ আপনার ফার্মেসির অবস্থা এক নজরে" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="font-display text-2xl font-semibold md:text-3xl">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-3">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" /> গত ৭ দিনের বিক্রি
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip formatter={(v: number) => taka(v)} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="total" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-xl font-semibold">সতর্কতা</h2>
          <ul className="space-y-2 text-sm">
            {[...expired.map((m) => ({ m, t: "মেয়াদ শেষ", c: "bg-destructive/10 text-destructive" })),
              ...soon.map((m) => ({ m, t: "৩০ দিনে মেয়াদ শেষ", c: "bg-accent/30 text-accent-foreground" })),
              ...low.map((m) => ({ m, t: `স্টক ${m.stock}`, c: "bg-secondary text-secondary-foreground" }))].map(({ m, t, c }, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                <span className="font-medium">{m.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c}`}>{t}</span>
              </li>
            ))}
            {!expired.length && !soon.length && !low.length && <li className="text-muted-foreground">সব ঠিক আছে ✓</li>}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">আজকের বিক্রি</h2>
          <Link to="/sales" className="text-sm font-semibold text-primary hover:underline">নতুন বিক্রি →</Link>
        </div>
        {todaySales.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">ওষুধ</th><th>পরিমাণ</th><th className="text-right">মোট</th></tr></thead>
            <tbody>
              {todaySales.map((s) => (
                <tr key={s.id} className="border-t border-border"><td className="py-2.5 font-medium">{name(s.medicineId)}</td><td>{s.quantity}</td><td className="text-right">{taka(s.total)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-muted-foreground">আজ এখনো কোনো বিক্রি হয়নি।</p>}
      </section>
    </>
  );
}
