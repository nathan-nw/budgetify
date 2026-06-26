"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import type { TransactionWithCategory } from "@/lib/types";

function topCategory(
  txs: TransactionWithCategory[],
): { name: string; amount: number } | null {
  const sums = new Map<string, { name: string; amount: number }>();
  for (const tx of txs) {
    const name = tx.category?.name ?? "Uncategorized";
    const entry = sums.get(name) ?? { name, amount: 0 };
    entry.amount += tx.amount;
    sums.set(name, entry);
  }
  let best: { name: string; amount: number } | null = null;
  for (const e of sums.values()) if (!best || e.amount > best.amount) best = e;
  return best;
}

/** Inclusive day-span between the earliest and latest transaction dates. */
function spanDays(txs: TransactionWithCategory[]): number {
  if (txs.length === 0) return 0;
  let min = txs[0].occurred_on;
  let max = txs[0].occurred_on;
  for (const tx of txs) {
    if (tx.occurred_on < min) min = tx.occurred_on;
    if (tx.occurred_on > max) max = tx.occurred_on;
  }
  const [ay, am, ad] = min.split("-").map(Number);
  const [by, bm, bd] = max.split("-").map(Number);
  const ms = new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function Insights({
  expenses,
  incomes,
}: {
  expenses: TransactionWithCategory[];
  incomes: TransactionWithCategory[];
}) {
  const items = useMemo(() => {
    const out: { label: string; value: string }[] = [];

    if (expenses.length) {
      const largest = expenses.reduce((m, t) => Math.max(m, t.amount), 0);
      const total = expenses.reduce((s, t) => s + t.amount, 0);
      const days = spanDays(expenses) || 1;
      out.push({ label: "Largest expense", value: formatCurrency(largest) });
      out.push({ label: "Avg spend/day", value: formatCurrency(total / days) });
      const top = topCategory(expenses);
      if (top) out.push({ label: "Top spending", value: top.name });
    }
    if (incomes.length) {
      const top = topCategory(incomes);
      if (top) out.push({ label: "Top income", value: top.name });
    }
    return out;
  }, [expenses, incomes]);

  if (items.length === 0) return null;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="text-sm font-medium">Insights</span>
        {items.map((it) => (
          <span key={it.label} className="text-sm">
            <span className="text-muted">{it.label}: </span>
            <span className="font-medium">{it.value}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}
