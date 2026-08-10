"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Square } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RecurringForm } from "@/components/RecurringForm";
import { formatDate, formatSigned } from "@/lib/format";
import type {
  Category,
  RecurringFrequency,
  RecurringTransaction,
} from "@/lib/types";
import { deleteRecurring } from "@/app/actions/recurring";

const FREQ_LABEL: Record<RecurringFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function RecurringManager({
  rules,
  categories,
}: {
  rules: RecurringTransaction[];
  categories: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  function handleStop(rule: RecurringTransaction) {
    if (
      !confirm(
        `Stop this recurring ${rule.type}? Existing transactions stay; no new ones will be created.`,
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await deleteRecurring(rule.id);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      <Card>
        {rules.length === 0 ? (
          <p className="py-2 text-sm text-muted">
            No recurring transactions yet. Turn on <em>Repeat</em> when adding a
            transaction to create one.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rules.map((rule) => {
              const cat = rule.category_id
                ? catMap.get(rule.category_id)
                : null;
              return (
                <li
                  key={rule.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: cat?.color ?? "#9ca3af" }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm">
                        {cat?.name ?? "Uncategorized"}
                        {rule.note ? (
                          <span className="text-muted"> · {rule.note}</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted">
                        {FREQ_LABEL[rule.frequency]} · next {formatDate(rule.next_due)}
                        {rule.end_date
                          ? ` · ends ${formatDate(rule.end_date)}`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`tnum text-sm ${rule.type === "income" ? "text-positive" : "text-negative"}`}
                    >
                      {formatSigned(rule.amount, rule.type)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditing(rule)}
                      aria-label="Edit rule"
                      className="rounded-lg p-1.5 text-muted hover:text-text"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStop(rule)}
                      disabled={isPending}
                      aria-label="Stop rule"
                      className="rounded-lg p-1.5 text-muted hover:text-negative disabled:opacity-50"
                    >
                      <Square size={15} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {editing && (
        <RecurringForm
          open={!!editing}
          onClose={() => setEditing(null)}
          categories={categories}
          editing={editing}
        />
      )}
    </div>
  );
}
