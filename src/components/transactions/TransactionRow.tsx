"use client";

import { Repeat } from "lucide-react";
import { formatDate, formatSigned } from "@/lib/format";
import type { TransactionWithCategory } from "@/lib/types";

/**
 * A single transaction line, signed by its own `type`. Shared by the dashboard's
 * recent list and the calendar day panel. (TransactionColumn signs rows by its
 * column accent instead, so it renders its own markup.)
 */
export function TransactionRow({
  tx,
  onClick,
  subtitle,
}: {
  tx: TransactionWithCategory;
  onClick: () => void;
  /** Overrides the default "Category · date" line — e.g. to drop the date. */
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 py-3 text-left"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: tx.category?.color ?? "#9A9A9A" }}
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm">
            {tx.note || tx.category?.name || "Transaction"}
            {tx.recurring_id && (
              <Repeat size={12} className="shrink-0 text-muted" aria-label="Recurring" />
            )}
          </p>
          <p className="truncate text-xs text-muted">
            {subtitle ??
              (tx.category?.name ?? "Uncategorized") +
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
  );
}
