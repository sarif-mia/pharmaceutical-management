import type * as React from "react";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="no-print page-heading mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-semibold sm:text-2xl lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, className = "", action }: { title?: React.ReactNode; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`min-w-0 border-t border-border bg-card px-0 py-4 sm:px-4 sm:py-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          {title && <h2 className="flex min-w-0 items-center gap-2 font-display text-sm font-semibold sm:text-base">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, icon: Icon, tone = "bg-secondary text-secondary-foreground" }: { label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }>; tone?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className={`mb-2 grid h-8 w-8 place-items-center rounded-md ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="break-words font-display text-xl font-semibold tabular-nums sm:text-2xl">{value}</div>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{label}</div>
    </div>
  );
}

export const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
export const thCls = "px-3 py-2.5 text-left font-medium";
export const tdCls = "px-3 py-2.5";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{text}</div>;
}
