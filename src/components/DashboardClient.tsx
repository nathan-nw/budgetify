"use client";

import { useMemo, useState } from "react";
import { SummaryCards } from "@/components/SummaryCards";
import { CashFlowChart } from "@/components/charts/CashFlowChart";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { RecentTransactions } from "@/components/RecentTransactions";
import { TransactionForm } from "@/components/TransactionForm";
import {
  addMonths,
  buildBuckets,
  donutForMonth,
  monthKey,
  monthKeyOf,
  monthsForFrame,
  totalsForMonths,
  type TimeFrame,
} from "@/lib/analytics";
import { formatMonthLabel } from "@/lib/format";
import type { Category, TransactionWithCategory } from "@/lib/types";

type Mode = "net" | "income" | "expense";

export function DashboardClient({
  categories,
  transactions,
}: {
  categories: Category[];
  transactions: TransactionWithCategory[];
}) {
  const now = useMemo(() => new Date(), []);
  const currentMonth = monthKeyOf(now);

  const [frame, setFrame] = useState<TimeFrame>("12M");
  const [mode, setMode] = useState<Mode>("net");
  const [customStart, setCustomStart] = useState(addMonths(currentMonth, -5));
  const [customEnd, setCustomEnd] = useState(currentMonth);

  const [donutMonth, setDonutMonth] = useState(currentMonth);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);

  const months = useMemo(
    () => monthsForFrame(frame, now, customStart, customEnd),
    [frame, now, customStart, customEnd],
  );
  const buckets = useMemo(
    () => buildBuckets(transactions, months),
    [transactions, months],
  );
  const totals = useMemo(
    () => totalsForMonths(transactions, months),
    [transactions, months],
  );
  const donut = useMemo(
    () => donutForMonth(transactions, donutMonth),
    [transactions, donutMonth],
  );

  // Recent list: filtered to a category+month when a donut slice is selected,
  // otherwise the latest 10 transactions overall.
  const { recent, filterLabel } = useMemo(() => {
    if (selectedCategoryId) {
      const filtered = transactions.filter(
        (t) =>
          (t.category?.id ?? "uncategorized") === selectedCategoryId &&
          monthKey(t.occurred_on) === donutMonth,
      );
      const name =
        donut.slices.find((s) => s.categoryId === selectedCategoryId)?.name ??
        "Category";
      return {
        recent: filtered,
        filterLabel: `${name} · ${formatMonthLabel(donutMonth)}`,
      };
    }
    return { recent: transactions.slice(0, 10), filterLabel: null };
  }, [transactions, selectedCategoryId, donutMonth, donut.slices]);

  function stepMonth(delta: number) {
    setSelectedCategoryId(null);
    setDonutMonth((m) => addMonths(m, delta));
  }

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
      <SummaryCards totals={totals} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashFlowChart
            buckets={buckets}
            frame={frame}
            onFrameChange={setFrame}
            mode={mode}
            onModeChange={setMode}
            customStart={customStart}
            customEnd={customEnd}
            onCustomChange={(s, e) => {
              setCustomStart(s);
              setCustomEnd(e);
            }}
          />
        </div>
        <div>
          <CategoryDonut
            month={donutMonth}
            slices={donut.slices}
            total={donut.total}
            onPrev={() => stepMonth(-1)}
            onNext={() => stepMonth(1)}
            canGoNext={donutMonth < currentMonth}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>
      </div>

      <RecentTransactions
        transactions={recent}
        onAdd={openAdd}
        onEdit={openEdit}
        filterLabel={filterLabel}
        onClearFilter={() => setSelectedCategoryId(null)}
      />

      {/* Mount only while open and key by target so state derives fresh from
          `editing` each time — no reset effect needed inside the form. */}
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
