"use client";

import { PreferencesForm } from "@/components/settings/PreferencesForm";
import { AccountForm } from "@/components/settings/AccountForm";
import type { DashboardTimeframe, TransactionsTimeframe } from "@/lib/types";

export function SettingsClient({
  email,
  preferences,
}: {
  email: string;
  preferences: {
    dashboard_timeframe: DashboardTimeframe;
    transactions_summary_timeframe: TransactionsTimeframe;
  };
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <PreferencesForm initial={preferences} />
      <AccountForm email={email} />
    </div>
  );
}
