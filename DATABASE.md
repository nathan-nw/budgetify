# Database reference

Snapshot of the Budgetify database (Supabase / Postgres). **Source of truth is
[`supabase/migration.sql`](supabase/migration.sql)** plus the one-time
[`supabase/fix-duplicate-categories.sql`](supabase/fix-duplicate-categories.sql)
(which added the unique index). This file is the human-readable summary — keep it
in sync when the schema changes.

## Overview

```
auth.users (managed by Supabase)
   │  id (uuid)
   │
   ├──< categories.user_id              (on delete cascade)
   ├──< transactions.user_id            (on delete cascade)
   ├──< recurring_transactions.user_id  (on delete cascade)
   └──< preferences.user_id             (on delete cascade, one row per user)

categories
   │  id (uuid)
   ├──< transactions.category_id             (on delete set null)
   └──< recurring_transactions.category_id   (on delete set null)

recurring_transactions
   │  id (uuid)
   └──< transactions.recurring_id            (on delete set null)
```

- **One user → many categories, one user → many transactions.**
- **One category → many transactions.** Deleting a category sets the
  transaction's `category_id` to `NULL` (safety net only — the app archives
  instead of deleting; see conventions).
- `auth.users` is Supabase's built-in auth table; we never write to it directly.

## Table: `categories`

User-defined buckets for income or expense.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `user_id` | `uuid` not null | FK → `auth.users(id)` `on delete cascade` |
| `name` | `text` not null | e.g. "Groceries" |
| `type` | `text` not null | `check in ('income','expense')` — **fixed once set** |
| `color` | `text` not null | hex, `default '#378ADD'`; used for chart slices + dots |
| `is_archived` | `boolean` not null | `default false` — soft-delete flag |
| `created_at` | `timestamptz` not null | `default now()` |

Indexes:
- `categories_user_idx` on `(user_id)`
- `categories_user_name_type_uidx` **UNIQUE** on `(user_id, name, type)` — prevents
  duplicate categories and makes the lazy seed idempotent (upsert conflict target).

## Table: `transactions`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `user_id` | `uuid` not null | FK → `auth.users(id)` `on delete cascade` |
| `category_id` | `uuid` null | FK → `categories(id)` `on delete set null` |
| `type` | `text` not null | `check in ('income','expense')` |
| `amount` | `numeric(12,2)` not null | `check (amount >= 0)` — **always positive**; sign comes from `type` |
| `occurred_on` | `date` not null | `default current_date` |
| `note` | `text` null | optional description |
| `recurring_id` | `uuid` null | FK → `recurring_transactions(id)` `on delete set null`; set on rows materialized from a recurring rule |
| `created_at` | `timestamptz` not null | `default now()` |

Indexes:
- `transactions_user_date_idx` on `(user_id, occurred_on desc)` — powers the
  date-sorted lists and date-range queries.

## Table: `recurring_transactions`

Rules that the app materializes into real `transactions` rows lazily on
dashboard load (see [`src/lib/recurring.ts`](src/lib/recurring.ts)). Introduced
in [`supabase/migration-recurring.sql`](supabase/migration-recurring.sql).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `user_id` | `uuid` not null | FK → `auth.users(id)` `on delete cascade` |
| `category_id` | `uuid` null | FK → `categories(id)` `on delete set null` |
| `type` | `text` not null | `check in ('income','expense')` |
| `amount` | `numeric(12,2)` not null | `check (amount >= 0)` |
| `note` | `text` null | copied onto each generated transaction |
| `frequency` | `text` not null | `check in ('daily','weekly','biweekly','monthly','yearly')` |
| `start_date` | `date` not null | first occurrence |
| `next_due` | `date` not null | next date the runner will materialize; advances after each insert |
| `end_date` | `date` null | inclusive; when set and `next_due > end_date`, `is_active` flips false |
| `is_active` | `boolean` not null | `default true`; false = paused/stopped (soft-delete) |
| `created_at` | `timestamptz` not null | `default now()` |

Indexes:
- `recurring_user_active_due_idx` on `(user_id, is_active, next_due)` — used by
  the catch-up runner.

## Table: `preferences`

Per-user UI preferences — the timeframe each summary is calculated over. One row
per user, created lazily on first save (upsert). See
[`supabase/migration-preferences.sql`](supabase/migration-preferences.sql).

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` PK | FK → `auth.users(id)` `on delete cascade` (also the PK — one row/user) |
| `dashboard_timeframe` | `text` not null | `default 'month'`, `check in ('month','last6','last12','ytd','all')` — dashboard summary cards |
| `transactions_summary_timeframe` | `text` not null | `default 'month'`, `check in ('month','year','all')` — transactions summary card |
| `updated_at` | `timestamptz` not null | `default now()` |

Reads fall back to `DEFAULT_PREFERENCES` (`src/lib/preferences.ts`) when no row
exists; saving upserts on `user_id` (server action `updatePreferences`).

## Row Level Security

RLS is **enabled on all four tables**. `categories`, `transactions`, and
`recurring_transactions` each have four policies
(`select`/`insert`/`update`/`delete`); `preferences` has three
(`select`/`insert`/`update` — no delete needed, the cascade handles user removal).
All are keyed on the authenticated user:

```sql
using (auth.uid() = user_id)        -- select / update / delete
with check (auth.uid() = user_id)   -- insert
```

Effect: a user can only ever read or modify their own rows, enforced inside
Postgres (not in app code). Verified: an anon insert and a spoofed-`user_id`
insert both return `403`.

## Conventions & rules (how the app uses the schema)

- **Amounts are positive; `type` determines sign** in every calculation
  (`src/lib/analytics.ts`). Never store negative amounts.
- **Categories are soft-deleted, not removed.** "Delete" in the UI sets
  `is_archived = true`. Archived categories drop out of the add/edit dropdown but
  still render in historical charts/lists, because each transaction carries its
  category's stored `color`/`name`. `on delete set null` on `category_id` is only
  a safety net.
- **A category's `type` is immutable** once created (only `name`/`color` are
  editable). The transaction form filters categories by the selected type.
- **`user_id` is always set server-side** from the authenticated session (Server
  Actions in `src/app/actions/`), never trusted from the client.
- **Recurring rules are materialized on visit, not by a cron.** The dashboard
  page calls `materializeDueRecurring` after `ensureSeedCategories`; the runner
  inserts every occurrence due on or before today, advances `next_due`, and
  flips `is_active` to false once past `end_date`. Editing a materialized
  transaction changes only that instance — the rule keeps producing future
  ones. Stopping a rule is a soft-delete (`is_active = false`), so
  `transactions.recurring_id` links to history stay intact.

## Seeding

No DB trigger. On first dashboard load, if a user has zero categories, the app
inserts a starter set (`src/lib/seed.ts`) via **upsert with
`onConflict: user_id,name,type, ignoreDuplicates`**, so concurrent first-load
renders can't double-seed. Starter set: Salary, Freelance, Other income
(income); Rent, Groceries, Dining, Transport, Utilities, Entertainment, Other
(expense).

## TypeScript mirror

The row shapes are typed in [`src/lib/types.ts`](src/lib/types.ts) as `Category`,
`Transaction`, `TransactionWithCategory` (a transaction joined with its `category`
for color/name), `RecurringTransaction` (with the `RecurringFrequency` union),
and `Preferences` (with the `DashboardTimeframe` / `TransactionsTimeframe`
unions). Keep those in sync with this schema.
