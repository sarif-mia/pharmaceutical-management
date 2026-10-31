import { LayoutDashboard, Pill, ShoppingCart, Truck, Tags, Receipt, PackagePlus, Users, Wallet, BarChart3, Settings, UserCog } from "lucide-react";

export const navigationGroups = [
  { title: "প্রধান", items: [
    { to: "/", label: "ড্যাশবোর্ড", shortLabel: "হোম", icon: LayoutDashboard },
    { to: "/sales", label: "বিক্রি (POS)", shortLabel: "বিক্রি", icon: ShoppingCart },
    { to: "/invoices", label: "ইনভয়েস", shortLabel: "ইনভয়েস", icon: Receipt },
  ] },
  { title: "স্টক", items: [
    { to: "/medicines", label: "ওষুধ ও স্টক", shortLabel: "স্টক", icon: Pill },
    { to: "/purchases", label: "ক্রয় / চালান", shortLabel: "ক্রয়", icon: PackagePlus },
    { to: "/categories", label: "ক্যাটাগরি", shortLabel: "ক্যাটাগরি", icon: Tags },
  ] },
  { title: "খাতা", items: [
    { to: "/customers", label: "কাস্টমার ও বাকি", shortLabel: "কাস্টমার", icon: Users },
    { to: "/suppliers", label: "সাপ্লায়ার", shortLabel: "সাপ্লায়ার", icon: Truck },
    { to: "/expenses", label: "খরচ", shortLabel: "খরচ", icon: Wallet },
    { to: "/reports", label: "রিপোর্ট", shortLabel: "রিপোর্ট", icon: BarChart3 },
    { to: "/staff", label: "কর্মচারী", shortLabel: "কর্মচারী", icon: UserCog },
    { to: "/settings", label: "সেটিংস", shortLabel: "সেটিংস", icon: Settings },
  ] },
] as const;

export const primaryNavigation = navigationGroups.flatMap((g) => [...g.items]).filter((i) => ["/", "/sales", "/medicines", "/invoices"].includes(i.to));