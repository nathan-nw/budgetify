import { advance } from "./recurring";
import type {
  Category,
  ProjectedOccurrence,
  RecurringTransaction,
  TransactionWithCategory,
} from "./types";

/** One square in the month grid. */
export interface DayCell {
  date: string; // 'YYYY-MM-DD'
  day: number;
  inMonth: boolean; // false for leading/trailing padding days
  isToday: boolean;
  income: number; // real transactions only
  expense: number;
  projectedNet: number; // scheduled-but-not-yet-real money
  net: number; // (income − expense) + projectedNet
  count: number; // real + projected items
  hasProjected: boolean;
}

/** What the detail panel shows, for either a single day or a whole month. */
export interface PeriodDetail {
  transactions: TransactionWithCategory[];
  projected: ProjectedOccurrence[];
  income: number;
  expense: number;
  net: number;
}

// Local-time date math on 'YYYY-MM-DD' strings. Never `new Date(iso)` — that
// parses as UTC and shifts the day west of Greenwich.
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

function addDays(iso: string, delta: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

/** Today as 'YYYY-MM-DD' in the viewer's local time. */
export function todayISO(): string {
  return toISO(new Date());
}

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/**
 * How many cells the grid holds for a month: Sunday-aligned, padded out to
 * whole weeks. Dynamic (5 or 6 rows) rather than a fixed 42 so a short month
 * doesn't render a dead trailing week.
 */
function gridShape(month: string): { start: string; cells: number } {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const leading = first.getDay(); // 0 = Sunday
  const total = Math.ceil((leading + daysInMonth(month)) / 7) * 7;
  return { start: addDays(toISO(first), -leading), cells: total };
}

/** Inclusive 'YYYY-MM-DD' bounds of the rendered grid, padding days included. */
export function gridRange(month: string): { start: string; end: string } {
  const { start, cells } = gridShape(month);
  return { start, end: addDays(start, cells - 1) };
}

// A daily rule over a multi-year window is the worst case; this is a safety
// valve against a malformed rule spinning forever, not a real limit.
const MAX_STEPS = 2000;

/**
 * Future occurrences of active recurring rules that fall inside
 * [fromISO, toISO]. Occurrences on or before `today` are skipped — those are
 * already real rows (see `materializeDueRecurring`), so nothing double-counts
 * even if materialization failed and `next_due` is stale.
 */
export function projectRecurring(
  rules: RecurringTransaction[],
  fromISO: string,
  toISO: string,
  categories: Category[],
  today: string,
): ProjectedOccurrence[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const out: ProjectedOccurrence[] = [];

  for (const rule of rules) {
    if (!rule.is_active) continue;
    const cat = rule.category_id ? byId.get(rule.category_id) : undefined;
    const category = cat
      ? { id: cat.id, name: cat.name, color: cat.color, type: cat.type }
      : null;

    let cur = rule.next_due;
    for (let step = 0; step < MAX_STEPS; step++) {
      if (cur > toISO) break;
      if (rule.end_date && cur > rule.end_date) break;
      if (cur >= fromISO && cur > today) {
        out.push({
          recurring_id: rule.id,
          category,
          type: rule.type,
          amount: rule.amount,
          note: rule.note,
          occurred_on: cur,
          frequency: rule.frequency,
        });
      }
      cur = advance(cur, rule.frequency);
    }
  }

  return out;
}

/**
 * The month's grid cells with per-day totals. Amounts are stored positive, so
 * the sign comes from `type` — same derivation as every aggregator in
 * `analytics.ts`.
 */
export function buildMonthGrid(
  month: string,
  transactions: TransactionWithCategory[],
  projected: ProjectedOccurrence[],
  today: string,
): DayCell[] {
  const { start, cells } = gridShape(month);
  const end = addDays(start, cells - 1);

  const real = new Map<string, { income: number; expense: number; count: number }>();
  for (const tx of transactions) {
    if (tx.occurred_on < start || tx.occurred_on > end) continue;
    const bucket = real.get(tx.occurred_on) ?? { income: 0, expense: 0, count: 0 };
    if (tx.type === "income") bucket.income += tx.amount;
    else bucket.expense += tx.amount;
    bucket.count += 1;
    real.set(tx.occurred_on, bucket);
  }

  const ghost = new Map<string, { net: number; count: number }>();
  for (const p of projected) {
    if (p.occurred_on < start || p.occurred_on > end) continue;
    const bucket = ghost.get(p.occurred_on) ?? { net: 0, count: 0 };
    bucket.net += p.type === "income" ? p.amount : -p.amount;
    bucket.count += 1;
    ghost.set(p.occurred_on, bucket);
  }

  const out: DayCell[] = [];
  for (let i = 0; i < cells; i++) {
    const date = addDays(start, i);
    const r = real.get(date);
    const g = ghost.get(date);
    const income = r?.income ?? 0;
    const expense = r?.expense ?? 0;
    const projectedNet = g?.net ?? 0;
    out.push({
      date,
      day: Number(date.slice(8)),
      inMonth: date.slice(0, 7) === month,
      isToday: date === today,
      income,
      expense,
      projectedNet,
      net: income - expense + projectedNet,
      count: (r?.count ?? 0) + (g?.count ?? 0),
      hasProjected: !!g,
    });
  }
  return out;
}

function detailOf(
  transactions: TransactionWithCategory[],
  projected: ProjectedOccurrence[],
  match: (occurredOn: string) => boolean,
): PeriodDetail {
  const txs = transactions.filter((t) => match(t.occurred_on));
  const ghosts = projected.filter((p) => match(p.occurred_on));

  let income = 0;
  let expense = 0;
  for (const item of [...txs, ...ghosts]) {
    if (item.type === "income") income += item.amount;
    else expense += item.amount;
  }

  return { transactions: txs, projected: ghosts, income, expense, net: income - expense };
}

/** Everything happening on one day. */
export function dayDetail(
  transactions: TransactionWithCategory[],
  projected: ProjectedOccurrence[],
  date: string,
): PeriodDetail {
  return detailOf(transactions, projected, (d) => d === date);
}

/**
 * Everything in one month — what the panel falls back to when no single day is
 * selected. Transactions arrive newest-first from the server and keep that
 * order; scheduled occurrences are sorted oldest-first, since they read as an
 * upcoming queue.
 */
export function monthDetail(
  transactions: TransactionWithCategory[],
  projected: ProjectedOccurrence[],
  month: string,
): PeriodDetail {
  const detail = detailOf(
    transactions,
    projected,
    (d) => d.slice(0, 7) === month,
  );
  detail.projected.sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
  return detail;
}

export interface MonthTotals {
  income: number;
  expense: number;
  net: number;
  /** Average expense per day over `dailyBasis` days. */
  dailyExpense: number;
  dailyBasis: number;
}

/**
 * In / out / net for one month, scheduled occurrences included so the header
 * agrees with the figures shown in the cells.
 *
 * `dailyExpense` averages over the days the month has actually had: the whole
 * month for a past or future month, but only the elapsed days of the current
 * month — and for the current month it also leaves out occurrences still to
 * come, so a rent payment due on the 30th doesn't inflate the average on the
 * 5th.
 */
export function monthTotals(
  transactions: TransactionWithCategory[],
  projected: ProjectedOccurrence[],
  month: string,
  today: string,
): MonthTotals {
  const currentMonth = today.slice(0, 7);
  const isCurrent = month === currentMonth;

  let income = 0;
  let expense = 0;
  let elapsedExpense = 0;

  for (const item of [...transactions, ...projected]) {
    if (item.occurred_on.slice(0, 7) !== month) continue;
    if (item.type === "income") {
      income += item.amount;
    } else {
      expense += item.amount;
      if (item.occurred_on <= today) elapsedExpense += item.amount;
    }
  }

  const dailyBasis = isCurrent ? Number(today.slice(8)) : daysInMonth(month);
  const basisExpense = isCurrent ? elapsedExpense : expense;

  return {
    income,
    expense,
    net: income - expense,
    dailyExpense: dailyBasis > 0 ? basisExpense / dailyBasis : 0,
    dailyBasis,
  };
}
