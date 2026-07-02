"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { updatePreferences } from "@/app/actions/preferences";
import type { DashboardTimeframe, TransactionsTimeframe } from "@/lib/types";

const DASH_OPTIONS: { value: DashboardTimeframe; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "last6", label: "Last 6 months" },
  { value: "last12", label: "Last 12 months" },
  { value: "ytd", label: "Year to date" },
  { value: "all", label: "All time" },
];

const TX_OPTIONS: { value: TransactionsTimeframe; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

const selectClass =
  "w-full rounded-xl border border-border bg-page px-3 py-2.5 text-sm outline-none focus:border-text/30";

export function PreferencesForm({
  initial,
}: {
  initial: {
    dashboard_timeframe: DashboardTimeframe;
    transactions_summary_timeframe: TransactionsTimeframe;
  };
}) {
  const [dash, setDash] = useState<DashboardTimeframe>(
    initial.dashboard_timeframe,
  );
  const [tx, setTx] = useState<TransactionsTimeframe>(
    initial.transactions_summary_timeframe,
  );
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await updatePreferences({
        dashboard_timeframe: dash,
        transactions_summary_timeframe: tx,
      });
      setMsg(
        res.error
          ? { ok: false, text: res.error }
          : { ok: true, text: "Preferences saved." },
      );
    });
  }

  return (
    <Card>
      <h2 className="mb-1 text-base font-medium">Preferences</h2>
      <p className="mb-5 text-sm text-muted">
        Choose the timeframe each summary is calculated over.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-muted">
            Dashboard summary timeframe
          </label>
          <select
            value={dash}
            onChange={(e) => setDash(e.target.value as DashboardTimeframe)}
            className={selectClass}
          >
            {DASH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">
            Transactions summary timeframe
          </label>
          <select
            value={tx}
            onChange={(e) => setTx(e.target.value as TransactionsTimeframe)}
            className={selectClass}
          >
            {TX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-text px-4 py-2.5 text-sm font-medium text-page transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
          {msg && (
            <span
              className={`text-sm ${msg.ok ? "text-positive" : "text-negative"}`}
            >
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
