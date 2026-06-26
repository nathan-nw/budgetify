"use client";

import { useMemo, useState } from "react";
import { TransactionColumn } from "@/components/transactions/TransactionColumn";
import { ComparisonSummary } from "@/components/transactions/ComparisonSummary";
import { Insights } from "@/components/transactions/Insights";
import { TransactionForm } from "@/components/TransactionForm";
import {
  applyFilters,
  sortTransactions,
  totalsOf,
  type ColumnState,
} from "@/lib/analytics";
import type { Category, TransactionWithCategory } from "@/lib/types";

function defaultColumnState(): ColumnState {
  return {
    groupBy: "month",
    sortField: "date",
    sortDir: "desc",
    filter: {
      categoryIds: [],
      includeArchived: true,
      from: null,
      to: null,
      query: "",
    },
  };
}

export function TransactionsClient({
  categories,
  transactions,
}: {
  categories: Category[];
  transactions: TransactionWithCategory[];
}) {
  const expenseTxs = useMemo(
    () => transactions.filter((t) => t.type === "expense"),
    [transactions],
  );
  const incomeTxs = useMemo(
    () => transactions.filter((t) => t.type === "income"),
    [transactions],
  );
  const archivedIds = useMemo(
    () =>
      new Set(categories.filter((c) => c.is_archived).map((c) => c.id)),
    [categories],
  );
  const expenseCats = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );
  const incomeCats = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories],
  );

  const [expenseState, setExpenseState] = useState<ColumnState>(
    defaultColumnState,
  );
  const [incomeState, setIncomeState] = useState<ColumnState>(
    defaultColumnState,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);

  const expenseView = useMemo(
    () =>
      sortTransactions(
        applyFilters(expenseTxs, expenseState.filter, archivedIds),
        expenseState.sortField,
        expenseState.sortDir,
      ),
    [expenseTxs, expenseState, archivedIds],
  );
  const incomeView = useMemo(
    () =>
      sortTransactions(
        applyFilters(incomeTxs, incomeState.filter, archivedIds),
        incomeState.sortField,
        incomeState.sortDir,
      ),
    [incomeTxs, incomeState, archivedIds],
  );

  const expenseTotals = useMemo(() => totalsOf(expenseView), [expenseView]);
  const incomeTotals = useMemo(() => totalsOf(incomeView), [incomeView]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(tx: TransactionWithCategory) {
    setEditing(tx);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
        <button
          type="button"
          onClick={openAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-text px-3 py-1.5 text-sm font-medium text-page transition-opacity hover:opacity-90"
        >
          + Add
        </button>
      </div>

      <ComparisonSummary
        income={incomeTotals.income}
        expense={expenseTotals.expense}
        incomeCount={incomeTotals.count}
        expenseCount={expenseTotals.count}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionColumn
          title="Expenses"
          accent="expense"
          transactions={expenseView}
          categories={expenseCats}
          state={expenseState}
          onStateChange={setExpenseState}
          onRowClick={openEdit}
        />
        <TransactionColumn
          title="Income"
          accent="income"
          transactions={incomeView}
          categories={incomeCats}
          state={incomeState}
          onStateChange={setIncomeState}
          onRowClick={openEdit}
        />
      </div>

      <Insights expenses={expenseView} incomes={incomeView} />

      {formOpen && (
        <TransactionForm
          key={editing?.id ?? "new"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          categories={categories}
          editing={editing}
        />
      )}
    </div>
  );
}
