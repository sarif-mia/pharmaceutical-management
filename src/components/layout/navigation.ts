import { LayoutDashboard, Pill, ShoppingCart, Truck, Tags, Receipt, PackagePlus, Users, Wallet, BarChart3, Settings, UserCog, Calculator } from "lucide-react";

export const navigationGroups = [
  { title: "কাউন্টার ও বিক্রি", items: [
    { to: "/", label: "ড্যাশবোর্ড", shortLabel: "হোম", icon: LayoutDashboard },
    { to: "/sales", label: "বিক্রি (POS)", shortLabel: "বিক্রি", icon: ShoppingCart },
    { to: "/invoices", label: "ইনভয়েস", shortLabel: "ইনভয়েস", icon: Receipt },
    { to: "/closing", label: "দিনশেষ হিসাব", shortLabel: "দিনশেষ", icon: Calculator },
  ] },
  { title: "স্টক ও সাপ্লাই", items: [
    { to: "/medicines", label: "ওষুধ ও ব্যাচ স্টক", shortLabel: "স্টক", icon: Pill },
    { to: "/purchases", label: "ক্রয় / চালান", shortLabel: "ক্রয়", icon: PackagePlus },
    { to: "/categories", label: "ক্যাটাগরি", shortLabel: "ক্যাটাগরি", icon: Tags },
  ] },
  { title: "খাতা ও হিসাব", items: [
    { to: "/customers", label: "কাস্টমার ও বাকি", shortLabel: "কাস্টমার", icon: Users },
    { to: "/suppliers", label: "সাপ্লায়ার খাতা", shortLabel: "সাপ্লায়ার", icon: Truck },
    { to: "/expenses", label: "দোকান খরচ", shortLabel: "খরচ", icon: Wallet },
    { to: "/reports", label: "লাভ-ক্ষতি রিপোর্ট", shortLabel: "রিপোর্ট", icon: BarChart3 },
  ] },
  { title: "অ্যাডমিন", items: [
    { to: "/staff", label: "কর্মচারী ও রোল", shortLabel: "কর্মচারী", icon: UserCog },
    { to: "/settings", label: "সেটিংস ও ব্যাকআপ", shortLabel: "সেটিংস", icon: Settings },
  ] },
] as const;

export const allNavigation = navigationGroups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));
const byPath = (p: string) => allNavigation.find((i) => i.to === p)!;
/** Mobile bottom bar: left two, center POS, right one, then "more". */
export const mobileLeft = [byPath("/"), byPath("/medicines")];
export const mobileCenter = byPath("/sales");
export const mobileRight = [byPath("/invoices")];
export const primaryNavigation = [...mobileLeft, mobileCenter, ...mobileRight];
