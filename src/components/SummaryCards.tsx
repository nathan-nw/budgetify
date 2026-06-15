import { Card } from "@/components/ui/Card";
import {
  formatCurrency,
  formatSavingsRate,
  formatSignedValue,
} from "@/lib/format";
import type { Totals } from "@/lib/analytics";

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const color =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : "text-text";
  return (
    <Card>
      <p className="text-[13px] text-muted">{label}</p>
      <p className={`tnum mt-2 text-2xl font-medium sm:text-3xl ${color}`}>
        {value}
      </p>
    </Card>
  );
}

export function SummaryCards({ totals }: { totals: Totals }) {
  const netTone = totals.net >= 0 ? "positive" : "negative";
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Metric label="Income" value={formatCurrency(totals.income)} />
      <Metric label="Expenses" value={formatCurrency(totals.expense)} />
      <Metric
        label="Net"
        value={formatSignedValue(totals.net)}
        tone={netTone}
      />
      <Metric
        label="Savings rate"
        value={formatSavingsRate(totals.income, totals.net)}
        tone={totals.income <= 0 ? "neutral" : netTone}
      />
    </div>
  );
}
