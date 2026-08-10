# Build spec: personal budgeting web app

Paste this whole file into Claude Code as the project brief. Build it in the order under **Build sequence** at the bottom — get auth + schema working before any charts.

---

## 1. Goal

A single-user (per-account) personal budgeting web app. The signed-in user logs income and expense transactions, organizes them into categories they can create/edit/archive at will, and views their money on a dashboard with: summary cards, a cash-flow bar chart with selectable time frames and an income/expense/net toggle, a category-breakdown donut for a chosen month, and a recent-transactions list with fast entry.

Build a clean, working MVP. Prioritize correctness of the data model and auth over feature breadth.

---

## 2. Tech stack

- **Next.js** (App Router) + **TypeScript**
- **Supabase** — Postgres database, Auth, and Row Level Security
- **@supabase/ssr** for auth in the App Router (server + client clients; do NOT use the deprecated auth-helpers package)
- **Tailwind CSS** for styling
- **Recharts** for the bar chart and donut chart
- **lucide-react** for icons
- Deploy target: Vercel (frontend) + Supabase (backend). Don't deploy — just make it run locally with `npm run dev`.

Put Supabase keys in `.env.local` and include a `.env.example`. Never commit real keys.

---

## 3. Design direction — Wealthsimple-style

Calm, minimal, confident. Money apps reward restraint.

- **Background:** warm off-white / cream page background (e.g. `#F6F5F1`), not pure white. Cards sit on it as near-white (`#FFFFFF` or `#FCFBF8`) surfaces.
- **Text:** near-black charcoal (`#1A1A1A`) for primary, muted gray for secondary labels. High contrast, no pure-black-on-pure-white harshness.
- **Numbers are the hero.** Balances and totals are large (24–32px), tabular, medium weight. Labels above them are small (13px) and muted.
- **Spacing:** generous. Airy padding inside cards (20–24px), comfortable gaps between sections. Let it breathe.
- **Cards:** rounded corners (`rounded-2xl`), hairline borders (`border border-black/5`) or a very subtle shadow — pick one, not both. No heavy shadows, no gradients.
- **Color is reserved for meaning:** green for income/positive net, a warm red/coral for expenses/negative. Category colors appear ONLY in the charts and the small dot next to each transaction/category — and the same category always uses the same color everywhere.
- **Typography:** a clean geometric sans (Inter is fine via `next/font`). Sentence case everywhere, never ALL CAPS.
- **Dark mode:** support it from the start via Tailwind `dark:` classes and a toggle. Dark surfaces should be a soft charcoal (`#1A1A1A` page, slightly lighter cards), not pure black.

Match this dashboard layout (top to bottom):
1. A row of 4 summary metric cards: Income, Expenses, Net, Savings rate.
2. A two-column row: left (wider) = cash-flow bar chart with time-frame pills and an income/expense/net toggle; right = category donut with a month stepper (`< Jun >`) and a color-coded legend with amounts.
3. A full-width "Recent transactions" card with an "Add" button and a list (colored dot, description, category · date, signed amount).

---

## 4. Data model (Supabase / Postgres)

Run this as the initial migration. Amounts are stored as positive `numeric`; the `type` column determines sign in all calculations.

```sql
-- Categories: user-defined, belong to either income or expense.
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  color text not null default '#378ADD',   -- hex, used for charts + dots
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Transactions.
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  type text not null check (type in ('income','expense')),
  amount numeric(12,2) not null check (amount >= 0),  -- always positive
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on transactions (user_id, occurred_on desc);
create index categories_user_idx on categories (user_id);
```

**Important model rules:**
- **Soft delete for categories.** Deleting a category in the UI sets `is_archived = true`, it does NOT remove the row. Archived categories disappear from the add-transaction dropdown but still render in historical charts (their transactions keep their color/name). Provide an "Archived" section in category management with a restore option. `on delete set null` on `category_id` is a safety net only.
- A category's `type` is fixed to income or expense; the add-transaction form filters category options by the selected type.
- Never trust the client for `user_id` — set it server-side / via RLS default, see below.

### Row Level Security

Enable RLS on both tables and add policies so a user can only read/write their own rows. Example for `transactions` (mirror for `categories`):

```sql
alter table transactions enable row level security;

create policy "own transactions - select" on transactions
  for select using (auth.uid() = user_id);
create policy "own transactions - insert" on transactions
  for insert with check (auth.uid() = user_id);
create policy "own transactions - update" on transactions
  for update using (auth.uid() = user_id);
create policy "own transactions - delete" on transactions
  for delete using (auth.uid() = user_id);
```

### Seed default categories on first sign-in

When a user has zero categories, seed a starter set (so the app isn't empty):
- Income: Salary, Freelance, Other income
- Expense: Rent, Groceries, Dining, Transport, Utilities, Entertainment, Other

Assign each a distinct hex color from a fixed palette. Do this either via a Postgres trigger on new `auth.users`, or lazily on first dashboard load if the user has no categories — pick whichever is simpler and document the choice.

---

## 5. Auth

- Supabase email + password auth. *(Assumption — swap to magic-link if preferred; it's a small change.)*
- Pages: `/login` (sign in + sign up), and protected app routes that redirect to `/login` when there's no session.
- Use middleware (`@supabase/ssr`) to refresh the session and guard routes.
- A sign-out button in the app header.

---

## 6. Features & pages (MVP scope)

### `/` — Dashboard (the main screen)
- **Summary cards** for the selected period: total Income, total Expenses, Net (income − expenses), Savings rate (`net / income`, shown as %, guard divide-by-zero → show "—" when income is 0). Net and savings rate are green when positive, red when negative.
- **Cash-flow bar chart** (Recharts `BarChart`):
  - X-axis = monthly buckets. Time-frame pills control the range: **6M**, **12M**, **YTD**, and **Custom** (date range). *(Assumption: monthly bars for all ranges — keeps it simple. Note this is the one place to revisit if you want weekly granularity later.)*
  - A 3-way toggle: **Net** (single bar per month, green if ≥0 / red if <0), **Income** (green bars), **Expense** (coral bars). Default = Net.
- **Category donut** (Recharts `PieChart` with inner radius):
  - Shows expense breakdown by category for a single selected month, with a `< Jun >` month stepper.
  - Center of donut shows the month's total expense.
  - Legend below lists each category with its color dot, name, and dollar amount, sorted descending.
  - Clicking a slice or legend row filters the recent-transactions list to that category for that month (nice-to-have; skip if it complicates things).
- **Recent transactions card**: list of latest ~10, each row = colored category dot, description/note, "Category · date", and signed amount (green +, red −). An **Add** button opens the add form.

### Add / edit transaction (modal or slide-over)
- Fields: type toggle (income/expense), amount, category (dropdown filtered by type, excludes archived), date (defaults to today), optional note.
- Fast: amount field auto-focused, Enter submits. This is the most-used action — keep friction near zero.
- Edit and delete existing transactions.

### `/categories` — Category management
- List active categories grouped by type, each with a color swatch.
- Add a category (name, type, color picker from a fixed palette).
- Edit name/color. Archive (soft delete) with confirm. Separate "Archived" section with restore.

### Global
- App header with the app name, dark-mode toggle, and sign-out.
- Loading and empty states (e.g. "No transactions yet — add your first one").
- All currency formatted with `Intl.NumberFormat` (CAD, `$1,290.00`). Round everything displayed.

---

## 7. Out of scope for MVP (build only if asked — list as "v2 ideas")

Do NOT build these now; just leave the data model friendly to them:
- Budget targets per category with progress bars (amber/red as you approach the cap).
- Recurring transactions (auto-generate rent/salary each month).
- CSV import from a bank export.
- Multi-currency.

---

## 8. Acceptance criteria

The MVP is done when:
1. A new user can sign up, gets seeded starter categories, and lands on an empty-state dashboard.
2. They can add an income and an expense transaction in a few seconds each, and both immediately appear in the recent list and update the summary cards.
3. They can create a brand-new custom category, then assign a transaction to it.
4. Archiving a category removes it from the add dropdown but its past transactions still show correctly in the donut and list.
5. The cash-flow chart respects the 6M/12M/YTD/Custom pills and the Net/Income/Expense toggle.
6. The donut updates when stepping months and its center total matches that month's expense sum.
7. RLS is on: a second user's data is never visible to the first. (Verify by querying as each user.)
8. Light and dark mode both look clean and Wealthsimple-calm.
9. `npm run dev` runs with only `.env.local` configured; `.env.example` documents the required vars.

---

## 9. Build sequence (do in this order)

1. Scaffold Next.js (App Router, TS, Tailwind). Add Recharts, lucide-react, `@supabase/ssr`.
2. Set up Supabase clients (server + browser) and `.env` files. Add the SQL migration (tables + indexes + RLS + seed approach).
3. Auth: `/login`, middleware route protection, sign-out.
4. Category management page (CRUD + archive). This must exist before transactions so there's something to assign.
5. Add/edit transaction form + recent transactions list.
6. Summary cards.
7. Cash-flow bar chart (pills + toggle).
8. Category donut (month stepper + legend).
9. Dark mode, empty/loading states, currency formatting, polish to match the design direction.

Ask me before adding any dependency not listed above. Keep components small and typed. Use server components for data fetching where it makes sense and client components for the interactive charts/forms. ask questions if you have any
