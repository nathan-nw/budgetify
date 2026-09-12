# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server at http://localhost:3000
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)
- No test framework is configured.

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`). Schema lives in `supabase/migration.sql` — apply it in the Supabase SQL editor when setting up a fresh project. Related migrations: `supabase/migration-preferences.sql`, `supabase/fix-duplicate-categories.sql`.

## Architecture

Next.js 16 App Router + React 19 + TypeScript, Supabase (Postgres + Auth + RLS), Tailwind v4, Recharts, lucide-react. Single-user personal budgeting app.

**Auth / route protection.** Next.js 16 renamed `middleware.ts` to `proxy.ts` — the entry point is `src/proxy.ts`, which delegates to `updateSession` in `src/lib/supabase/middleware.ts`. Unauthenticated users are redirected to `/login`. There are three Supabase clients, do not mix them:
- `src/lib/supabase/server.ts` — Server Components / Server Actions (reads cookies via `next/headers`).
- `src/lib/supabase/client.ts` — Client Components (browser).
- `src/lib/supabase/middleware.ts` — the proxy only; refreshes the session cookie.

**Data flow.** Server Components fetch (`src/app/page.tsx`, `src/app/transactions/page.tsx`, `src/app/categories/page.tsx`, `src/app/settings/page.tsx`); mutations are Server Actions in `src/app/actions/` (`transactions.ts`, `categories.ts`, `preferences.ts`, `account.ts`). Client Components handle charts and forms. `user_id` is always resolved server-side from the session — never trust it from the client.

**Domain rules baked into the code** (see `DATABASE.md` for the full schema reference):
- Amounts are stored **positive**; sign is derived from `type` (`income` / `expense`) inside `src/lib/analytics.ts`. Never store negative amounts.
- Categories are **soft-deleted** via `is_archived`, never removed. Archived categories still appear in historical charts/lists because color/name are read through the join. `on delete set null` on `transactions.category_id` is only a safety net.
- A category's `type` is **immutable** once created — only `name` and `color` are editable. The transaction form filters the category dropdown by selected type.
- Category **seeding is lazy**: on first dashboard load with zero categories, `src/lib/seed.ts` upserts a starter set with `onConflict: user_id,name,type, ignoreDuplicates` (safe against concurrent first-load renders). There is no DB trigger.
- RLS is enabled on all tables and gates every read/write by `auth.uid() = user_id`. Do not add app-level auth checks that duplicate this — enforce policy in SQL.

**Preferences.** Per-user UI timeframes live in the `preferences` table (dashboard summary cards + transactions summary card). Reads fall back to `DEFAULT_PREFERENCES` in `src/lib/preferences.ts` when no row exists; saves upsert on `user_id`.

**Types.** Row shapes are mirrored in `src/lib/types.ts` (`Category`, `Transaction`, `TransactionWithCategory`, `Preferences`, timeframe unions). Keep in sync with `supabase/migration.sql` and `DATABASE.md`.
