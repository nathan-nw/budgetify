import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";
import type { Category, TransactionWithCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware guards this route, but guard again for type-safety.
  if (!user) return null;

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
        <TransactionsClient
          categories={categories}
          transactions={transactions}
        />
      </main>
    </div>
  );
}
