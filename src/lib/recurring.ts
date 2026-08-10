import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecurringFrequency, RecurringTransaction } from "./types";

// 'YYYY-MM-DD' → Date at UTC midnight; back to 'YYYY-MM-DD' at UTC.
// Kept in UTC so month/year math never drifts by a DST hour.
function parse(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}
function format(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayUtc(): string {
  const d = new Date();
  return format(
    new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())),
  );
}

// Days-in-month clamp so Jan 31 + 1 month → Feb 28/29, not Mar 3.
function daysInMonth(year: number, monthZeroBased: number): number {
  return new Date(Date.UTC(year, monthZeroBased + 1, 0)).getUTCDate();
}

function advance(date: string, frequency: RecurringFrequency): string {
  const d = parse(date);
  switch (frequency) {
    case "daily":
      d.setUTCDate(d.getUTCDate() + 1);
      return format(d);
    case "weekly":
      d.setUTCDate(d.getUTCDate() + 7);
      return format(d);
    case "biweekly":
      d.setUTCDate(d.getUTCDate() + 14);
      return format(d);
    case "monthly": {
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      const day = Math.min(d.getUTCDate(), daysInMonth(y, m));
      return format(new Date(Date.UTC(y, m, day)));
    }
    case "yearly": {
      const y = d.getUTCFullYear() + 1;
      const m = d.getUTCMonth();
      const day = Math.min(d.getUTCDate(), daysInMonth(y, m));
      return format(new Date(Date.UTC(y, m, day)));
    }
  }
}

// Materialize every occurrence due on or before today for a given user.
// Called on dashboard load and right after a rule is created, so a user
// never sees the app "waiting" for a scheduler.
export async function materializeDueRecurring(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const today = todayUtc();

  const { data: rules, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .lte("next_due", today);
  if (error || !rules) return;

  for (const rule of rules as RecurringTransaction[]) {
    let next = rule.next_due;
    const inserts: Array<{
      user_id: string;
      category_id: string | null;
      type: string;
      amount: number;
      note: string | null;
      occurred_on: string;
      recurring_id: string;
    }> = [];

    while (next <= today && (!rule.end_date || next <= rule.end_date)) {
      inserts.push({
        user_id: rule.user_id,
        category_id: rule.category_id,
        type: rule.type,
        amount: rule.amount,
        note: rule.note,
        occurred_on: next,
        recurring_id: rule.id,
      });
      next = advance(next, rule.frequency);
    }

    if (inserts.length > 0) {
      const { error: insertErr } = await supabase
        .from("transactions")
        .insert(inserts);
      if (insertErr) continue; // leave next_due untouched; retry on next load
    }

    const ended = !!rule.end_date && next > rule.end_date;
    await supabase
      .from("recurring_transactions")
      .update({ next_due: next, is_active: !ended })
      .eq("id", rule.id);
  }
}
