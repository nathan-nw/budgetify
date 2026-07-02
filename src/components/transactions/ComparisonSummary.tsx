"use client";

import { Card } from "@/components/ui/Card";
import {
  formatCurrency,
  formatSavingsRate,
  formatSignedValue,
} from "@/lib/format";

export function ComparisonSummary({
  income,
  expense,
  incomeCount,
  expenseCount,
  periodLabel,
}: {
  income: number;
  expense: number;
  incomeCount: number;
  expenseCount: number;
  periodLabel: string;
}) {
  const net = income - expense;
  const gross = income + expense;
  const incomePct = gross > 0 ? (income / gross) * 100 : 0;
  const expensePct = gross > 0 ? (expense / gross) * 100 : 0;

  return (
    <Card>
      <h2 className="mb-4 text-sm text-muted">
        Summary · <span className="text-text">{periodLabel}</span>
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label={`Income · ${incomeCount}`}
          value={formatCurrency(income)}
          className="text-positive"
        />
        <Stat
          label={`Expenses · ${expenseCount}`}
          value={formatCurrency(expense)}
          className="text-negative"
        />
        <Stat
          label="Net"
          value={formatSignedValue(net)}
          className={net >= 0 ? "text-positive" : "text-negative"}
        />
        <Stat
          label="Savings rate"
          value={formatSavingsRate(income, net)}
          className={net >= 0 ? "text-positive" : "text-negative"}
        />
      </div>

      {gross > 0 && (
        <div className="mt-5">
          <div className="flex h-2 overflow-hidden rounded-full bg-page">
            <div
              className="bg-positive"
              style={{ width: `${incomePct}%` }}
            />
            <div
              className="bg-negative"
              style={{ width: `${expensePct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-muted">
            <span>{Math.round(incomePct)}% in</span>
            <span>{Math.round(expensePct)}% out</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className={`tnum mt-0.5 text-lg font-semibold sm:text-xl ${className}`}>
        {value}
      </p>
    </div>
  );
}
