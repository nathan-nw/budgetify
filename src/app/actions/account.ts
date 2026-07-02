"use server";

import { createClient } from "@/lib/supabase/server";

export async function changePassword(input: {
  current: string;
  next: string;
}): Promise<{ error?: string }> {
  if (input.next.length < 8)
    return { error: "New password must be at least 8 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not authenticated" };

  // Verify the current password before changing it, so an unlocked session
  // can't silently reset the password.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: input.current,
  });
  if (verifyError) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: input.next });
  if (error) return { error: error.message };

  return {};
}
