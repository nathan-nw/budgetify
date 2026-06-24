"use client";

import { Plus, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatDate, formatSigned } from "@/lib/format";
import type { TransactionWithCategory } from "@/lib/types";

export function RecentTransactions({
  transactions,
  onAdd,
  onEdit,
  filterLabel,
  onClearFilter,
}: {
  transactions: TransactionWithCategory[];
  onAdd: () => void;
  onEdit: (tx: TransactionWithCategory) => void;
  filterLabel?: string | null;
  onClearFilter?: () => void;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="text-base font-medium">Recent transactions</h2>
          {filterLabel && (
            <button
              type="button"
              onClick={onClearFilter}
              className="flex min-w-0 items-center gap-1 rounded-full bg-page px-2.5 py-1 text-xs text-muted hover:text-text"
            >
              <span className="truncate">{filterLabel}</span>
              <X size={12} className="shrink-0" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-text px-3 py-1.5 text-sm font-medium text-page transition-opacity hover:opacity-90"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {transactions.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          No transactions yet — add your first one.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {transactions.map((tx) => (
            <li key={tx.id}>
              <button
                type="button"
                onClick={() => onEdit(tx)}
                className="flex w-full items-center justify-between gap-3 py-3 text-left"
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
                <span
                  className={`tnum shrink-0 text-sm font-medium ${
                    tx.type === "income" ? "text-positive" : "text-negative"
                  }`}
                >
                  {formatSigned(tx.amount, tx.type)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
