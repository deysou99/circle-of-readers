/**
 * SMS delivery for one-time codes.
 *
 * Uses the Twilio connector through the Lovable connector gateway when the
 * project has a Twilio connection linked (TWILIO_API_KEY + LOVABLE_API_KEY +
 * TWILIO_FROM_NUMBER). Until then the caller falls back to showing the code
 * in-app so the flow stays usable end to end.
 */
const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env['LOVABLE_API_KEY'] &&
      process.env['TWILIO_API_KEY'] &&
      process.env['TWILIO_FROM_NUMBER'],
  );
}

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSmsConfigured()) return { ok: false, error: "sms_not_configured" };

  const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env['LOVABLE_API_KEY']}`,
      "X-Connection-Api-Key": process.env['TWILIO_API_KEY']!,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: to,
      From: process.env['TWILIO_FROM_NUMBER']!,
      Body: body,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[sms] Twilio send failed [${response.status}]: ${errorBody}`);
    return { ok: false, error: `Provider request failed [${response.status}]: ${errorBody}` };
  }
  return { ok: true };
}
