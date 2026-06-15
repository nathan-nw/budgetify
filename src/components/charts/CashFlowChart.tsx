"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatMonthLabel, formatMonthShort } from "@/lib/format";
import type { MonthBucket, TimeFrame } from "@/lib/analytics";

const GREEN = "#1f9d63";
const CORAL = "#db6a4b";

type Mode = "net" | "income" | "expense";

const FRAMES: TimeFrame[] = ["6M", "12M", "YTD", "Custom"];
const MODES: { key: Mode; label: string }[] = [
  { key: "net", label: "Net" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
];

interface TooltipPayloadItem {
  payload: MonthBucket;
}

function ChartTooltip({
  active,
  payload,
  mode,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  mode: Mode;
}) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  const value = mode === "net" ? b.net : mode === "income" ? b.income : b.expense;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-0.5 text-muted">{formatMonthLabel(b.month)}</p>
      <p className="tnum font-medium">{formatCurrency(value)}</p>
    </div>
  );
}

export function CashFlowChart({
  buckets,
  frame,
  onFrameChange,
  mode,
  onModeChange,
  customStart,
  customEnd,
  onCustomChange,
}: {
  buckets: MonthBucket[];
  frame: TimeFrame;
  onFrameChange: (f: TimeFrame) => void;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (start: string, end: string) => void;
}) {
  const dataKey = mode;
  const hasData = buckets.some((b) => b.income || b.expense);

  return (
    <Card className="h-full">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-medium">Cash flow</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Time-frame pills */}
          <div className="inline-flex rounded-full border border-border p-0.5">
            {FRAMES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFrameChange(f)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  frame === f ? "bg-text text-page" : "text-muted hover:text-text"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {/* Mode toggle */}
          <div className="inline-flex rounded-full border border-border p-0.5">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => onModeChange(m.key)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  mode === m.key
                    ? "bg-text text-page"
                    : "text-muted hover:text-text"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {frame === "Custom" && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <input
            type="month"
            value={customStart}
            onChange={(e) => onCustomChange(e.target.value, customEnd)}
            className="rounded-lg border border-border bg-page px-2 py-1 text-sm outline-none"
          />
          <span className="text-muted">to</span>
          <input
            type="month"
            value={customEnd}
            onChange={(e) => onCustomChange(customStart, e.target.value)}
            className="rounded-lg border border-border bg-page px-2 py-1 text-sm outline-none"
          />
        </div>
      )}

      <div className="h-64 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={buckets}
              margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
            >
              <XAxis
                dataKey="month"
                tickFormatter={formatMonthShort}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--muted)" }}
                interval="preserveStartEnd"
              />
              <Tooltip
                cursor={{ fill: "var(--card-border)" }}
                content={<ChartTooltip mode={mode} />}
              />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={40}>
                {buckets.map((b, i) => {
                  const value =
                    mode === "net" ? b.net : mode === "income" ? b.income : b.expense;
                  const color =
                    mode === "income"
                      ? GREEN
                      : mode === "expense"
                        ? CORAL
                        : value >= 0
                          ? GREEN
                          : CORAL;
                  return <Cell key={i} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No activity in this period.
          </div>
        )}
      </div>
    </Card>
  );
}
