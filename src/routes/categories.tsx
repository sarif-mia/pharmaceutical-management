import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { PageTitle } from "@/components/shared/page-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, usePharmacy } from "@/lib/pharmacy-store";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/categories")({
  head: pageHead("ক্যাটাগরি", "ওষুধের ক্যাটাগরি সাজান।"),
  component: Categories,
});

function Categories() {
  const { categories, medicines } = usePharmacy();
  return (
    <>
      <PageTitle title="ক্যাটাগরি" />
      <form
        className="mb-6 flex max-w-md gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          actions.addCategory(String(f.get("name")));
          e.currentTarget.reset();
        }}
      >
        <Input name="name" placeholder="নতুন ক্যাটাগরির নাম" required />
        <Button type="submit">যোগ করুন</Button>
      </form>
      <div className="flex flex-wrap gap-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-full border border-border bg-card py-2 pl-5 pr-2">
            <span className="font-semibold">{c.name}</span>
            <span className="rounded-full bg-secondary px-2 text-xs text-secondary-foreground">{medicines.filter((m) => m.categoryId === c.id).length}</span>
            <button aria-label="মুছুন" onClick={() => actions.removeCategory(c.id)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </>
  );
}
