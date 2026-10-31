# Deploy (GitHub + Vercel)

1. Connect this project to GitHub (Lovable → GitHub → Connect).
2. GitHub repo → Settings → Secrets → Actions: add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (values from `.env`).
3. vercel.com → Add New Project → import the repo. Vercel reads `vercel.json`.
4. Vercel → Settings → Environment Variables: add the same three variables.
5. Every push to `main` runs tests + build (GitHub Actions) and Vercel deploys automatically.
6. Add your Vercel domain to the login redirect allow-list so Google sign-in works there.
