import { createClient } from "@/lib/supabase/server";
import { ensureSeedCategories } from "@/lib/seed";
import { Header } from "@/components/Header";
import { DashboardClient } from "@/components/DashboardClient";
import type { Category, TransactionWithCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware guards this route, but guard again for type-safety.
  if (!user) return null;

  // Seed starter categories on first load if the user has none.
  await ensureSeedCategories(supabase, user.id);

  const [{ data: categoriesData }, { data: txData }] = await Promise.all([
    supabase.from("categories").select("*").order("name", { ascending: true }),
    supabase
      .from("transactions")
      .select("*, category:categories(id, name, color, type)")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const categories = (categoriesData ?? []) as Category[];
  const transactions = (txData ?? []) as unknown as TransactionWithCategory[];

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <DashboardClient categories={categories} transactions={transactions} />
      </main>
    </div>
  );
}
