"use client";

import { Card } from "@/components/ui/Card";
import { formatCompactSigned, WEEKDAY_NAMES } from "@/lib/format";
import type { DayCell } from "@/lib/calendar";

export function MonthGrid({
  cells,
  selectedDate,
  onSelectDay,
}: {
  cells: DayCell[];
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
}) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEKDAY_NAMES.map((name) => (
          <div
            key={name}
            className="pb-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted"
          >
            <span className="sm:hidden">{name.slice(0, 1)}</span>
            <span className="hidden sm:inline">{name}</span>
          </div>
        ))}

        {cells.map((cell) => {
          if (!cell.inMonth) {
            // Padding days from the neighbouring months: shown for grid shape
            // only, not selectable.
            return (
              <div
                key={cell.date}
                aria-hidden
                className="min-h-14 rounded-lg p-1.5 text-xs text-muted/30 sm:min-h-20 sm:p-2"
              >
                {cell.day}
              </div>
            );
          }

          const selected = cell.date === selectedDate;
          const hasActivity = cell.count > 0;

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDay(cell.date)}
              aria-pressed={selected}
              className={`flex min-h-14 flex-col justify-between rounded-lg border p-1.5 text-left transition-colors sm:min-h-20 sm:p-2 ${
                selected
                  ? "border-text bg-card"
                  : "border-transparent hover:border-border hover:bg-page"
              } ${cell.hasProjected ? "border-dashed" : ""}`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs sm:h-6 sm:w-6 sm:text-sm ${
                  cell.isToday
                    ? "bg-text font-medium text-page"
                    : hasActivity
                      ? "text-text"
                      : "text-muted"
                }`}
              >
                {cell.day}
              </span>

              {hasActivity && (
                <span
                  className={`tnum truncate text-[11px] font-medium sm:text-xs ${
                    cell.net >= 0 ? "text-positive" : "text-negative"
                  } ${cell.hasProjected ? "opacity-60" : ""}`}
                >
                  {formatCompactSigned(cell.net)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
