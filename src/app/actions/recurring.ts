"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { materializeDueRecurring } from "@/lib/recurring";
import type { RecurringFrequency, TxType } from "@/lib/types";

export interface RecurringInput {
  type: TxType;
  amount: number;
  category_id: string | null;
  note: string | null;
  frequency: RecurringFrequency;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string | null;
}

const FREQUENCIES: readonly RecurringFrequency[] = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
];

type Result = { error?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

function validate(input: RecurringInput): string | null {
  if (input.type !== "income" && input.type !== "expense")
    return "Invalid type.";
  if (!Number.isFinite(input.amount) || input.amount < 0)
    return "Amount must be a positive number.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.start_date))
    return "Invalid start date.";
  if (
    input.end_date !== null &&
    !/^\d{4}-\d{2}-\d{2}$/.test(input.end_date)
  )
    return "Invalid end date.";
  if (input.end_date && input.end_date < input.start_date)
    return "End date must be after start date.";
  if (!FREQUENCIES.includes(input.frequency)) return "Invalid frequency.";
  return null;
}

function revalidate() {
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/recurring");
}

export async function addRecurring(input: RecurringInput): Promise<Result> {
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("recurring_transactions").insert({
    user_id: user.id,
    type: input.type,
    amount: input.amount,
    category_id: input.category_id,
    note: input.note?.trim() || null,
    frequency: input.frequency,
    start_date: input.start_date,
    next_due: input.start_date,
    end_date: input.end_date,
  });
  if (error) return { error: error.message };

  // If the rule starts today or in the past, produce the first occurrence(s)
  // now so the user sees them without a second navigation.
  await materializeDueRecurring(supabase, user.id);

  revalidate();
  return {};
}

export async function updateRecurring(
  id: string,
  input: RecurringInput,
): Promise<Result> {
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("recurring_transactions")
    .update({
      type: input.type,
      amount: input.amount,
      category_id: input.category_id,
      note: input.note?.trim() || null,
      frequency: input.frequency,
      end_date: input.end_date,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidate();
  return {};
}

// Soft-delete: keeps recurring_id links on already-materialized transactions
// meaningful, and stops the runner from producing further occurrences.
export async function deleteRecurring(id: string): Promise<Result> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("recurring_transactions")
    .update({ is_active: false })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidate();
  return {};
}
