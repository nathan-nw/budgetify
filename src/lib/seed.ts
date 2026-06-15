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
  await supabase.from("categories").insert(rows);
}
