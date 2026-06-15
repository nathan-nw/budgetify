"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import type { DonutSlice } from "@/lib/analytics";

export function CategoryDonut({
  month,
  slices,
  total,
  onPrev,
  onNext,
  canGoNext,
  selectedCategoryId,
  onSelectCategory,
}: {
  month: string;
  slices: DonutSlice[];
  total: number;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}) {
  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-medium">Spending by category</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous month"
            className="rounded-full p-1 text-muted hover:text-text"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="w-20 text-center text-sm font-medium">
            {formatMonthLabel(month)}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            aria-label="Next month"
            className="rounded-full p-1 text-muted hover:text-text disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {slices.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted">
          No expenses this month.
        </div>
      ) : (
        <>
          <div className="relative mx-auto h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="none"
                  onClick={(_, index) =>
                    onSelectCategory(slices[index].categoryId)
                  }
                >
                  {slices.map((s) => (
                    <Cell
                      key={s.categoryId}
                      fill={s.color}
                      opacity={
                        selectedCategoryId && selectedCategoryId !== s.categoryId
                          ? 0.3
                          : 1
                      }
                      className="cursor-pointer outline-none"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[13px] text-muted">Total</span>
              <span className="tnum text-xl font-medium">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <ul className="mt-5 space-y-1.5">
            {slices.map((s) => {
              const active = selectedCategoryId === s.categoryId;
              return (
                <li key={s.categoryId}>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectCategory(active ? null : s.categoryId)
                    }
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm transition-colors ${
                      active ? "bg-page" : "hover:bg-page"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="tnum shrink-0 text-muted">
                      {formatCurrency(s.amount)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
