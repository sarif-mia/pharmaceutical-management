# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory
defines a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` — those are Next.js / Remix conventions. The only root layout
is `src/routes/__root.tsx`.

## Conventions

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `users/index.tsx` | `/users` |
| `users/$id.tsx` | `/users/:id` (dynamic — bare `$`, no curly braces) |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment) |
| `files/$.tsx` | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx` | layout route (renders children via `<Outlet />`) |
| `__root.tsx` | app shell — wraps every page; preserve `<Outlet />` |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.

## Pages in this app

Every page sets its tab title with `pageHead(title, description)` from `src/lib/meta.ts`,
which appends the app name. Add new pages to `src/components/layout/navigation.ts`, and to
`canOpen` in `src/lib/cloud-sync.ts` if cashiers or managers should not see them.

| File | URL | Page | Who can open |
| --- | --- | --- | --- |
| `index.tsx` | `/` | ড্যাশবোর্ড (Dashboard) | All |
| `sales.tsx` | `/sales` | বিক্রি (POS) | All |
| `invoices.tsx` | `/invoices` | ইনভয়েস, returns, WhatsApp receipt | All |
| `customers.tsx` | `/customers` | কাস্টমার ও বাকি খাতা | All |
| `closing.tsx` | `/closing` | দিনশেষ হিসাব (Z-report) | All |
| `medicines.tsx` | `/medicines` | ওষুধ ও ব্যাচ স্টক | Owner, manager |
| `purchases.tsx` | `/purchases` | ক্রয় / চালান | Owner, manager |
| `suppliers.tsx` | `/suppliers` | সাপ্লায়ার ledger | Owner, manager |
| `shortage.tsx` | `/shortage` | ঘাটতি খাতা | Owner, manager |
| `categories.tsx` | `/categories` | ক্যাটাগরি | Owner, manager |
| `expenses.tsx` | `/expenses` | খরচ | Owner, manager |
| `reports.tsx` | `/reports` | রিপোর্ট | Owner, manager |
| `settings.tsx` | `/settings` | সেটিংস, backup / restore | Owner |
| `staff.tsx` | `/staff` | কর্মচারী ও অনুমতি | Owner |
