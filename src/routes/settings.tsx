import { createFileRoute } from "@tanstack/react-router";
import { Download, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Field, PageTitle, Panel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/meta";
import { actions, getState, today, usePharmacy } from "@/lib/pharmacy-store";

export const Route = createFileRoute("/settings")({
  head: pageHead("সেটিংস", "দোকানের নাম, লাইসেন্স, সতর্কতার নিয়ম এবং ডেটা ব্যাকআপ।"),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings } = usePharmacy();
  return (
    <>
      <PageTitle title="সেটিংস" subtitle="দোকানের তথ্য রসিদে দেখা যাবে" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="দোকানের তথ্য">
          <form key={JSON.stringify(settings)} className="grid gap-3" onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            actions.updateSettings({
              shopName: String(f.get("shopName")), address: String(f.get("address")), phone: String(f.get("phone")), license: String(f.get("license")),
              lowStock: Number(f.get("lowStock")) || 0, expiryDays: Number(f.get("expiryDays")) || 30,
            });
            toast.success("সেটিংস সেভ হলো");
          }}>
            <Field label="দোকানের নাম"><Input name="shopName" defaultValue={settings.shopName} required /></Field>
            <Field label="ঠিকানা"><Input name="address" defaultValue={settings.address} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ফোন"><Input name="phone" defaultValue={settings.phone} /></Field>
              <Field label="ড্রাগ লাইসেন্স নং"><Input name="license" defaultValue={settings.license} /></Field>
              <Field label="কম স্টক সীমা"><Input name="lowStock" type="number" min={0} defaultValue={settings.lowStock} /></Field>
              <Field label="মেয়াদ সতর্কতা (দিন আগে)"><Input name="expiryDays" type="number" min={1} defaultValue={settings.expiryDays} /></Field>
            </div>
            <Button type="submit">সেভ করুন</Button>
          </form>
        </Panel>
        <Panel title="ব্যাকআপ ও রিস্টোর">
          <p className="mb-4 text-sm text-muted-foreground">সব তথ্য এই ব্রাউজারে থাকে। নিয়মিত ব্যাকআপ ফাইল ডাউনলোড করে রাখুন।</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" }));
              a.download = `pharmacy-backup-${today()}.json`;
              a.click();
            }}><Download className="h-4 w-4" /> ব্যাকআপ ডাউনলোড</Button>
            <Button variant="outline" asChild>
              <label className="cursor-pointer"><Upload className="h-4 w-4" /> রিস্টোর
                <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try { actions.importData(JSON.parse(await file.text())); toast.success("ডেটা রিস্টোর হলো"); } catch { toast.error("ফাইলটি সঠিক নয়"); }
                }} />
              </label>
            </Button>
            <Button variant="destructive" onClick={() => { if (confirm("সব তথ্য মুছে ডেমো ডেটা ফিরে আসবে। নিশ্চিত?")) { actions.reset(); toast.success("রিসেট হলো"); } }}><RotateCcw className="h-4 w-4" /> রিসেট</Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
