"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ColumnControls } from "@/components/transactions/ColumnControls";
import { groupTransactions, type ColumnState } from "@/lib/analytics";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Category, TransactionWithCategory } from "@/lib/types";

const PAGE = 50;

export function TransactionColumn({
  title,
  accent,
  transactions,
  categories,
  state,
  onStateChange,
  onRowClick,
}: {
  title: string;
  accent: "expense" | "income";
  transactions: TransactionWithCategory[];
  categories: Category[];
  state: ColumnState;
  onStateChange: (s: ColumnState) => void;
  onRowClick: (tx: TransactionWithCategory) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(PAGE);

  const groups = useMemo(
    () => groupTransactions(transactions, state.groupBy),
    [transactions, state.groupBy],
  );

  const accentText = accent === "income" ? "text-positive" : "text-negative";
  const sign = accent === "income" ? "+" : "−";
  const total = transactions.reduce((s, t) => s + t.amount, 0);

  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Total items that paging can reveal (collapsed groups don't count).
  const pageable = groups.reduce(
    (sum, g) => (collapsed.has(g.key) ? sum : sum + g.items.length),
    0,
  );
  const hasMore = visible < pageable;

  // Walk groups in order, spending the visible budget on non-collapsed rows.
  let budget = visible;
  const rendered: React.ReactNode[] = [];
  for (const g of groups) {
    const isCollapsed = collapsed.has(g.key);
    if (!isCollapsed && budget <= 0) continue; // hidden by paging
    rendered.push(
      <div key={`h-${g.key}`}>
        <button
          type="button"
          onClick={() => toggleGroup(g.key)}
          className="flex w-full items-center justify-between gap-2 py-2 text-left"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {isCollapsed ? (
              <ChevronRight size={15} className="shrink-0 text-muted" />
            ) : (
              <ChevronDown size={15} className="shrink-0 text-muted" />
            )}
            <span className="truncate text-sm font-medium">{g.label}</span>
          </span>
          <span className={`tnum shrink-0 text-sm font-medium ${accentText}`}>
            {sign}
            {formatCurrency(g.subtotal)}
          </span>
        </button>
      </div>,
    );

    if (isCollapsed) continue;
    const slice = g.items.slice(0, budget);
    budget -= slice.length;
    rendered.push(
      <ul key={`l-${g.key}`} className="mb-2 divide-y divide-border">
        {slice.map((tx) => (
          <li key={tx.id}>
            <button
              type="button"
              onClick={() => onRowClick(tx)}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tx.category?.color ?? "#9A9A9A" }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {tx.note || tx.category?.name || "Transaction"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {(tx.category?.name ?? "Uncategorized") +
                      " · " +
                      formatDate(tx.occurred_on)}
                  </p>
                </div>
              </div>
              <span className={`tnum shrink-0 text-sm font-medium ${accentText}`}>
                {sign}
                {formatCurrency(tx.amount)}
              </span>
            </button>
          </li>
        ))}
      </ul>,
    );
  }

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-medium">{title}</h2>
            <span className="text-xs text-muted">
              {transactions.length}{" "}
              {transactions.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <span className={`tnum text-base font-semibold ${accentText}`}>
            {sign}
            {formatCurrency(total)}
          </span>
        </div>
        <ColumnControls
          state={state}
          onStateChange={onStateChange}
          categories={categories}
        />
      </div>

      {transactions.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          No {title.toLowerCase()} match these filters.
        </p>
      ) : (
        <div>{rendered}</div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE)}
          className="mt-2 w-full rounded-xl border border-border py-2 text-sm text-muted transition-colors hover:text-text"
        >
          Load more
        </button>
      )}
    </Card>
  );
}
