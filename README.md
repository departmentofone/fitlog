# FitLog

A personal workout and meal tracker: log sets by exercise (with a muscle-group
diagram picker), a preworkout checkbox, and meals tracked by grams or common
servings ("1 small egg") with running macro/calorie totals and trend charts.

It's a Progressive Web App (PWA) — no App Store/Play Store needed. Open it in
your phone's browser and "Add to Home Screen" to install it like a native app.

## Stack

- Vite + React + TypeScript, Tailwind CSS
- Supabase (Postgres + Auth + Row Level Security) for data/accounts
- `@tanstack/react-query` for data fetching
- Recharts for the macro trend charts
- `vite-plugin-pwa` for the installable app shell

## One-time setup

### 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste in [`supabase/migration.sql`](supabase/migration.sql), and run it.
3. Paste in [`supabase/seed_foods.sql`](supabase/seed_foods.sql) and run it (seeds the shared food library).
4. Go to **Project Settings → API** and copy the **Project URL** and the **anon / publishable** key
   (never the `service_role`/secret key — that one must never be used client-side).

### 2. Local environment

Copy `.env.example` to `.env.local` and fill in the two values from above:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open the printed URL. To test on your phone, make sure your phone is on the
same Wi-Fi as this computer and open `http://<this-computer's-LAN-IP>:5173`
(the dev server listens on all interfaces).

## Deploying so you (and a friend) can install it

1. Push this folder to a GitHub repo (or deploy directly from your machine with the Vercel CLI).
2. Create a free account at [vercel.com](https://vercel.com) and import the repo (or run `vercel` /
   `vercel --prod` from this folder — it'll prompt you to log in in your browser).
3. In the Vercel project's settings, add the same two environment variables
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and redeploy.
4. Open the deployed HTTPS URL on your phone:
   - **iPhone**: open in Safari → Share → **Add to Home Screen**.
   - **Android**: open in Chrome → menu (⋮) → **Install app** / **Add to Home Screen**.

### Adding your friend

They just open the same URL and sign up with their own email/password — Row
Level Security means every user only ever sees their own workouts and meals.
The shared food library (the ~85 seeded common foods) is visible to everyone.

## Adding more foods

Use the **+ New food** button in the Meals tab any time — enter the
calories/protein/carbs/fat per 100g and, optionally, a common serving (e.g.
"1 slice" = 32g). To bulk-add more shared foods later, write more `insert into
foods (...)` rows following the pattern in `supabase/seed_foods.sql` and run
them in the SQL Editor.

## Regenerating the app icons

If you want to change the icon design, edit `scripts/generate-icons.mjs` (and/or
`public/favicon.svg`) and run:

```bash
node scripts/generate-icons.mjs
```
