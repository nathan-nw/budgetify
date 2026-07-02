"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DashboardTimeframe, TransactionsTimeframe } from "@/lib/types";

export interface PreferencesInput {
  dashboard_timeframe: DashboardTimeframe;
  transactions_summary_timeframe: TransactionsTimeframe;
}

const DASH = new Set<DashboardTimeframe>([
  "month",
  "last6",
  "last12",
  "ytd",
  "all",
]);
const TX = new Set<TransactionsTimeframe>(["month", "year", "all"]);

export async function updatePreferences(
  input: PreferencesInput,
): Promise<{ error?: string }> {
  if (!DASH.has(input.dashboard_timeframe) || !TX.has(input.transactions_summary_timeframe))
    return { error: "Invalid timeframe." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("preferences").upsert(
    {
      user_id: user.id,
      dashboard_timeframe: input.dashboard_timeframe,
      transactions_summary_timeframe: input.transactions_summary_timeframe,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/settings");
  return {};
}
