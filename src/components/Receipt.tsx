import { PAYMENT_LABEL, taka, usePharmacy, type Sale } from "@/lib/pharmacy-store";

export function Receipt({ sale }: { sale: Sale }) {
  const { settings, customers } = usePharmacy();
  const cust = customers.find((c) => c.id === sale.customerId);
  return (
    <div className={`receipt mx-auto w-full ${settings.receiptWidth === "58" ? "max-w-[220px] text-[11px]" : "max-w-[320px] text-xs"} bg-card p-3 font-mono text-card-foreground`}>
      <div className="text-center">
        <div className="text-base font-bold">{settings.shopName}</div>
        <div>{settings.address}</div>
        <div>ফোন: {settings.phone}</div>
        <div>ড্রাগ লাইসেন্স: {settings.license}</div>
      </div>
      <div className="my-2 border-t border-dashed border-foreground/40" />
      <div className="flex justify-between"><span>{sale.invoice}</span><span>{sale.date} {sale.time}</span></div>
      {cust && <div>কাস্টমার: {cust.name} ({cust.phone})</div>}
      <div className="my-2 border-t border-dashed border-foreground/40" />
      <table className="w-full">
        <tbody>
          {sale.items.map((i, k) => (
            <tr key={k}>
              <td className="py-0.5 pr-1">{i.name}<div className="opacity-70">{i.qty} × {i.price}</div></td>
              <td className="text-right align-top">{(i.qty * i.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="my-2 border-t border-dashed border-foreground/40" />
      <Row a="সাবটোটাল" b={taka(sale.subtotal)} />
      {sale.discount > 0 && <Row a="ছাড়" b={`- ${taka(sale.discount)}`} />}
      <Row a="মোট" b={taka(sale.total)} bold />
      <Row a={`পরিশোধ (${PAYMENT_LABEL[sale.method]})`} b={taka(sale.paid)} />
      {sale.trxId && <Row a="TrxID" b={sale.trxId} />}
      {sale.due > 0 && <Row a="বাকি" b={taka(sale.due)} bold />}
      <div className="my-2 border-t border-dashed border-foreground/40" />
      <div className="text-center">ধন্যবাদ, আবার আসবেন। সুস্থ থাকুন।</div>
    </div>
  );
}

function Row({ a, b, bold }: { a: string; b: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "text-sm font-bold" : ""}`}><span>{a}</span><span>{b}</span></div>;
}
