"use client";

import Link from "next/link";
import { ChevronLeft, Plus, Repeat } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import {
  formatCurrency,
  formatDate,
  formatSigned,
  formatSignedValue,
} from "@/lib/format";
import type { PeriodDetail } from "@/lib/calendar";
import type { TransactionWithCategory } from "@/lib/types";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`tnum text-sm font-medium ${
          tone === "positive"
            ? "text-positive"
            : tone === "negative"
              ? "text-negative"
              : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * The list under the grid. Shows one day when a day is selected, otherwise the
 * whole visible month. In month scope each row keeps its date; in day scope the
 * date is redundant with the heading, so rows show the category alone.
 */
export function DetailPanel({
  title,
  scope,
  detail,
  onAdd,
  onEdit,
  onBack,
}: {
  title: string;
  scope: "day" | "month";
  detail: PeriodDetail;
  onAdd: () => void;
  onEdit: (tx: TransactionWithCategory) => void;
  /** Returns to the month view; absent in month scope. */
  onBack?: () => void;
}) {
  const empty =
    detail.transactions.length === 0 && detail.projected.length === 0;

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to the whole month"
              className="-ml-1 rounded-full p-1 text-muted transition-colors hover:text-text"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <h2 className="truncate text-base font-medium">{title}</h2>
          <span className="shrink-0 text-sm text-muted">
            {detail.transactions.length + detail.projected.length || ""}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-text px-3 py-1.5 text-sm font-medium text-page transition-opacity hover:opacity-90"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {!empty && (
        <div className="mb-4 flex items-center gap-8 border-b border-border pb-4">
          <Stat label="In" value={formatCurrency(detail.income)} tone="positive" />
          <Stat label="Out" value={formatCurrency(detail.expense)} tone="negative" />
          <Stat
            label="Net"
            value={formatSignedValue(detail.net)}
            tone={detail.net >= 0 ? "positive" : "negative"}
          />
        </div>
      )}

      {empty ? (
        <p className="py-10 text-center text-sm text-muted">
          {scope === "day" ? "Nothing on this day." : "Nothing this month."}
        </p>
      ) : (
        <>
          {detail.transactions.length > 0 && (
            <ul className="divide-y divide-border">
              {detail.transactions.map((tx) => (
                <li key={tx.id}>
                  <TransactionRow
                    tx={tx}
                    onClick={() => onEdit(tx)}
                    subtitle={
                      scope === "day"
                        ? (tx.category?.name ?? "Uncategorized")
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          {detail.projected.length > 0 && (
            <div className={detail.transactions.length > 0 ? "mt-5" : ""}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Scheduled
                </p>
                <Link
                  href="/recurring"
                  className="text-xs text-muted underline underline-offset-2 hover:text-text"
                >
                  Manage series
                </Link>
              </div>
              {/* Projections have no row in `transactions` yet, so they are
                  shown muted and are not editable. */}
              <ul className="divide-y divide-border">
                {detail.projected.map((p, i) => (
                  <li
                    key={`${p.recurring_id}-${p.occurred_on}-${i}`}
                    className="flex items-center justify-between gap-3 py-3 opacity-60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: p.category?.color ?? "#9A9A9A" }}
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm">
                          {p.note || p.category?.name || "Transaction"}
                          <Repeat size={12} className="shrink-0 text-muted" />
                        </p>
                        <p className="truncate text-xs text-muted">
                          {scope === "day"
                            ? (p.category?.name ?? "Uncategorized")
                            : (p.category?.name ?? "Uncategorized") +
                              " · " +
                              formatDate(p.occurred_on)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`tnum shrink-0 text-sm font-medium ${
                        p.type === "income" ? "text-positive" : "text-negative"
                      }`}
                    >
                      {formatSigned(p.amount, p.type)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
