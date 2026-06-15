"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TxType } from "@/lib/types";

type Result = { error?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

function revalidate() {
  revalidatePath("/categories");
  revalidatePath("/");
}

export async function addCategory(input: {
  name: string;
  type: TxType;
  color: string;
}): Promise<Result> {
  const name = input.name.trim();
  if (!name) return { error: "Name is required." };
  if (input.type !== "income" && input.type !== "expense")
    return { error: "Invalid type." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name,
    type: input.type,
    color: input.color,
  });
  if (error) return { error: error.message };

  revalidate();
  return {};
}

// Only name and color are editable — a category's type is fixed.
export async function updateCategory(
  id: string,
  input: { name: string; color: string },
): Promise<Result> {
  const name = input.name.trim();
  if (!name) return { error: "Name is required." };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("categories")
    .update({ name, color: input.color })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidate();
  return {};
}

export async function setCategoryArchived(
  id: string,
  isArchived: boolean,
): Promise<Result> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("categories")
    .update({ is_archived: isArchived })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidate();
  return {};
}
