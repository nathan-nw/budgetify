"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addRecurring } from "./recurring";
import type { RecurringFrequency, TxType } from "@/lib/types";

export interface TransactionInput {
  type: TxType;
  amount: number;
  category_id: string | null;
  occurred_on: string; // 'YYYY-MM-DD'
  note: string | null;
  // When present on add, the app creates a recurring rule instead of a bare
  // transaction; the rule's materializer produces the first occurrence.
  recurring?: {
    frequency: RecurringFrequency;
    end_date: string | null;
  } | null;
}

type Result = { error?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

function validate(input: TransactionInput): string | null {
  if (input.type !== "income" && input.type !== "expense")
    return "Invalid type.";
  if (!Number.isFinite(input.amount) || input.amount < 0)
    return "Amount must be a positive number.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.occurred_on)) return "Invalid date.";
  return null;
}

export async function addTransaction(input: TransactionInput): Promise<Result> {
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  if (input.recurring) {
    return addRecurring({
      type: input.type,
      amount: input.amount,
      category_id: input.category_id,
      note: input.note?.trim() || null,
      frequency: input.recurring.frequency,
      start_date: input.occurred_on,
      end_date: input.recurring.end_date,
    });
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type: input.type,
    amount: input.amount,
    category_id: input.category_id,
    occurred_on: input.occurred_on,
    note: input.note?.trim() || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transactions");
  return {};
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<Result> {
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("transactions")
    .update({
      type: input.type,
      amount: input.amount,
      category_id: input.category_id,
      occurred_on: input.occurred_on,
      note: input.note?.trim() || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transactions");
  return {};
}

export async function deleteTransaction(id: string): Promise<Result> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transactions");
  return {};
}
