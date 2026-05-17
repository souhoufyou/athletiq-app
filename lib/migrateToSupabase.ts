"use client";

import { supabase } from "@/lib/supabaseClient";
import { syncManager } from "@/lib/sync";

export async function migrateLocalStorageToSupabase(userId: string): Promise<boolean> {
  await syncManager.reconcile(userId);
  return true;
}

export async function ensureSupabaseProfile(userId: string, email: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!data) {
    const name = email.split("@")[0] || "Athlète";
    await supabase.from("profiles").insert({
      user_id: userId,
      name,
      avatar: "💪"
    });
  }
}
