import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { RecurringManager } from "@/components/RecurringManager";
import type { Category, RecurringTransaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const supabase = await createClient();

  const [{ data: rulesData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("recurring_transactions")
      .select("*")
      .eq("is_active", true)
      .order("next_due", { ascending: true }),
    supabase.from("categories").select("*").order("name", { ascending: true }),
  ]);

  const rules = (rulesData ?? []) as RecurringTransaction[];
  const categories = (categoriesData ?? []) as Category[];

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">
          Recurring
        </h1>
        <p className="mb-8 text-sm text-muted">
          Rules that log a transaction automatically on a schedule. Stopping a
          rule keeps every transaction it has already created.
        </p>
        <RecurringManager rules={rules} categories={categories} />
      </main>
    </div>
  );
}
