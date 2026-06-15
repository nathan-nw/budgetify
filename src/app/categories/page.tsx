import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { CategoryManager } from "@/components/categories/CategoryManager";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  const categories = (data ?? []) as Category[];

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">
          Categories
        </h1>
        <p className="mb-8 text-sm text-muted">
          Organize income and expenses. Archived categories stay out of the way
          but keep their colors in past charts.
        </p>
        <CategoryManager categories={categories} />
      </main>
    </div>
  );
}
