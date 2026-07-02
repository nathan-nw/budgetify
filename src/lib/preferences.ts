import type { SupabaseClient } from "@supabase/supabase-js";
import type { Preferences } from "./types";

// Defaults used when a user has no `preferences` row yet (they're created lazily
// on first save). Keep in sync with the column defaults in
// supabase/migration-preferences.sql.
export const DEFAULT_PREFERENCES: Pick<
  Preferences,
  "dashboard_timeframe" | "transactions_summary_timeframe"
> = {
  dashboard_timeframe: "month",
  transactions_summary_timeframe: "month",
};

/**
 * Read a user's preferences, falling back to defaults when no row exists. Does
 * not insert — the row is created on first save (upsert in the server action).
 */
export async function getPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<typeof DEFAULT_PREFERENCES> {
  const { data } = await supabase
    .from("preferences")
    .select("dashboard_timeframe, transactions_summary_timeframe")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return DEFAULT_PREFERENCES;
  return {
    dashboard_timeframe: data.dashboard_timeframe,
    transactions_summary_timeframe: data.transactions_summary_timeframe,
  };
}
