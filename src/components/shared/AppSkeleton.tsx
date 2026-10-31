import { Skeleton } from "@/components/ui/skeleton";

export function AppSkeleton() {
  return (
    <div role="status" aria-label="দোকানের তথ্য লোড হচ্ছে" aria-busy="true" className="min-h-dvh bg-background">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8">
        <div className="mb-8 flex items-center gap-3"><Skeleton className="h-10 w-10" /><Skeleton className="h-5 w-40" /></div>
        <Skeleton className="mb-2 h-7 w-48" /><Skeleton className="mb-6 h-4 w-60" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="rounded-lg border border-border bg-card p-4"><Skeleton className="mb-4 h-8 w-8" /><Skeleton className="mb-2 h-6 w-24" /><Skeleton className="h-3 w-28" /></div>)}</div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]"><Skeleton className="h-60 w-full" /><div className="space-y-4">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div></div>
      </div>
      <span className="sr-only">লোড হচ্ছে…</span>
    </div>
  );
}