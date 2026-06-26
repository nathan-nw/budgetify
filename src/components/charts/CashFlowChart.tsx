"use client";

import {
  Bar,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import type { TimeFrame } from "@/lib/analytics";

const GREEN = "#1f9d63";
const CORAL = "#db6a4b";

export type CashFlowMode = "net" | "income" | "expense" | "all";

// A single bar's worth of data — works for both monthly and weekly buckets.
export interface CashFlowDatum {
  key: string; // unique x-axis value (e.g. '2026-06' or '2026-06-w1')
  label: string; // short axis tick ('Jun', '1', '8' …)
  tooltipLabel: string; // tooltip header ('June 2026', 'Jun 1 – 7' …)
  income: number;
  expense: number;
  net: number;
}

const FRAMES: TimeFrame[] = ["1M", "6M", "12M", "YTD", "Custom"];
const MODES: { key: CashFlowMode; label: string }[] = [
  { key: "net", label: "Net" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
  { key: "all", label: "All" },
];

interface TooltipPayloadItem {
  payload: CashFlowDatum;
}

function ChartTooltip({
  active,
  payload,
  mode,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  mode: CashFlowMode;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 text-muted">{d.tooltipLabel}</p>
      {mode === "all" ? (
        <div className="space-y-0.5">
          <div className="flex justify-between gap-4">
            <span className="text-muted">Income</span>
            <span className="tnum font-medium text-positive">
              {formatCurrency(d.income)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted">Expense</span>
            <span className="tnum font-medium text-negative">
              {formatCurrency(d.expense)}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-0.5">
            <span className="text-muted">Net</span>
            <span className="tnum font-medium">{formatCurrency(d.net)}</span>
          </div>
        </div>
      ) : (
        <p className="tnum font-medium">
          {formatCurrency(
            mode === "net" ? d.net : mode === "income" ? d.income : d.expense,
          )}
        </p>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted">{label}</span>
    </span>
  );
}

export function CashFlowChart({
  data,
  frame,
  onFrameChange,
  mode,
  onModeChange,
  customStart,
  customEnd,
  onCustomChange,
}: {
  data: CashFlowDatum[];
  frame: TimeFrame;
  onFrameChange: (f: TimeFrame) => void;
  mode: CashFlowMode;
  onModeChange: (m: CashFlowMode) => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (start: string, end: string) => void;
}) {
  const hasData = data.some((d) => d.income || d.expense);
  const isAll = mode === "all";
  // Tick labels keyed by the unique x value, so two "Jun"s across years don't
  // collapse into one bar.
  const labelByKey = new Map(data.map((d) => [d.key, d.label]));

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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

      {frame === "1M" && (
        <p className="mb-3 text-xs text-muted">By week, this month</p>
      )}

      <div className="min-h-64 w-full flex-1">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
            >
              <XAxis
                dataKey="key"
                tickFormatter={(k) => labelByKey.get(k) ?? ""}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--muted)" }}
                interval="preserveStartEnd"
              />
              <Tooltip
                cursor={{ fill: "var(--card-border)" }}
                content={<ChartTooltip mode={mode} />}
              />

              {isAll ? (
                <>
                  {/* Income vs expense side by side, with net as a line. */}
                  <Bar
                    dataKey="income"
                    fill={GREEN}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={18}
                  />
                  <Bar
                    dataKey="expense"
                    fill={CORAL}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={18}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="var(--text)"
                    strokeWidth={2}
                    dot={{ r: 2, fill: "var(--text)" }}
                    activeDot={{ r: 4 }}
                  />
                </>
              ) : (
                <Bar dataKey={mode} radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {data.map((d, i) => {
                    const value =
                      mode === "net"
                        ? d.net
                        : mode === "income"
                          ? d.income
                          : d.expense;
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
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No activity in this period.
          </div>
        )}
      </div>

      {isAll && hasData && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
          <LegendDot color={GREEN} label="Income" />
          <LegendDot color={CORAL} label="Expense" />
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-text" />
            <span className="text-muted">Net</span>
          </span>
        </div>
      )}
    </Card>
  );
}
