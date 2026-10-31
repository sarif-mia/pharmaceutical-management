import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { usePharmacy } from "@/lib/pharmacy-store";
import { canOpen, type ShopRole } from "@/lib/cloud-sync";
import { allNavigation } from "./navigation";
import { Pill, User } from "lucide-react";

export function GlobalSearch({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: ShopRole;
}) {
  const navigate = useNavigate();
  const { medicines, customers } = usePharmacy();
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onOpenChange]);
  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="পাতা, ওষুধ, জেনেরিক বা কাস্টমার খুঁজুন…" />
      <CommandList>
        <CommandEmpty>কিছু পাওয়া যায়নি</CommandEmpty>
        <CommandGroup heading="পাতা">
          {allNavigation
            .filter((i) => canOpen(role, i.to))
            .map(({ to, label, icon: Icon, group }) => (
              <CommandItem key={to} value={`${label} ${group}`} onSelect={() => go(to)}>
                <Icon className="h-4 w-4" />
                {label}
                <span className="ml-auto text-xs text-muted-foreground">{group}</span>
              </CommandItem>
            ))}
        </CommandGroup>
        {canOpen(role, "/medicines") && (
          <CommandGroup heading="ওষুধ">
            {medicines.slice(0, 200).map((m) => (
              <CommandItem
                key={m.id}
                value={`${m.name} ${m.generic} ${m.strength} ${m.id}`}
                onSelect={() => go("/medicines")}
              >
                <Pill className="h-4 w-4" />
                {m.name} {m.strength}
                <span className="ml-auto text-xs text-muted-foreground">স্টক {m.stock}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {canOpen(role, "/customers") && (
          <CommandGroup heading="কাস্টমার">
            {customers.slice(0, 200).map((c) => (
              <CommandItem
                key={c.id}
                value={`${c.name} ${c.phone} ${c.id}`}
                onSelect={() => go("/customers")}
              >
                <User className="h-4 w-4" />
                {c.name}
                <span className="ml-auto text-xs text-muted-foreground">{c.phone}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
