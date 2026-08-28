import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Server-only Goodreads helpers: link normalisation, OAuth state/nonce signing, sync parsing. */

export function normalizeGoodreadsUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^\d+(-[\w-]+)?$/.test(raw)) return `https://www.goodreads.com/user/show/${raw}`;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!/(^|\.)goodreads\.com$/i.test(url.hostname)) return null;
    if (!/^\/(user|review)\/[\w/-]+/i.test(url.pathname)) return null;
    return `https://www.goodreads.com${url.pathname}`;
  } catch {
    return null;
  }
}

export function extractGoodreadsUserId(url: string): string | null {
  const m = url.match(/\/(?:user\/show|review\/list|review\/list_rss)\/(\d+)/);
  return m?.[1] ?? null;
}

/* ------------------------------- state / nonce ------------------------------ */

const STATE_TTL_MS = 10 * 60 * 1000;

function secret(): string {
  return (
    process.env['GOODREADS_STATE_SECRET'] ??
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ??
    process.env['SUPABASE_URL'] ??
    "circle-goodreads-dev-secret"
  );
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export type StatePayload = { uid: string; nonce: string; exp: number };

/** Creates a one-time nonce plus an HMAC-signed state token bound to the user. */
export function createOAuthState(userId: string): { state: string; nonce: string } {
  const nonce = randomBytes(16).toString("hex");
  const payload: StatePayload = { uid: userId, nonce, exp: Date.now() + STATE_TTL_MS };
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return { state: `${body}.${sig}`, nonce };
}

export type StateFailure =
  | "missing_state"
  | "malformed_state"
  | "bad_signature"
  | "expired"
  | "user_mismatch"
  | "nonce_mismatch";

export function verifyOAuthState(
  state: string | null | undefined,
  nonce: string | null | undefined,
  userId: string,
): { ok: true } | { ok: false; reason: StateFailure } {
  if (!state) return { ok: false, reason: "missing_state" };
  const [body, sig] = state.split(".");
  if (!body || !sig) return { ok: false, reason: "malformed_state" };

  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };

  let payload: StatePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as StatePayload;
  } catch {
    return { ok: false, reason: "malformed_state" };
  }
  if (!payload || typeof payload.exp !== "number" || Date.now() > payload.exp) {
    return { ok: false, reason: "expired" };
  }
  if (payload.uid !== userId) return { ok: false, reason: "user_mismatch" };
  if (!nonce || payload.nonce !== nonce) return { ok: false, reason: "nonce_mismatch" };
  return { ok: true };
}

export const STATE_FAILURE_MESSAGES: Record<StateFailure, string> = {
  missing_state: "Goodreads sent us back without a security token, so we stopped the connection. Start again from Circle.",
  malformed_state: "The security token from Goodreads was unreadable. Start the connection again from Circle.",
  bad_signature: "The security token from Goodreads didn't check out, so we cancelled the connection for your safety.",
  expired: "This connection attempt took too long and expired. Start it again — it only takes a moment.",
  user_mismatch: "This connection was started by a different Circle account. Sign in as that account or start again.",
  nonce_mismatch: "We couldn't match this response to the request you started. Start the connection again from Circle.",
};

/* ----------------------------------- sync ---------------------------------- */

export type GoodreadsSummary = {
  shelfCounts: Record<string, number>;
  totalBooks: number;
  recentBooks: { title: string; author: string; shelf: string }[];
  averageRating: number | null;
};

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`, "i"));
  return (m?.[1] ?? "").trim();
}

/**
 * Pulls basic reading data from the public Goodreads RSS review list.
 * Returns null when the feed is private/unavailable.
 */
export async function fetchGoodreadsSummary(goodreadsUserId: string): Promise<GoodreadsSummary | null> {
  const url = `https://www.goodreads.com/review/list_rss/${goodreadsUserId}?shelf=%23ALL%23&per_page=100`;
  let xml = "";
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "CircleByMyFlip/1.0 (+goodreads-sync)" },
    });
    if (!res.ok) return null;
    xml = await res.text();
  } catch {
    return null;
  }
  if (!xml.includes("<item")) return null;

  const items = xml.split("<item>").slice(1).map((chunk) => chunk.split("</item>")[0] ?? "");
  const shelfCounts: Record<string, number> = {};
  const recentBooks: GoodreadsSummary["recentBooks"] = [];
  let ratingSum = 0;
  let ratingCount = 0;

  for (const item of items) {
    const shelvesRaw = tag(item, "user_shelves");
    const shelf = (shelvesRaw.split(",")[0] ?? "").trim() || "read";
    shelfCounts[shelf] = (shelfCounts[shelf] ?? 0) + 1;

    const rating = Number(tag(item, "user_rating"));
    if (Number.isFinite(rating) && rating > 0) {
      ratingSum += rating;
      ratingCount += 1;
    }

    if (recentBooks.length < 12) {
      recentBooks.push({
        title: tag(item, "title") || "Untitled",
        author: tag(item, "author_name"),
        shelf,
      });
    }
  }

  return {
    shelfCounts,
    totalBooks: items.length,
    recentBooks,
    averageRating: ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
  };
}
