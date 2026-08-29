import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildPreviewCopy,
  readPreviewCache,
  writePreviewCache,
  type SharePreview,
} from "@/lib/share-preview.server";

export type ShareEventType = "preview_view" | "copy_click" | "share_open" | "preview_tap";

export const logShareEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      eventType: ShareEventType;
      surface?: string;
      tab?: string;
      query?: string;
      matchCount?: number;
    }) => ({
      eventType: data.eventType,
      surface: (data.surface ?? "profile_circle").slice(0, 40),
      tab: (data.tab ?? "").slice(0, 20),
      query: (data.query ?? "").slice(0, 60),
      matchCount:
        typeof data.matchCount === "number" && Number.isFinite(data.matchCount)
          ? Math.max(0, Math.round(data.matchCount))
          : null,
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("share_events").insert({
      user_id: userId,
      event_type: data.eventType,
      surface: data.surface,
      tab: data.tab || null,
      query: data.query || null,
      match_count: data.matchCount,
    });
    return { ok: true };
  });

export const getSharePreview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { tab?: string; query?: string }) => ({
    tab: data.tab === "following" ? ("following" as const) : ("followers" as const),
    query: (data.query ?? "").trim().slice(0, 60),
  }))
  .handler(async ({ data, context }): Promise<SharePreview> => {
    const { supabase, userId } = context;
    const cached = readPreviewCache(userId, data.tab, data.query);
    if (cached) return cached;

    let matchCount: number | null = null;
    let totalCount: number | null = null;
    let degraded = false;

    try {
      const { data: rows, error } =
        data.tab === "followers"
          ? await supabase.from("follows").select("follower_id").eq("following_id", userId)
          : await supabase.from("follows").select("following_id").eq("follower_id", userId);
      if (error) throw error;

      const ids = (rows ?? []).map((r) =>
        data.tab === "followers"
          ? (r as { follower_id: string }).follower_id
          : (r as { following_id: string }).following_id,
      );
      totalCount = ids.length;

      if (!data.query) {
        matchCount = ids.length;
      } else if (ids.length) {
        const like = `%${data.query.replace(/[%_,]/g, "")}%`;
        const { count, error: matchError } = await supabase
          .from("public_profiles")
          .select("user_id", { count: "exact", head: true })
          .in("user_id", ids)
          .or(`username.ilike.${like},display_name.ilike.${like}`);
        if (matchError) throw matchError;
        matchCount = count ?? 0;
      } else {
        matchCount = 0;
      }
    } catch {
      degraded = true;
      matchCount = null;
    }

    const { title, description } = buildPreviewCopy(data.tab, data.query, matchCount, totalCount);
    const preview: SharePreview = {
      title,
      description,
      tab: data.tab,
      query: data.query,
      matchCount,
      degraded,
      cached: false,
      generatedAt: new Date().toISOString(),
    };
    // Never cache a degraded preview — the next request should retry the lookup.
    if (!degraded) writePreviewCache(userId, data.tab, data.query, preview);
    return preview;
  });
