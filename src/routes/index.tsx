import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Banknote, HandCoins, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageTitle, Panel, Stat } from "@/components/shared/page-ui";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/meta";
import {
  customerDue,
  daysFromNow,
  expiresSoon,
  isExpired,
  isLow,
  saleProfit,
  taka,
  today,
  usePharmacy,
} from "@/lib/pharmacy-store";

export const Route = createFileRoute("/")({
  head: pageHead("ড্যাশবোর্ড", "আজকের বিক্রি, লাভ, বাকি, কম স্টক ও মেয়াদোত্তীর্ণ ওষুধ এক নজরে।"),
  component: Dashboard,
});

function Dashboard() {
  const st = usePharmacy();
  const { medicines, sales, expenses, customers, settings } = st;
  const t = today();
  const todaySales = sales.filter((s) => s.date === t);
  const todayTotal = todaySales.reduce((a, s) => a + s.total, 0);
  const todayProfit = todaySales.reduce((a, s) => a + saleProfit(s), 0);
  const todayExp = expenses.filter((e) => e.date === t).reduce((a, e) => a + e.amount, 0);
  const totalDue = customers.reduce((a, c) => a + customerDue(st, c.id), 0);
  const expired = medicines.filter(isExpired);
  const low = medicines.filter((m) => isLow(m, settings));
  const soon = medicines.filter((m) => expiresSoon(m, settings.expiryDays));

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = daysFromNow(i - 13);
    return {
      day: d.slice(8) + "/" + d.slice(5, 7),
      total: sales.filter((s) => s.date === d).reduce((a, s) => a + s.total, 0),
    };
  });

  const top = Object.values(
    sales
      .flatMap((s) => s.items)
      .reduce<Record<string, { name: string; qty: number; amt: number }>>((acc, i) => {
        const o = (acc[i.medicineId] ??= { name: i.name, qty: 0, amt: 0 });
        o.qty += i.qty;
        o.amt += i.qty * i.price;
        return acc;
      }, {}),
  )
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 5);

  return (
    <>
      <PageTitle
        title="ড্যাশবোর্ড"
        subtitle={`${settings.shopName} · ${t}`}
        action={
          <Button asChild size="default">
            <Link to="/sales">
              <ShoppingCart className="h-4 w-4" /> নতুন বিক্রি
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={`আজকের বিক্রি (${todaySales.length}টি)`}
          value={taka(todayTotal)}
          icon={Banknote}
          tone="bg-primary text-primary-foreground"
        />
        <Stat
          label="আজকের লাভ (খরচ বাদে)"
          value={taka(todayProfit - todayExp)}
          icon={TrendingUp}
          tone="bg-accent text-accent-foreground"
        />
        <Stat label="কাস্টমারের মোট বাকি" value={taka(totalDue)} icon={HandCoins} />
        <Stat label="আজকের খরচ" value={taka(todayExp)} icon={Wallet} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          title={
            <>
              <TrendingUp className="h-5 w-5 text-primary" /> গত ১৪ দিনের বিক্রি
            </>
          }
        >
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days} margin={{ left: -10, right: 8 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v: number) => taka(v)}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="বিক্রি"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title={
            <>
              <AlertTriangle className="h-5 w-5 text-destructive" /> সতর্কতা
            </>
          }
        >
          <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
              <div className="text-xl font-bold">{expired.length}</div>মেয়াদ শেষ
            </div>
            <div className="rounded-lg bg-accent/30 p-2">
              <div className="text-xl font-bold">{soon.length}</div>শীঘ্রই শেষ
            </div>
            <div className="rounded-lg bg-secondary p-2">
              <div className="text-xl font-bold">{low.length}</div>কম স্টক
            </div>
          </div>
          <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
            {[
              ...expired.map((m) => ({
                m,
                t: "মেয়াদ শেষ",
                c: "bg-destructive/10 text-destructive",
              })),
              ...soon.map((m) => ({
                m,
                t: `মেয়াদ ${m.expiry}`,
                c: "bg-accent/30 text-accent-foreground",
              })),
              ...low.map((m) => ({
                m,
                t: `স্টক ${m.stock}`,
                c: "bg-secondary text-secondary-foreground",
              })),
            ].map(({ m, t, c }, i) => (
              <li
                key={i}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border py-2"
              >
                <span className="min-w-0 break-words font-medium">
                  {m.name} <span className="text-xs text-muted-foreground">{m.strength}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c}`}>{t}</span>
              </li>
            ))}
            {!expired.length && !soon.length && !low.length && (
              <li className="text-muted-foreground">সব ঠিক আছে ✓</li>
            )}
          </ul>
          <Link
            to="/medicines"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
          >
            সব স্টক দেখুন →
          </Link>
        </Panel>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Panel title="সবচেয়ে বেশি বিক্রি">
          <ul className="space-y-3 text-sm">
            {top.map((x, i) => (
              <li key={x.name} className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 break-words font-medium">{x.name}</span>
                <span className="text-muted-foreground">{x.qty}টি</span>
                <span className="w-24 text-right font-semibold">{taka(x.amt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel
          title="সাম্প্রতিক বিক্রি"
          action={
            <Link to="/invoices" className="text-sm font-semibold text-primary hover:underline">
              সব দেখুন
            </Link>
          }
        >
          <ul className="divide-y divide-border text-sm">
            {sales.slice(0, 6).map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-medium">{s.invoice}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.date} · {s.items.length} আইটেম
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{taka(s.total)}</div>
                  {s.due > 0 && <div className="text-xs text-destructive">বাকি {taka(s.due)}</div>}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
