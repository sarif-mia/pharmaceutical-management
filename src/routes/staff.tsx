import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Panel, Field, selectCls, thCls, tdCls, Empty } from "@/components/shared/page-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABEL, useShop, type ShopRole } from "@/lib/cloud-sync";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [
    { title: "কর্মচারী ও অনুমতি — ফার্মেসি ম্যানেজার" },
    { name: "description", content: "দোকানের কর্মচারী যোগ করুন এবং মালিক, ম্যানেজার, ক্যাশিয়ার অনুমতি দিন।" },
    { property: "og:title", content: "কর্মচারী ও অনুমতি" },
    { property: "og:description", content: "দোকানের কর্মচারী ও তাদের অনুমতি।" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Staff,
});

type Member = { user_id: string; email: string; role: ShopRole };
type Invite = { id: string; email: string; role: ShopRole };

function Staff() {
  const shop = useShop();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const load = async () => {
    if (!shop) return;
    const [m, i] = await Promise.all([
      supabase.from("shop_members").select("user_id,email,role").eq("shop_id", shop.shopId),
      supabase.from("shop_invites").select("id,email,role").eq("shop_id", shop.shopId),
    ]);
    setMembers((m.data ?? []) as Member[]);
    setInvites((i.data ?? []) as Invite[]);
  };
  useEffect(() => { void load(); }, [shop?.shopId]);
  if (shop?.role !== "owner") return <Empty text="শুধু মালিক এই পাতা দেখতে পারেন" />;

  const invite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.from("shop_invites").insert({ shop_id: shop.shopId, email: String(f.get("email")).trim().toLowerCase(), role: f.get("role") as ShopRole });
    if (error) return void toast.error("যোগ করা যায়নি");
    toast.success("আমন্ত্রণ তৈরি হয়েছে — এই ইমেইল দিয়ে অ্যাকাউন্ট খুলে লগইন করলেই দোকানে যুক্ত হবে");
    e.currentTarget.reset();
    void load();
  };

  return (
    <>
      <PageTitle title="কর্মচারী ও অনুমতি" subtitle="ক্যাশিয়ার শুধু বিক্রি, ইনভয়েস ও কাস্টমার দেখতে পারেন; ম্যানেজার সেটিংস ছাড়া সব।" />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Panel title="নতুন কর্মচারী">
          <form onSubmit={invite} className="space-y-3">
            <Field label="ইমেইল"><Input name="email" type="email" required /></Field>
            <Field label="ভূমিকা">
              <select name="role" className={selectCls} defaultValue="cashier">
                <option value="cashier">ক্যাশিয়ার</option>
                <option value="manager">ম্যানেজার</option>
              </select>
            </Field>
            <Button className="w-full">আমন্ত্রণ দিন</Button>
          </form>
        </Panel>
        <Panel title="দোকানের সদস্য">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground"><tr><th className={thCls}>ইমেইল</th><th className={thCls}>ভূমিকা</th><th /></tr></thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m.user_id}>
                  <td className={tdCls}>{m.email}</td>
                  <td className={tdCls}>
                    {m.role === "owner" ? ROLE_LABEL.owner : (
                      <select className={selectCls} value={m.role} onChange={async (e) => {
                        const { error } = await supabase.from("shop_members").update({ role: e.target.value as ShopRole }).eq("shop_id", shop.shopId).eq("user_id", m.user_id);
                        if (error) toast.error("বদলানো যায়নি"); else void load();
                      }}>
                        <option value="cashier">ক্যাশিয়ার</option><option value="manager">ম্যানেজার</option>
                      </select>
                    )}
                  </td>
                  <td className={`${tdCls} text-right`}>
                    {m.role !== "owner" && <Button size="icon" variant="ghost" aria-label="সরান" onClick={async () => {
                      if (!confirm(`${m.email} কে সরাবেন?`)) return;
                      await supabase.from("shop_members").delete().eq("shop_id", shop.shopId).eq("user_id", m.user_id); void load();
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </td>
                </tr>
              ))}
              {invites.map((i) => (
                <tr key={i.id} className="text-muted-foreground">
                  <td className={tdCls}>{i.email} <span className="text-xs">(অপেক্ষমাণ)</span></td>
                  <td className={tdCls}>{ROLE_LABEL[i.role]}</td>
                  <td className={`${tdCls} text-right`}><Button size="icon" variant="ghost" aria-label="বাতিল" onClick={async () => { await supabase.from("shop_invites").delete().eq("id", i.id); void load(); }}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}
