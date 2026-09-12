import { createClient } from "@/lib/supabase/server";
import { materializeDueRecurring } from "@/lib/recurring";
import { Header } from "@/components/Header";
import { CalendarClient } from "@/components/calendar/CalendarClient";
import type {
  Category,
  RecurringTransaction,
  TransactionWithCategory,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware guards this route, but guard again for type-safety.
  if (!user) return null;

  // Idempotent catch-up: without it, landing here directly (rather than via the
  // dashboard) would show due occurrences as still-scheduled ghosts.
  await materializeDueRecurring(supabase, user.id);

  const [{ data: categoriesData }, { data: txData }, { data: rulesData }] =
    await Promise.all([
      supabase.from("categories").select("*").order("name", { ascending: true }),
      supabase
        .from("transactions")
        .select("*, category:categories(id, name, color, type)")
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("recurring_transactions")
        .select("*")
        .eq("is_active", true),
    ]);

  const categories = (categoriesData ?? []) as Category[];
  const transactions = (txData ?? []) as unknown as TransactionWithCategory[];
  const rules = (rulesData ?? []) as RecurringTransaction[];

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <CalendarClient
          categories={categories}
          transactions={transactions}
          rules={rules}
        />
      </main>
    </div>
  );
}
