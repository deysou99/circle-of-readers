import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PHONE_RE = /^[+]?[\d][\d\s()-]{7,17}$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 45 * 1000;

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (!PHONE_RE.test(trimmed)) throw new Error("Enter a valid phone number");
  const digits = trimmed.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

async function hashCode(code: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Sends (or prepares) a 6-digit OTP for the signed-in user's phone number. */
export const sendPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string }) => input)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const phone = normalizePhone(data.phone);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: recent } = await supabaseAdmin
      .from("phone_verifications")
      .select("created_at")
      .eq("user_id", userId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.created_at) {
      const elapsed = Date.now() - new Date(recent.created_at).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        throw new Error(
          `Please wait ${Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)}s before requesting a new code`,
        );
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await hashCode(code, userId);

    const { error } = await supabaseAdmin.from("phone_verifications").insert({
      user_id: userId,
      phone,
      code_hash,
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    });
    if (error) throw new Error(error.message);

    // No SMS provider is configured for this project yet. Until one is added we
    // surface the code in-app so the flow is fully usable end to end.
    const smsConfigured = Boolean(process.env['SMS_PROVIDER_API_KEY']);

    return {
      phone,
      deliveryMode: smsConfigured ? ("sms" as const) : ("in_app" as const),
      ...(smsConfigured ? {} : { code }),
      expiresInSeconds: CODE_TTL_MS / 1000,
    };
  });

/** Verifies the OTP and marks the profile phone as verified. */
export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const code = data.code.trim();
    if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("phone_verifications")
      .select("id, phone, code_hash, attempts, expires_at")
      .eq("user_id", userId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) throw new Error("Request a new code to continue");
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new Error("That code has expired — request a new one");
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      throw new Error("Too many attempts — request a new code");
    }

    const expected = await hashCode(code, userId);
    if (expected !== row.code_hash) {
      await supabaseAdmin
        .from("phone_verifications")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      throw new Error("That code doesn't match. Try again.");
    }

    await supabaseAdmin
      .from("phone_verifications")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);

    const { error } = await supabase
      .from("profiles")
      .update({
        phone: row.phone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    return { ok: true, phone: row.phone };
  });
