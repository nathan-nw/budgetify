import { formatMonthLabel, formatWeekRange } from "./format";
import type {
  DashboardTimeframe,
  TransactionsTimeframe,
  TransactionWithCategory,
} from "./types";

export type TimeFrame = "1M" | "6M" | "12M" | "YTD" | "Custom";

export interface MonthBucket {
  month: string; // 'YYYY-MM'
  income: number;
  expense: number;
  net: number;
}

export interface WeekBucket {
  startDay: number; // day-of-month the week starts on (1, 8, 15, ...)
  endDay: number; // day-of-month the week ends on (clipped to the month)
  income: number;
  expense: number;
  net: number;
}

export interface Totals {
  income: number;
  expense: number;
  net: number;
}

export interface DonutSlice {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
}

/** 'YYYY-MM' key for a 'YYYY-MM-DD' date string. */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** 'YYYY-MM' for a Date (local time). */
export function monthKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Step a 'YYYY-MM' key by `delta` months. */
export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyOf(d);
}

/** Inclusive list of 'YYYY-MM' keys from `start` to `end`. */
export function monthRange(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  // Guard against an inverted range.
  if (start > end) return [end];
  while (cur <= end) {
    out.push(cur);
    cur = addMonths(cur, 1);
  }
  return out;
}

/**
 * The set of month keys covered by a time frame, relative to `now`.
 * For "Custom", pass customStart/customEnd as 'YYYY-MM' keys.
 */
export function monthsForFrame(
  frame: TimeFrame,
  now: Date = new Date(),
  customStart?: string,
  customEnd?: string,
): string[] {
  const current = monthKeyOf(now);
  switch (frame) {
    case "1M":
      // Summary totals span the current month; the chart shows it by week.
      return [current];
    case "6M":
      return monthRange(addMonths(current, -5), current);
    case "12M":
      return monthRange(addMonths(current, -11), current);
    case "YTD":
      return monthRange(`${now.getFullYear()}-01`, current);
    case "Custom": {
      const start = customStart ?? addMonths(current, -5);
      const end = customEnd ?? current;
      return monthRange(start <= end ? start : end, start <= end ? end : start);
    }
  }
}

/**
 * Weekly income/expense/net buckets within a single month, split into 7-day
 * ranges from the 1st (1–7, 8–14, 15–21, 22–28, 29–end). The last bucket is
 * short in months with fewer than 35 days.
 */
export function buildWeeklyBuckets(
  transactions: TransactionWithCategory[],
  month: string,
): WeekBucket[] {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  const weeks: WeekBucket[] = [];
  for (let start = 1; start <= daysInMonth; start += 7) {
    weeks.push({
      startDay: start,
      endDay: Math.min(start + 6, daysInMonth),
      income: 0,
      expense: 0,
      net: 0,
    });
  }

  for (const tx of transactions) {
    if (monthKey(tx.occurred_on) !== month) continue;
    const day = Number(tx.occurred_on.slice(8, 10));
    const week = weeks[Math.floor((day - 1) / 7)];
    if (!week) continue;
    if (tx.type === "income") week.income += tx.amount;
    else week.expense += tx.amount;
  }
  for (const w of weeks) w.net = w.income - w.expense;
  return weeks;
}

/** Monthly income/expense/net buckets for the given month keys, in order. */
export function buildBuckets(
  transactions: TransactionWithCategory[],
  months: string[],
): MonthBucket[] {
  const map = new Map<string, MonthBucket>(
    months.map((m) => [m, { month: m, income: 0, expense: 0, net: 0 }]),
  );
  for (const tx of transactions) {
    const bucket = map.get(monthKey(tx.occurred_on));
    if (!bucket) continue;
    if (tx.type === "income") bucket.income += tx.amount;
    else bucket.expense += tx.amount;
  }
  for (const b of map.values()) b.net = b.income - b.expense;
  return months.map((m) => map.get(m)!);
}

export interface TimeframeTotals extends Totals {
  incomeCount: number;
  expenseCount: number;
}

/**
 * Totals (with income/expense counts) for a saved preference timeframe. Shared by
 * the dashboard summary cards and the transactions summary; values overlap where
 * the two preference sets coincide ('month'/'all'), and 'year' === 'ytd'.
 */
export function totalsForTimeframe(
  transactions: TransactionWithCategory[],
  timeframe: DashboardTimeframe | TransactionsTimeframe,
  now: Date = new Date(),
): TimeframeTotals {
  let monthSet: Set<string> | null = null;
  if (timeframe !== "all") {
    const current = monthKeyOf(now);
    let months: string[];
    switch (timeframe) {
      case "last6":
        months = monthRange(addMonths(current, -5), current);
        break;
      case "last12":
        months = monthRange(addMonths(current, -11), current);
        break;
      case "year":
      case "ytd":
        months = monthRange(`${now.getFullYear()}-01`, current);
        break;
      default: // "month"
        months = [current];
    }
    monthSet = new Set(months);
  }

  let income = 0;
  let expense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  for (const tx of transactions) {
    if (monthSet && !monthSet.has(monthKey(tx.occurred_on))) continue;
    if (tx.type === "income") {
      income += tx.amount;
      incomeCount += 1;
    } else {
      expense += tx.amount;
      expenseCount += 1;
    }
  }
  return { income, expense, net: income - expense, incomeCount, expenseCount };
}

/** Income/expense/net totals across transactions whose month is in `months`. */
export function totalsForMonths(
  transactions: TransactionWithCategory[],
  months: string[],
): Totals {
  const set = new Set(months);
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (!set.has(monthKey(tx.occurred_on))) continue;
    if (tx.type === "income") income += tx.amount;
    else expense += tx.amount;
  }
  return { income, expense, net: income - expense };
}

/**
 * Expense breakdown for a single month, grouped by category, sorted
 * descending by amount. Uses each transaction's stored category color/name so
 * archived categories still render correctly.
 */
export function donutForMonth(
  transactions: TransactionWithCategory[],
  month: string,
): { slices: DonutSlice[]; total: number } {
  const groups = new Map<string, DonutSlice>();
  let total = 0;
  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    if (monthKey(tx.occurred_on) !== month) continue;
    total += tx.amount;
    const id = tx.category?.id ?? "uncategorized";
    const existing = groups.get(id);
    if (existing) {
      existing.amount += tx.amount;
    } else {
      groups.set(id, {
        categoryId: id,
        name: tx.category?.name ?? "Uncategorized",
        color: tx.category?.color ?? "#9A9A9A",
        amount: tx.amount,
      });
    }
  }
  const slices = [...groups.values()].sort((a, b) => b.amount - a.amount);
  return { slices, total };
}

// ---------------------------------------------------------------------------
// Transactions page: grouping, filtering, sorting, totals (pure + testable).
// ---------------------------------------------------------------------------

export type GroupBy = "week" | "month" | "year";
export type SortField = "date" | "amount";
export type SortDir = "asc" | "desc";

export interface FilterState {
  categoryIds: string[]; // empty = all categories
  includeArchived: boolean; // show transactions whose category is archived
  from: string | null; // 'YYYY-MM-DD' inclusive lower bound
  to: string | null; // 'YYYY-MM-DD' inclusive upper bound
  query: string; // free-text match on note / category name
}

/** Per-column view state for the transactions page (grouping + sort + filter). */
export interface ColumnState {
  groupBy: GroupBy;
  sortField: SortField;
  sortDir: SortDir;
  filter: FilterState;
}

export interface TxGroup {
  key: string; // stable sort key ('2026-02-08' week-start / '2026-02' / '2026')
  label: string; // human label ('Feb 8–14 2026', 'Feb 2026', '2026')
  subtotal: number; // sum of the group's amounts
  items: TransactionWithCategory[];
}

export interface ColumnTotals extends Totals {
  count: number;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Sunday–Saturday calendar week containing `isoDate`, as ISO endpoints. */
export function weekRangeOf(isoDate: string): { start: string; end: string } {
  const d = parseISO(isoDate);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay()); // back up to Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toISO(start), end: toISO(end) };
}

/** Stable, lexically-sortable group key for a date under the given grouping. */
export function groupKeyOf(isoDate: string, groupBy: GroupBy): string {
  if (groupBy === "year") return isoDate.slice(0, 4);
  if (groupBy === "month") return isoDate.slice(0, 7);
  return weekRangeOf(isoDate).start; // week → its Sunday
}

function groupLabel(key: string, groupBy: GroupBy): string {
  if (groupBy === "year") return key;
  if (groupBy === "month") return formatMonthLabel(key);
  const { start, end } = weekRangeOf(key); // key is already the Sunday
  return formatWeekRange(start, end);
}

/**
 * Bucket transactions into ordered groups (most recent first) with a subtotal.
 * Items within a group keep their incoming order, so sort before grouping.
 */
export function groupTransactions(
  txs: TransactionWithCategory[],
  groupBy: GroupBy,
): TxGroup[] {
  const map = new Map<string, TxGroup>();
  for (const tx of txs) {
    const key = groupKeyOf(tx.occurred_on, groupBy);
    let group = map.get(key);
    if (!group) {
      group = { key, label: groupLabel(key, groupBy), subtotal: 0, items: [] };
      map.set(key, group);
    }
    group.items.push(tx);
    group.subtotal += tx.amount;
  }
  return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

/** Income/expense/net/count totals for an already-filtered list. */
export function totalsOf(txs: TransactionWithCategory[]): ColumnTotals {
  let income = 0;
  let expense = 0;
  for (const tx of txs) {
    if (tx.type === "income") income += tx.amount;
    else expense += tx.amount;
  }
  return { income, expense, net: income - expense, count: txs.length };
}

/**
 * Filter by category, archived-category visibility, date range, and free text.
 * `archivedCategoryIds` is supplied by the caller since the joined category on
 * a transaction doesn't carry `is_archived`.
 */
export function applyFilters(
  txs: TransactionWithCategory[],
  f: FilterState,
  archivedCategoryIds?: Set<string>,
): TransactionWithCategory[] {
  const q = f.query.trim().toLowerCase();
  const catSet = f.categoryIds.length ? new Set(f.categoryIds) : null;
  return txs.filter((tx) => {
    const catId = tx.category?.id ?? "uncategorized";
    if (catSet && !catSet.has(catId)) return false;
    if (!f.includeArchived && archivedCategoryIds?.has(catId)) return false;
    if (f.from && tx.occurred_on < f.from) return false;
    if (f.to && tx.occurred_on > f.to) return false;
    if (q) {
      const hay = `${tx.note ?? ""} ${tx.category?.name ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Sort a copy by date or amount, with a created_at tiebreak. */
export function sortTransactions(
  txs: TransactionWithCategory[],
  field: SortField,
  dir: SortDir,
): TransactionWithCategory[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...txs].sort((a, b) => {
    let cmp =
      field === "amount"
        ? a.amount - b.amount
        : a.occurred_on < b.occurred_on
          ? -1
          : a.occurred_on > b.occurred_on
            ? 1
            : 0;
    if (cmp === 0)
      cmp =
        a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
    return sign * cmp;
  });
}
