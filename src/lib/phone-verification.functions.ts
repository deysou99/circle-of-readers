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

/**
 * Server-owned OTP session state so a page reload keeps the same code
 * validity window, resend cooldown and attempt counter.
 */
export const getPhoneOtpStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isSmsConfigured } = await import("@/lib/sms.server");

    const [{ data: profile }, { data: row }] = await Promise.all([
      supabase.rpc("get_my_profile"),
      supabaseAdmin
        .from("phone_verifications")
        .select("phone, attempts, expires_at, created_at, consumed_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const now = Date.now();
    const active =
      row && !row.consumed_at && new Date(row.expires_at).getTime() > now && row.attempts < MAX_ATTEMPTS
        ? row
        : null;
    const cooldownRemaining = row?.created_at
      ? Math.max(0, Math.ceil((RESEND_COOLDOWN_MS - (now - new Date(row.created_at).getTime())) / 1000))
      : 0;

    return {
      phone: (profile as { phone?: string | null } | null)?.phone ?? row?.phone ?? "",
      phoneVerified: Boolean((profile as { phone_verified?: boolean } | null)?.phone_verified),
      hasActiveCode: Boolean(active),
      expiresInSeconds: active
        ? Math.max(0, Math.ceil((new Date(active.expires_at).getTime() - now) / 1000))
        : 0,
      attemptsUsed: active?.attempts ?? 0,
      attemptsLeft: active ? MAX_ATTEMPTS - active.attempts : MAX_ATTEMPTS,
      cooldownRemaining,
      deliveryMode: isSmsConfigured() ? ("sms" as const) : ("in_app" as const),
    };
  });

/** Sends (or prepares) a 6-digit OTP for the signed-in user's phone number. */
export const sendPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string }) => input)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const phone = normalizePhone(data.phone);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isSmsConfigured, sendSms } = await import("@/lib/sms.server");

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

    if (isSmsConfigured()) {
      const sent = await sendSms(phone, `${code} is your Circle verification code. It expires in 10 minutes.`);
      if (!sent.ok) {
        throw new Error("We couldn't text that code right now. Try again in a moment.");
      }
      return {
        phone,
        deliveryMode: "sms" as const,
        expiresInSeconds: CODE_TTL_MS / 1000,
        cooldownSeconds: RESEND_COOLDOWN_MS / 1000,
        attemptsLeft: MAX_ATTEMPTS,
      };
    }

    // No SMS provider is linked yet, so surface the code in-app.
    return {
      phone,
      deliveryMode: "in_app" as const,
      code,
      expiresInSeconds: CODE_TTL_MS / 1000,
      cooldownSeconds: RESEND_COOLDOWN_MS / 1000,
      attemptsLeft: MAX_ATTEMPTS,
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
      throw new Error("That code has expired — tap “Send a new code”.");
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      throw new Error("Too many attempts — tap “Send a new code” to start over.");
    }

    const expected = await hashCode(code, userId);
    if (expected !== row.code_hash) {
      const attempts = row.attempts + 1;
      await supabaseAdmin.from("phone_verifications").update({ attempts }).eq("id", row.id);
      const left = MAX_ATTEMPTS - attempts;
      throw new Error(
        left > 0
          ? `That code doesn't match. ${left} ${left === 1 ? "attempt" : "attempts"} left before you'll need a new code.`
          : "Too many attempts — tap “Send a new code” to start over.",
      );
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

/**
 * Changes the stored phone number, clears verification and immediately opens a
 * fresh OTP round so the new number has to be verified again.
 */
export const changePhoneNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const phone = normalizePhone(data.phone);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabase
      .from("profiles")
      .update({
        phone,
        phone_verified: false,
        phone_verified_at: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    // Invalidate any outstanding codes for the previous number.
    await supabaseAdmin
      .from("phone_verifications")
      .update({ consumed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("consumed_at", null);

    return { ok: true, phone };
  });
