-- Budgetify initial schema.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Amounts are stored as positive numbers; the `type` column determines sign.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Categories: user-defined, belong to either income or expense.
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  color text not null default '#378ADD',   -- hex, used for charts + dots
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Transactions.
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  type text not null check (type in ('income','expense')),
  amount numeric(12,2) not null check (amount >= 0),  -- always positive
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on transactions (user_id, occurred_on desc);
create index if not exists categories_user_idx
  on categories (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: a user can only see and modify their own rows.
-- ---------------------------------------------------------------------------

alter table categories enable row level security;
alter table transactions enable row level security;

-- Categories
create policy "own categories - select" on categories
  for select using (auth.uid() = user_id);
create policy "own categories - insert" on categories
  for insert with check (auth.uid() = user_id);
create policy "own categories - update" on categories
  for update using (auth.uid() = user_id);
create policy "own categories - delete" on categories
  for delete using (auth.uid() = user_id);

-- Transactions
create policy "own transactions - select" on transactions
  for select using (auth.uid() = user_id);
create policy "own transactions - insert" on transactions
  for insert with check (auth.uid() = user_id);
create policy "own transactions - update" on transactions
  for update using (auth.uid() = user_id);
create policy "own transactions - delete" on transactions
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seeding note
-- ---------------------------------------------------------------------------
-- Starter categories are seeded lazily by the app on a user's first dashboard
-- load (see src/lib/seed.ts), so there is no trigger here. This keeps the
-- migration to plain schema + RLS and is easy to debug locally.
