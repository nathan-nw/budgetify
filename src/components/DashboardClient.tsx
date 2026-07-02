"use client";

import { useMemo, useState } from "react";
import { SummaryCards } from "@/components/SummaryCards";
import {
  CashFlowChart,
  type CashFlowMode,
} from "@/components/charts/CashFlowChart";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { RecentTransactions } from "@/components/RecentTransactions";
import { TransactionForm } from "@/components/TransactionForm";
import type { CashFlowDatum } from "@/components/charts/CashFlowChart";
import {
  addMonths,
  buildBuckets,
  buildWeeklyBuckets,
  donutForMonth,
  monthKey,
  monthKeyOf,
  monthsForFrame,
  totalsForTimeframe,
  type TimeFrame,
} from "@/lib/analytics";
import {
  formatMonthDay,
  formatMonthLabel,
  formatMonthShort,
} from "@/lib/format";
import type {
  Category,
  DashboardTimeframe,
  TransactionWithCategory,
} from "@/lib/types";

export function DashboardClient({
  categories,
  transactions,
  summaryTimeframe,
}: {
  categories: Category[];
  transactions: TransactionWithCategory[];
  summaryTimeframe: DashboardTimeframe;
}) {
  const now = useMemo(() => new Date(), []);
  const currentMonth = monthKeyOf(now);

  const [frame, setFrame] = useState<TimeFrame>("12M");
  const [mode, setMode] = useState<CashFlowMode>("net");
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
  // Cash-flow chart data: weekly buckets for the current month in "1M",
  // monthly buckets otherwise. Normalized to a single shape for the chart.
  const cashFlowData = useMemo<CashFlowDatum[]>(() => {
    if (frame === "1M") {
      return buildWeeklyBuckets(transactions, currentMonth).map((w) => ({
        key: `${currentMonth}-w${w.startDay}`,
        label: `${w.startDay}–${w.endDay}`,
        tooltipLabel: `${formatMonthDay(currentMonth, w.startDay)} – ${w.endDay}`,
        income: w.income,
        expense: w.expense,
        net: w.net,
      }));
    }
    return buildBuckets(transactions, months).map((b) => ({
      key: b.month,
      label: formatMonthShort(b.month),
      tooltipLabel: formatMonthLabel(b.month),
      income: b.income,
      expense: b.expense,
      net: b.net,
    }));
  }, [frame, transactions, months, currentMonth]);

  // Summary cards follow the saved preference timeframe, independent of the
  // cash-flow chart's frame pills.
  const totals = useMemo(
    () => totalsForTimeframe(transactions, summaryTimeframe, now),
    [transactions, summaryTimeframe, now],
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
            data={cashFlowData}
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
