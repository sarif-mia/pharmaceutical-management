import { createFileRoute } from "@tanstack/react-router";
import { Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageTitle, Panel, selectCls, tdCls, thCls } from "@/components/shared/page-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/meta";
import { actions, taka, today, usePharmacy } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/expenses")({
  head: pageHead("খরচ", "দোকানের দৈনিক খরচ — বিল, ভাড়া, বেতন, নাস্তা — লিখে রাখুন।"),
  component: Expenses,
});

const TYPES = ["সাধারণ", "বিল", "ভাড়া", "বেতন", "পরিবহন", "অন্যান্য"];

function Expenses() {
  const { expenses } = usePharmacy();
  const month = today().slice(0, 7);
  const monthTotal = expenses
    .filter((e) => e.date.startsWith(month))
    .reduce((a, e) => a + e.amount, 0);
  return (
    <>
      <PageTitle title="খরচ" subtitle={`এই মাসের খরচ ${taka(monthTotal)}`} />
      <Panel
        title={
          <>
            <Wallet className="h-5 w-5 text-primary" /> নতুন খরচ
          </>
        }
        className="mb-6"
      >
        <form
          className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            actions.addExpense({
              title: String(f.get("title")),
              type: String(f.get("type")),
              amount: Number(f.get("amount")),
              date: String(f.get("date")),
            });
            e.currentTarget.reset();
            toast.success("খরচ যোগ হলো");
          }}
        >
          <Input name="title" placeholder="বিবরণ (যেমন: বিদ্যুৎ বিল)" required />
          <select name="type" className={selectCls}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <Input name="amount" type="number" min={1} placeholder="টাকা" required />
          <Input name="date" type="date" defaultValue={today()} required />
          <Button type="submit">যোগ করুন</Button>
        </form>
      </Panel>
      <div className="space-y-2 md:hidden">
        {expenses.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.title}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-foreground">
                  {e.type}
                </span>
                {e.date}
              </p>
            </div>
            <span className="shrink-0 font-semibold">{taka(e.amount)}</span>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0"
              aria-label="মুছুন"
              onClick={() => actions.removeExpense(e.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {!expenses.length && (
          <p className="rounded-xl border border-border bg-card py-8 text-center text-sm text-muted-foreground">
            কোনো খরচ নেই
          </p>
        )}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className={thCls}>তারিখ</th>
              <th className={thCls}>বিবরণ</th>
              <th className={thCls}>ধরন</th>
              <th className={thCls}>টাকা</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className={tdCls}>{e.date}</td>
                <td className={`${tdCls} font-medium`}>{e.title}</td>
                <td className={tdCls}>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{e.type}</span>
                </td>
                <td className={`${tdCls} font-semibold`}>{taka(e.amount)}</td>
                <td className={`${tdCls} text-right`}>
                  <Button size="icon" variant="ghost" onClick={() => actions.removeExpense(e.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {!expenses.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  কোনো খরচ নেই
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
