import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** True when the signed-in reader holds the admin role. */
export const getIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: Boolean(data) };
  });

export type OtpFailureRow = {
  id: string;
  userId: string;
  eventType: string;
  deliveryMode: string | null;
  phoneLast4: string | null;
  attempts: number;
  error: string | null;
  at: string;
};

/**
 * Admin-only feed of OTP verification failures, SMS fallback usage and phone
 * changes. Authorises the caller through their own role row first, then reads
 * across users with elevated privileges.
 */
export const listOtpIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("otp_events")
      .select("id, user_id, event_type, delivery_mode, phone_last4, attempts, error, created_at")
      .in("event_type", [
        "sms_failed",
        "fallback_in_app",
        "verify_failed",
        "verify_blocked",
        "phone_changed",
      ])
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 200, 500));
    if (error) throw new Error(error.message);

    const incidents: OtpFailureRow[] = (rows ?? []).map((r) => ({
      id: r.id as string,
      userId: r.user_id as string,
      eventType: r.event_type as string,
      deliveryMode: (r.delivery_mode as string | null) ?? null,
      phoneLast4: (r.phone_last4 as string | null) ?? null,
      attempts: (r.attempts as number) ?? 0,
      error: (r.error as string | null) ?? null,
      at: r.created_at as string,
    }));

    const counts = incidents.reduce<Record<string, number>>((acc, r) => {
      acc[r.eventType] = (acc[r.eventType] ?? 0) + 1;
      return acc;
    }, {});

    return { incidents, counts };
  });
