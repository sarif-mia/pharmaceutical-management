import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Copy, MessageCircle, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Empty, PageTitle, Panel } from "@/components/shared/page-ui";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/meta";
import { expiryReturnList, taka, usePharmacy } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/expiry")({
  head: pageHead("মেয়াদ শেষ তালিকা", "সামনে মেয়াদ শেষ হবে এমন ওষুধ কোম্পানি ধরে ফেরত দেওয়ার তালিকা।"),
  component: Expiry,
});

const RANGES = [30, 60, 90];

function Expiry() {
  const st = usePharmacy();
  const [days, setDays] = useState(60);
  const groups = expiryReturnList(st, days);
  const total = groups.reduce((a, g) => a + g.value, 0);
  const text = (g: (typeof groups)[number]) =>
    `${st.settings.shopName} — মেয়াদ শেষ ফেরত (${g.company})\n` +
    g.items
      .map(
        (i, n) =>
          `${n + 1}. ${i.m.name} ${i.m.strength} — ব্যাচ ${i.b.no}, মেয়াদ ${i.b.expiry}, ${i.b.qty} পিস`,
      )
      .join("\n") +
    `\nমোট: ${taka(g.value)}`;

  return (
    <>
      <PageTitle
        title="মেয়াদ শেষ তালিকা"
        subtitle={`${groups.length}টি কোম্পানি · মোট ক্রয়মূল্য ${taka(total)}`}
        action={
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> প্রিন্ট
          </Button>
        }
      />
      <div className="mb-4 flex gap-2 print:hidden">
        {RANGES.map((d) => (
          <Button
            key={d}
            size="sm"
            variant={d === days ? "default" : "outline"}
            onClick={() => setDays(d)}
          >
            {d} দিনের মধ্যে
          </Button>
        ))}
      </div>
      {groups.length === 0 ? (
        <Empty text={`আগামী ${days} দিনে কোনো ওষুধের মেয়াদ শেষ হচ্ছে না।`} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <Panel
              key={g.company}
              title={
                <>
                  <CalendarClock className="h-4 w-4 text-primary" /> {g.company}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({taka(g.value)})
                  </span>
                </>
              }
            >
              <ul className="divide-y divide-border text-sm">
                {g.items.map(({ m, b, expired }) => (
                  <li key={m.id + b.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {m.name} <span className="text-muted-foreground">{m.strength}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ব্যাচ {b.no} · {b.qty} পিস
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${expired ? "bg-destructive/10 text-destructive" : "bg-secondary"}`}
                    >
                      {expired ? "মেয়াদ শেষ" : b.expiry}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(text(g));
                    toast.success("তালিকা কপি হলো");
                  }}
                >
                  <Copy className="h-4 w-4" /> কপি
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open(`https://wa.me/?text=${encodeURIComponent(text(g))}`, "_blank")
                  }
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
