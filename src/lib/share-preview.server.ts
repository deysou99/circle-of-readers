/**
 * Server-side helpers for profile share-link previews.
 *
 * The generated Open Graph / Twitter metadata is deterministic for a given
 * (user, tab, query) triple, so we memoise it in-process for a short window.
 * Chat apps often fetch the same link repeatedly (unfurl + retry), and this
 * keeps those hits off the database.
 */

export type SharePreview = {
  title: string;
  description: string;
  tab: "followers" | "following";
  query: string;
  matchCount: number | null;
  /** True when the match count lookup failed and we fell back to generic copy. */
  degraded: boolean;
  cached: boolean;
  generatedAt: string;
};

type CacheEntry = { value: SharePreview; expiresAt: number };

const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map<string, CacheEntry>();

function cacheKey(userId: string, tab: string, query: string) {
  return `${userId}|${tab}|${query.toLowerCase()}`;
}

export function readPreviewCache(userId: string, tab: string, query: string): SharePreview | null {
  const entry = cache.get(cacheKey(userId, tab, query));
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(cacheKey(userId, tab, query));
    return null;
  }
  return { ...entry.value, cached: true };
}

export function writePreviewCache(userId: string, tab: string, query: string, value: SharePreview) {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(cacheKey(userId, tab, query), { value, expiresAt: Date.now() + TTL_MS });
}

export function buildPreviewCopy(
  tab: "followers" | "following",
  query: string,
  matchCount: number | null,
  totalCount: number | null,
): { title: string; description: string } {
  const title = query ? `“${query}” in my ${tab} — Circle` : `My ${tab} — Circle`;
  if (query) {
    const description =
      matchCount === null
        ? `Readers matching “${query}” in my ${tab} on Circle.`
        : `${matchCount} ${matchCount === 1 ? "match" : "matches"} for “${query}” in my ${tab} on Circle.`;
    return { title, description };
  }
  const description =
    totalCount === null
      ? `The readers who follow me and the readers I follow on Circle.`
      : `${totalCount} readers in my ${tab} on Circle.`;
  return { title, description };
}
