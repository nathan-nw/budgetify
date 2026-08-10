# Plan: Transactions page (`/transactions`)

## Context

Today the only place to see transactions is the dashboard's "Recent transactions"
card, which shows just the latest ~10. There's no way to browse the full history
or analyze it. This page gives a complete, analytical view of every transaction.

The headline layout (per the reference screenshot the user shared) is a **side-by-side
comparison: Expenses on the left, Income on the right**, each as an independent,
grouped, filterable column. The two columns are the comparison — so we do **not**
need a global income/expense type toggle (the split replaces it).

Reference look: two columns, each with its own grouping pills + filter/sort/search
icons, transactions under collapsible period headers that show a subtotal
(e.g. `Feb 8–14 2026  $283.49`), and a category chip on each row.

## Goal

A `/transactions` page where the user can:
- See **all** expenses and all income, side by side.
- Group each column by **week / month / year**, with a **subtotal per group**.
- Filter (category, date range), **search** notes, and **sort** (date/amount) — per column.
- Read **at-a-glance comparison stats** and a few **insights** for the current filters.
- Add / edit / delete transactions (reusing the existing modal).

## Page layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Transactions                                              [ + Add ]   │
│                                                                        │
│  ┌── Comparison summary (reacts to filters) ───────────────────────┐  │
│  │  Income $7,300   Expenses $3,049   Net +$4,251   Savings 58%     │  │
│  │  [■■■■■■■■ income  ▏▏▏ expense]  ← tiny in/out comparison bar     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─ Expenses ──────────────┐   ┌─ Income ───────────────┐             │
│  │ [Week][Month][Year] ⚲↕🔍 │   │ [Week][Month][Year] ⚲↕🔍 │             │
│  │ ▼ Feb 8–14 2026  $283.49 │   │ ▼ Feb 2026   $7,300.00  │             │
│  │   Doctor Visit   $150 …  │   │   Icon Pack   ·Digital· $800 │        │
│  │   Restaurant     $85  …  │   │   Salary      ·Salary·  $4,500 │      │
│  │ ▼ Jan 18–24 2026 $290.49 │   │ ▼ Jan 2026   $6,800.00  │             │
│  │   …                      │   │   …                     │             │
│  │ [ Load more ]            │   │ [ Load more ]           │             │
│  └──────────────────────────┘   └─────────────────────────┘            │
│                                                                        │
│  Insights:  Largest expense $150 · Avg/day $18 · Top: Groceries        │
└──────────────────────────────────────────────────────────────────────┘
```

- **Mobile:** the two columns stack vertically (Expenses, then Income). Each
  column's controls collapse to the icon cluster. Comparison summary stays on top.

## Features (mapped to the chosen scope)

1. **Two-column split by type** — Expenses (coral accents) | Income (green accents).
   Each column is fully independent (its own grouping, filter, sort, search, paging).
2. **Group by period + subtotals** — per-column pills: **Week / Month / Year**.
   - Week = **Sunday–Saturday calendar weeks**, label `Feb 8–14 2026`. (Note: this is
     different from the dashboard's 1M "day-range" weeks — see `buildWeeklyBuckets`.)
   - Month label `Feb 2026`, Year label `2026`.
   - Each group header shows the **sum of its rows**; groups are **collapsible**.
3. **Filtered comparison summary** (top bar) — income total, expense total, net,
   savings rate, and counts, recomputed for the **active filters of both columns**.
   Includes a small income-vs-expense proportion bar — the quick visual comparison.
4. **Spending insights** (footer strip) — for the current filter: largest expense,
   average spend/day, busiest expense category; and top income source.
5. **Per-column controls** (icon cluster, matching the reference):
   - **Filter (funnel):** category multi-select + "include archived" toggle; date-range
     presets (This month / Last month / 3M / YTD / All) + custom range.
   - **Sort (↕):** by date or amount, ascending/descending.
   - **Search (🔍):** text match on note / category name.
6. **Load more** — render in chunks (50 rows/column); a "Load more" button extends
   the visible window. Client-side (all transactions are already fetched).
7. **Row interactions** — each row shows a category **color chip** (reusing category
   colors), description/note, amount, and date. Click a row → existing edit modal.
   An **Add** button at the top opens the add modal.

## Files

New:
- `src/app/transactions/page.tsx` — server component. Fetch all transactions
  (`*, category:categories(...)`) + categories; render `TransactionsClient`.
- `src/components/transactions/TransactionsClient.tsx` — client orchestrator: holds
  per-column filter/sort/search/group/paging state + the add/edit modal; renders the
  comparison summary, both columns, and insights.
- `src/components/transactions/TransactionColumn.tsx` — one column: controls + grouped,
  collapsible list + Load more. Used for both expense and income.
- `src/components/transactions/ColumnControls.tsx` — grouping pills + funnel/sort/search
  popovers.
- `src/components/transactions/ComparisonSummary.tsx` — top stats + in/out bar.
- `src/components/transactions/Insights.tsx` — footer insight callouts.

Changes:
- `src/components/Header.tsx` / `NavLink` — add a **Transactions** nav link
  (Dashboard · Transactions · Categories).
- `src/lib/analytics.ts` — add grouping + filtering helpers (below).
- `src/lib/format.ts` — add `formatWeekRange(start,end)` ("Feb 8–14 2026") and
  `formatYear`; reuse `formatCurrency`, `formatDate`, `formatMonthLabel`.

## Reuse (don't rebuild)

- **Add/edit/delete:** `TransactionForm` modal + the `transactions.ts` server actions —
  already do everything; just wire the page's Add/row-click to them and `router.refresh()`.
- **Money + dates:** `src/lib/format.ts` helpers.
- **Category colors:** each transaction already carries `category.color/name` (works for
  archived categories too) — use it for the row chip.
- **Card / layout primitives** and the dashboard's filtered-totals pattern
  (`totalsForMonths` → generalize to `totalsOf(transactions)`).

## New analytics helpers (`src/lib/analytics.ts`, pure + testable)

- `type GroupBy = "week" | "month" | "year"`.
- `groupKeyOf(isoDate, groupBy)` → stable sort key (`2026-W06` / `2026-02` / `2026`).
- `weekRangeOf(isoDate)` → `{ start, end }` Sunday–Saturday for the week label.
- `groupTransactions(txs, groupBy)` → ordered `[{ key, label, subtotal, items }]`.
- `totalsOf(txs)` → `{ income, expense, net, count }` for the comparison summary.
- `applyFilters(txs, { categoryIds, includeArchived, from, to, query })` and
  `sortTransactions(txs, field, dir)`.

## Data approach

Single-user, modest volume → **fetch everything server-side once**, filter/group/sort
**client-side** (mirrors the dashboard). Revisit with server-side pagination only if a
user ever has tens of thousands of rows (left friendly to it, not built now).

## Mobile

- Columns stack; comparison summary and insights are full-width.
- Controls collapse into the funnel/sort/search icon cluster (popovers), grouping pills
  scroll horizontally if needed. Tap targets ≥ 36px. Reuse the responsive patterns already
  applied (`flex-wrap`, `min-w-0`, bottom-sheet modal).

## Build sequence

1. Nav link + route + server data fetch (`page.tsx`) rendering a stub client.
2. Analytics helpers (group/filter/sort/totals) — small and unit-checkable.
3. `TransactionColumn` with grouping + subtotals + Load more (static controls first).
4. `ColumnControls` (grouping pills → filter → sort → search), wired per column.
5. `ComparisonSummary` + in/out bar.
6. `Insights` strip.
7. Wire Add / row-click to the existing modal; `router.refresh()` after mutations.
8. Mobile pass + empty/loading states ("No expenses match these filters").
9. `npm run lint` + `npm run build`; verify against acceptance below.

## Acceptance criteria

1. `/transactions` lists every expense (left) and every income (right), grouped with
   correct per-group subtotals.
2. Switching a column's grouping (Week/Month/Year) re-buckets only that column.
3. Filtering / searching / sorting a column updates its list, its subtotals, and the
   comparison summary; the other column is unaffected unless it shares the filter.
4. Load more reveals additional rows without a full reload.
5. Clicking a row edits it; Add creates one; both reflect immediately.
6. Comparison summary's income/expense/net match the sum of the visible (filtered) data.
7. Looks clean in light + dark and stacks cleanly on mobile.

## Out of scope (note for later)

- CSV export/import (export would be a small, natural follow-up here).
- Server-side pagination / virtualization.
- Saved filter presets, bulk edit/delete, multi-currency.

## Open question for build time

- **Insights placement:** one combined footer strip (as drawn) vs. a small insight line
  under each column. Default: combined footer; easy to split later.
