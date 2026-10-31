# ফার্মেসি ম্যানেজার · Pharmacy Manager

![ফার্মেসি ম্যানেজার logo](public/favicon.svg)

A Bangla-first stock, sales and ledger app for Bangladeshi pharmacies: sell from the counter,
track every batch, and close the day with the numbers matching.

**[Live app](https://pharmaceutical-management.lovable.app)** ·
[Lovable editor](https://lovable.dev/projects/f043e857-4114-438c-83a1-f4dcae584b56) ·
[Deploy guide](DEPLOY.md)

## Features

### Counter & sales

- Fast POS: search by brand, generic or barcode (camera scanner included), F2 shortcut
- Sell by strip or piece, with same-generic alternatives when a brand is out of stock
- Multi-item invoices with percent discount, cash / bKash / Nagad / card, split payments and MFS TrxID
- 58 mm / 80 mm receipts with dosage instructions and a QR code; WhatsApp receipts
- Sales returns and a cashier shift closing (Z-report)

### Stock & supply

- Batch-wise stock: purchases add batches, sales use the earliest-expiry batch first, expired batches are blocked
- Low-stock and expiry alerts, a shortage list (ঘাটতি খাতা) grouped by company
- Damage / expired / lost adjustments and supplier returns
- Supplier invoices (চালান) and supplier payables

### Ledgers & reports

- Customer and supplier ledgers (খাতা) with running balance and WhatsApp due reminders
- Expenses, daily closing, printable reports and CSV export

### Shop & staff

- Email or Google login; all data synced online per shop with a live save indicator
- Staff accounts sharing one shop, with role-based access
- Light / dark theme, counter mode, mobile bottom bar, installable on phone home screens

## Roles

| Role | Can open |
| --- | --- |
| মালিক (Owner) | Everything |
| ম্যানেজার (Manager) | Everything except Settings and Staff |
| ক্যাশিয়ার (Cashier) | Dashboard, POS, Invoices, Customers, Closing |

The server enforces the same limits when data is saved.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, SSR) on Vite
- Tailwind CSS v4 and shadcn/ui (Radix) components
- Lovable Cloud (Supabase) for auth and the per-shop data row
- Vitest + Testing Library for tests, Bun as the package manager

## Getting started

You need [Bun](https://bun.sh) (CI uses it; `npm` also works).

```sh
git clone https://github.com/sarif-mia/pharmaceutical-management.git
cd pharmaceutical-management
bun install
bun run dev
```

The app reads these from `.env`:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Lovable Cloud project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public (anon) key used by the browser |
| `VITE_SUPABASE_PROJECT_ID` | Project id |

### Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run preview` | Serve the production build locally |
| `bun run test` | Run the test suite once |
| `bun run lint` | ESLint |
| `bun run format` | Prettier |

## Project structure

```text
public/                  favicon.svg (logo source), favicon.ico, app icons, site.webmanifest
src/routes/              one file per page (see src/routes/README.md)
src/lib/pharmacy-store.ts   all pharmacy data and actions: stock, batches, sales, dues
src/lib/cloud-sync.ts       per-shop online sync, roles and page access
src/lib/meta.ts             APP_NAME and per-page <head> helper
src/components/layout/   navigation and the app shell (sidebar, headers, mobile bar)
src/components/shared/   page primitives, BrandMark logo, loading skeletons
src/components/ui/       shadcn/ui components
src/test/                store and routing tests
drizzle/migrations/      database schema and RPCs (shop_data, staff roles)
```

### Changing the name or logo

- **Name:** edit `APP_NAME` in `src/lib/meta.ts`, plus `name` / `short_name` in `public/site.webmanifest`.
  Each shop's own name (shown in the sidebar and on receipts) is set in the app under সেটিংস.
- **Logo:** edit `public/favicon.svg`. The in-app logo uses this file directly. Then regenerate
  `favicon.ico`, `apple-touch-icon.png` and `icon-*.png` from it at the same sizes.

## Working with Lovable

This repo is connected to Lovable. Changes made in the Lovable editor are committed here, and
commits pushed to `main` sync back to the editor. Keep `main` working, and never force-push or
rewrite pushed history, because that rewrites the project history on Lovable's side too.

## Deployment

Every push to `main` runs tests and a build in GitHub Actions, and Vercel deploys it.
See [DEPLOY.md](DEPLOY.md) for the one-time setup.
