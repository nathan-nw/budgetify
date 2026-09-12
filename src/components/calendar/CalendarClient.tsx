"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MonthGrid } from "./MonthGrid";
import { DetailPanel } from "./DetailPanel";
import { TransactionForm } from "@/components/TransactionForm";
import { addMonths, monthKeyOf } from "@/lib/analytics";
import {
  buildMonthGrid,
  dayDetail,
  gridRange,
  monthDetail,
  monthTotals,
  projectRecurring,
  todayISO,
} from "@/lib/calendar";
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
  formatSignedValue,
} from "@/lib/format";
import type {
  Category,
  RecurringTransaction,
  TransactionWithCategory,
} from "@/lib/types";

type FormState =
  | { editing: TransactionWithCategory; addDate?: undefined }
  | { editing?: undefined; addDate: string };

function MonthStat({
  label,
  value,
  tone,
  title,
  strong = false,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative";
  title?: string;
  strong?: boolean;
}) {
  return (
    <span className="flex items-baseline gap-1.5" title={title}>
      <span className="text-xs text-muted">{label}</span>
      <span
        className={`tnum ${strong ? "font-medium" : ""} ${
          tone === "positive" ? "text-positive" : "text-negative"
        }`}
      >
        {value}
      </span>
    </span>
  );
}

export function CalendarClient({
  categories,
  transactions,
  rules,
}: {
  categories: Category[];
  transactions: TransactionWithCategory[];
  rules: RecurringTransaction[];
}) {
  // Resolved once per mount: the grid is rendered client-side, so "today" is
  // the viewer's local day.
  const today = useMemo(() => todayISO(), []);
  const currentMonth = useMemo(() => monthKeyOf(new Date()), []);

  const [month, setMonth] = useState(currentMonth);
  // null = no day picked, so the panel shows the whole visible month.
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [form, setForm] = useState<FormState | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Clicking away from the grid and the panel drops back to the month view.
  // Suspended while the form is open so dismissing the modal doesn't also
  // change what is underneath it.
  useEffect(() => {
    if (!selectedDate || form) return;

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (gridRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setSelectedDate(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedDate(null);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedDate, form]);

  const projected = useMemo(() => {
    const { start, end } = gridRange(month);
    return projectRecurring(rules, start, end, categories, today);
  }, [rules, month, categories, today]);

  const cells = useMemo(
    () => buildMonthGrid(month, transactions, projected, today),
    [month, transactions, projected, today],
  );

  const totals = useMemo(
    () => monthTotals(transactions, projected, month, today),
    [transactions, projected, month, today],
  );

  const detail = useMemo(
    () =>
      selectedDate
        ? dayDetail(transactions, projected, selectedDate)
        : monthDetail(transactions, projected, month),
    [transactions, projected, selectedDate, month],
  );

  // Stepping to another month clears the day selection rather than guessing at
  // an equivalent day, so the panel opens on the new month as a whole.
  function step(delta: number) {
    setMonth(addMonths(month, delta));
    setSelectedDate(null);
  }

  // Re-clicking the open day closes it, back to the month view.
  function selectDay(date: string) {
    setSelectedDate((cur) => (cur === date ? null : date));
  }

  // Adding from the month view defaults to today when today is in view, and to
  // the 1st otherwise.
  const addDate =
    selectedDate ?? (month === currentMonth ? today : `${month}-01`);

  function goToday() {
    setMonth(currentMonth);
    setSelectedDate(today);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="rounded-full p-1 text-muted hover:text-text"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="w-24 text-center text-base font-medium">
            {formatMonthLabel(month)}
          </span>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="rounded-full p-1 text-muted hover:text-text"
          >
            <ChevronRight size={18} />
          </button>
          {month !== currentMonth && (
            <button
              type="button"
              onClick={goToday}
              className="ml-1 rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:text-text"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
          <MonthStat label="In" value={formatCurrency(totals.income)} tone="positive" />
          <MonthStat label="Out" value={formatCurrency(totals.expense)} tone="negative" />
          <MonthStat
            label="Daily expense"
            value={formatCurrency(totals.dailyExpense)}
            tone="negative"
            title={`Average over ${totals.dailyBasis} ${
              totals.dailyBasis === 1 ? "day" : "days"
            }`}
          />
          <MonthStat
            label="Net"
            value={formatSignedValue(totals.net)}
            tone={totals.net >= 0 ? "positive" : "negative"}
            strong
          />
        </div>
      </div>

      <div ref={gridRef}>
        <MonthGrid
          cells={cells}
          selectedDate={selectedDate}
          onSelectDay={selectDay}
        />
      </div>

      <div ref={panelRef}>
        <DetailPanel
          title={selectedDate ? formatDate(selectedDate) : formatMonthLabel(month)}
          scope={selectedDate ? "day" : "month"}
          detail={detail}
          onAdd={() => setForm({ addDate })}
          onEdit={(tx) => setForm({ editing: tx })}
          onBack={selectedDate ? () => setSelectedDate(null) : undefined}
        />
      </div>

      {/* Mounted only while open so the form derives its state from props. */}
      {form && (
        <TransactionForm
          key={form.editing?.id ?? form.addDate}
          open
          onClose={() => setForm(null)}
          categories={categories}
          editing={form.editing ?? null}
          initialDate={form.addDate}
        />
      )}
    </div>
  );
}
