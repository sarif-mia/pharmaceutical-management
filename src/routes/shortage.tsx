import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Copy, MessageCircle, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { Empty, PageTitle, Panel } from "@/components/shared/page-ui";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/meta";
import { shortageList, usePharmacy } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/shortage")({
  head: pageHead("ঘাটতি খাতা", "স্টক কম বা শেষ হওয়া ওষুধের কোম্পানিভিত্তিক অর্ডার তালিকা।"),
  component: Shortage,
});

function Shortage() {
  const st = usePharmacy();
  const groups = shortageList(st);
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  const text = (g: (typeof groups)[number]) =>
    `${st.settings.shopName} — অর্ডার (${g.company})\n` +
    g.items.map((i, n) => `${n + 1}. ${i.m.name} ${i.m.strength} — ${i.suggest} পিস`).join("\n");

  return (
    <>
      <PageTitle
        title="ঘাটতি খাতা"
        subtitle={`${total}টি ওষুধ অর্ডার করতে হবে · ${groups.length}টি কোম্পানি`}
      />
      {groups.length === 0 ? (
        <Empty text="এখন কোনো ওষুধের ঘাটতি নেই।" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <Panel
              key={g.company}
              title={
                <>
                  <ClipboardList className="h-4 w-4 text-primary" /> {g.company}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({g.items.length})
                  </span>
                </>
              }
            >
              <ul className="divide-y divide-border text-sm">
                {g.items.map(({ m, suggest }) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {m.name} <span className="text-muted-foreground">{m.strength}</span>
                      </div>
                      <div
                        className={`text-xs ${m.stock <= 0 ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        স্টক: {m.stock} পিস
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-semibold">
                      +{suggest} পিস
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
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
                <Button size="sm" asChild>
                  <Link to="/purchases">
                    <PackagePlus className="h-4 w-4" /> ক্রয় করুন
                  </Link>
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
