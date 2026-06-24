# Budgetify

A calm, single-user personal budgeting web app — log income and expenses,
organize them into categories, and view a Wealthsimple-style dashboard with
summary cards, a cash-flow bar chart, a category donut, and recent transactions.

Built with Next.js (App Router) + TypeScript, Supabase (Postgres, Auth, RLS),
Tailwind CSS v4, Recharts, and lucide-react.

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the dashboard, open **SQL Editor → New query**, paste the contents of
   [`supabase/migration.sql`](supabase/migration.sql), and **Run**. This creates
   the `categories` and `transactions` tables, indexes, and Row Level Security
   policies.
3. Open **Authentication → Sign In / Providers → Email** and **turn off
   "Confirm email"** so sign-up logs you straight in during local development.

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values from
**Project Settings → API Keys**:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-or-anon-key>
```

Paste the **publishable key** (`sb_publishable_...`) on newer projects, or the
legacy **anon key** on older ones — both work identically with `@supabase/ssr`.
This key is safe to expose to the browser; Row Level Security restricts every
query to the signed-in user's own rows. (The env var keeps the `ANON_KEY` name
by Supabase SSR convention regardless of which key value you use.)

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, and your account
is seeded with a starter set of categories on first dashboard load.

## How it works

- **Auth & route protection** live in `src/proxy.ts` (Next.js 16's renamed
  middleware) via `@supabase/ssr`. Unauthenticated users are redirected to
  `/login`.
- **Data fetching** happens in Server Components (`src/app/page.tsx`,
  `src/app/categories/page.tsx`); **mutations** are Server Actions in
  `src/app/actions/`. Interactive charts and forms are Client Components.
- **Amounts** are stored positive; the `type` column (`income` / `expense`)
  determines sign in all calculations (`src/lib/analytics.ts`).
- **Categories** are soft-deleted (archived), never removed — their color and
  name stay with historical transactions in the charts.
- **Category seeding** is lazy: on first dashboard load, if you have zero
  categories, a starter set is inserted (`src/lib/seed.ts`).

## v2 ideas (intentionally out of scope)

Budget targets per category, recurring transactions, CSV import, multi-currency.
The data model is left friendly to these.
