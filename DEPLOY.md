# Deploying ফার্মেসি ম্যানেজার (GitHub + Vercel)

The app already runs on Lovable at https://pharmaceutical-management.lovable.app.
These steps add a GitHub Actions check and a Vercel deployment next to it.

## One-time setup

1. **GitHub:** connect the project in Lovable (Lovable → GitHub → Connect). This repo is already connected.
2. **GitHub secrets:** repo → Settings → Secrets and variables → Actions. Add these three, using the values from `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
3. **Vercel project:** vercel.com → Add New → Project → import this repo. Vercel reads `vercel.json`
   (Bun install, `NITRO_PRESET=vercel bun run build`), so no build settings need changing.
4. **Vercel env vars:** Project → Settings → Environment Variables. Add the same three variables.
5. **Google sign-in:** add your Vercel domain to the login redirect allow-list in Lovable Cloud,
   otherwise Google login will fail on that domain.

## On every push to `main`

- GitHub Actions (`.github/workflows/ci.yml`) runs `bun install`, `bun run test` and `bun run build`.
- Vercel builds and deploys automatically. Pull requests get preview deployments.
- Lovable picks up the same commit, so the Lovable editor stays in sync.

## Checking a deploy

- The browser tab shows the green capsule icon and the title ends in "ফার্মেসি ম্যানেজার".
- Log in with email or Google and confirm the sidebar's save indicator shows "সেভ হয়েছে".
- If the page stays blank and the browser console shows "Missing Supabase environment variable(s)", one of the
  three variables was missing when that deploy was built. `VITE_` values are baked in at build time, so add it and redeploy.
