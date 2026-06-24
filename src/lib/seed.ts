import type { SupabaseClient } from "@supabase/supabase-js";
import { STARTER_CATEGORIES } from "./colors";

// Lazily seed starter categories the first time a user has none.
// Called on dashboard load (documented choice: lazy seed over a DB trigger,
// because it is simpler to set up and debug locally).
export async function ensureSeedCategories(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { count, error } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error || (count ?? 0) > 0) return;

  const rows = STARTER_CATEGORIES.map((c) => ({ ...c, user_id: userId }));
  // Upsert (ignore duplicates) rather than insert so two concurrent first-load
  // renders can't both seed the starter set — the unique index on
  // (user_id, name, type) makes the second call a no-op. Requires the index
  // from supabase/migration.sql.
  await supabase
    .from("categories")
    .upsert(rows, { onConflict: "user_id,name,type", ignoreDuplicates: true });
}
