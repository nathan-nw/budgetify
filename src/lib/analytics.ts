import type { TransactionWithCategory } from "./types";

export type TimeFrame = "6M" | "12M" | "YTD" | "Custom";

export interface MonthBucket {
  month: string; // 'YYYY-MM'
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
