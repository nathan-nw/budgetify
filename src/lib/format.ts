import type { TxType } from "./types";

const cad = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

/** "$1,290.00" — always 2 decimals, rounded. */
export function formatCurrency(amount: number): string {
  return cad.format(amount);
}

/** Signed by transaction type: income "+$x", expense "−$x". */
export function formatSigned(amount: number, type: TxType): string {
  const sign = type === "income" ? "+" : "−";
  return `${sign}${cad.format(amount)}`;
}

/** Signed by value: positive "+$x", negative "−$x". Used for net totals. */
export function formatSignedValue(value: number): string {
  const sign = value < 0 ? "−" : "+";
  return `${sign}${cad.format(Math.abs(value))}`;
}

/** Savings rate as a whole-number percent, or "—" when income is 0. */
export function formatSavingsRate(income: number, net: number): string {
  if (income <= 0) return "—";
  return `${Math.round((net / income) * 100)}%`;
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "Jun 3, 2026" from a 'YYYY-MM-DD' date string (no timezone drift). */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${monthNames[m - 1]} ${d}, ${y}`;
}

/** "Jun 2026" from a 'YYYY-MM' month key. */
export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${monthNames[m - 1]} ${y}`;
}

/** Short "Jun" label for chart axes / stepper from a 'YYYY-MM' key. */
export function formatMonthShort(monthKey: string): string {
  const [, m] = monthKey.split("-").map(Number);
  return monthNames[m - 1];
}

/** "Jun 1" from a 'YYYY-MM' key and a day-of-month. */
export function formatMonthDay(monthKey: string, day: number): string {
  const [, m] = monthKey.split("-").map(Number);
  return `${monthNames[m - 1]} ${day}`;
}

/**
 * Calendar-week label from two 'YYYY-MM-DD' endpoints. Collapses the shared
 * parts: "Feb 8–14 2026", cross-month "Feb 26 – Mar 4 2026", cross-year
 * "Dec 28 2025 – Jan 3 2026".
 */
export function formatWeekRange(startISO: string, endISO: string): string {
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const [ey, em, ed] = endISO.split("-").map(Number);
  const sMon = monthNames[sm - 1];
  const eMon = monthNames[em - 1];
  if (sy === ey && sm === em) return `${sMon} ${sd}–${ed} ${sy}`;
  if (sy === ey) return `${sMon} ${sd} – ${eMon} ${ed} ${sy}`;
  return `${sMon} ${sd} ${sy} – ${eMon} ${ed} ${ey}`;
}
