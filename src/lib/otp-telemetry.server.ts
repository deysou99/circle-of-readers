import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type OtpEventType =
  | "sent"
  | "sms_failed"
  | "fallback_in_app"
  | "verify_failed"
  | "verify_blocked"
  | "verified"
  | "phone_changed";

/**
 * Records OTP / SMS delivery telemetry. Only the last four phone digits are
 * stored so the admin view never exposes full numbers. Never throws — logging
 * must not break the verification flow.
 */
export async function logOtpEvent(input: {
  userId: string;
  eventType: OtpEventType;
  phone?: string | null;
  deliveryMode?: string | null;
  attempts?: number;
  error?: string | null;
}): Promise<void> {
  try {
    await supabaseAdmin.from("otp_events").insert({
      user_id: input.userId,
      event_type: input.eventType,
      delivery_mode: input.deliveryMode ?? null,
      phone_last4: input.phone ? input.phone.replace(/\D/g, "").slice(-4) : null,
      attempts: input.attempts ?? 0,
      error: input.error ? String(input.error).slice(0, 500) : null,
    });
  } catch (e) {
    console.error("[otp-telemetry] failed to record event", e);
  }
}
