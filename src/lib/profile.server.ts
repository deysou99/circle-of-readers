import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

export type OwnProfile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Reads the signed-in reader's full profile row, including sensitive fields
 * (email, phone, Goodreads data) that the `authenticated` role is not allowed
 * to select directly. Always scoped to the verified user id of the caller.
 */
export async function readOwnProfile(userId: string): Promise<OwnProfile | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as OwnProfile | null) ?? null;
}
