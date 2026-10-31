import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ledger, taka, usePharmacy } from "@/lib/pharmacy-store";

export function LedgerButton({
  kind,
  id,
  name,
}: {
  kind: "customer" | "supplier";
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const st = usePharmacy();
  const rows = open ? ledger(st, kind, id) : [];
  return (
    <>
      <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => setOpen(true)}>
        <BookOpen className="h-4 w-4" /> খাতা দেখুন
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{name} — হিসাবের খাতা</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">তারিখ</th>
                  <th className="p-2 text-left">বিবরণ</th>
                  <th className="p-2 text-right">বাকি যোগ</th>
                  <th className="p-2 text-right">জমা</th>
                  <th className="p-2 text-right">ব্যালান্স</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-2">{r.date}</td>
                    <td className="p-2">{r.ref}</td>
                    <td className="p-2 text-right text-destructive">
                      {r.debit ? taka(r.debit) : ""}
                    </td>
                    <td className="p-2 text-right text-primary">
                      {r.credit ? taka(r.credit) : ""}
                    </td>
                    <td className="p-2 text-right font-semibold">{taka(r.balance)}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      কোনো লেনদেন নেই
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            প্রিন্ট
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
