<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Pharmacy data lives in src/lib/pharmacy-store.ts (browser localStorage store) — why: rebuilt from an uploaded Laravel app without a backend yet; swap to Lovable Cloud when login/multi-device is needed.
- Sales are multi-item invoices; stock/due changes only through actions in src/lib/pharmacy-store.ts — why: one place enforces stock, expiry and due rules (tested in src/test/pharmacy-store.test.tsx).
- Medicine stock is counted in pieces; packSize (pieces per strip) is a selling helper only — why: keeps stock math single-unit.
- Signed-in user's whole PharmacyState is mirrored to Lovable Cloud table pharmacy_data (one JSON row per user) via src/lib/cloud-sync.ts; AuthGate in __root shows login inline — why: keeps existing local store/actions unchanged.
