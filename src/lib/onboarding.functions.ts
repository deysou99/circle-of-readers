import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { derivePersonality, scoreTraits, type ReaderAnswers } from "@/lib/reader-onboarding";

export const getOnboardingState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;

    const meta = (claims['user_metadata'] ?? {}) as Record<string, unknown>;
    const appMeta = (claims['app_metadata'] ?? {}) as Record<string, unknown>;
    const providers = Array.isArray(appMeta['providers']) ? (appMeta['providers'] as string[]) : [];
    const metaFullName = typeof meta['full_name'] === "string" ? meta['full_name'] : "";
    const [metaFirst = "", ...metaRest] = metaFullName.split(" ");
    const identity = {
      email: typeof claims['email'] === "string" ? claims['email'] : "",
      firstName: (typeof meta['given_name'] === "string" ? meta['given_name'] : metaFirst) || "",
      lastName: (typeof meta['family_name'] === "string" ? meta['family_name'] : metaRest.join(" ")) || "",
      avatarUrl: typeof meta['avatar_url'] === "string" ? meta['avatar_url'] : "",
      isGoogle: appMeta['provider'] === "google" || providers.includes("google"),
    };

    const [{ data: profile }, { data: reader }] = await Promise.all([
      supabase.rpc("get_my_profile"),
      supabase.from("reader_profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    const stage = !profile?.profile_completed
      ? ("profile" as const)
      : reader?.completed
        ? ("done" as const)
        : ("reader" as const);

    return { identity, profile, reader, stage };
  });

export const saveBasicProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    goodreadsConnected?: boolean;
    goodreadsProfile?: string;
    avatarUrl?: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const first = data.firstName.trim();
    const last = data.lastName.trim();
    if (!first || !last) throw new Error("First and last name are required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) throw new Error("A valid email is required");

    const patch = {
      first_name: first,
      last_name: last,
      email: data.email.trim(),
      phone: data.phone?.trim() || null,
      display_name: `${first} ${last}`.trim(),
      goodreads_connected: data.goodreadsConnected ?? false,
      goodreads_profile: data.goodreadsProfile?.trim() || null,
      profile_completed: true,
      onboarding_step: 1,
      updated_at: new Date().toISOString(),
      ...(data.avatarUrl ? { avatar_url: data.avatarUrl } : {}),
    };

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("profiles").update(patch).eq("user_id", userId);
      if (error) throw new Error(error.message);
    } else {
      const base = first.toLowerCase().replace(/[^a-z0-9]/g, "") || "reader";
      const { error } = await supabase.from("profiles").insert({
        user_id: userId,
        username: `${base}_${userId.slice(0, 6)}`,
        ...patch,
      });
      if (error) throw new Error(error.message);
    }

    await supabase
      .from("reader_profiles")
      .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

    return { ok: true };
  });

export const saveReaderStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { step: number; answers: Partial<ReaderAnswers> }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("reader_profiles").upsert(
      { user_id: userId, ...data.answers, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);

    await supabase
      .from("profiles")
      .update({ onboarding_step: Math.max(1, data.step), updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    return { ok: true };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { answers: ReaderAnswers }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const traits = scoreTraits(data.answers);
    const personality = derivePersonality(traits);

    const { error } = await supabase.from("reader_profiles").upsert(
      {
        user_id: userId,
        ...data.answers,
        traits,
        personality_name: personality.name,
        personality_description: personality.description,
        completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);

    await supabase
      .from("profiles")
      .update({
        onboarded: true,
        onboarding_step: 5,
        favorite_genres: data.answers.curiosity_preferences,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return { traits, personality };
  });

/**
 * Goodreads integration.
 *
 * Goodreads stopped issuing developer keys in Dec 2020, so a real OAuth token
 * exchange is not possible for new apps. The flow below keeps the full shape of
 * an OAuth connection (start -> callback -> save) so it can be swapped to a
 * real handshake if access returns: `startGoodreadsConnect` returns the URL the
 * user is sent to, `/goodreads/callback` handles the return, and
 * `connectGoodreads` verifies + persists the connection.
 */
export const startGoodreadsConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const key = process.env['GOODREADS_API_KEY'];
    if (!key) {
      return {
        mode: "manual" as const,
        authorizeUrl: null,
        message:
          "Goodreads no longer issues API keys, so we can't authorize automatically. Paste your public profile link instead and we'll verify it.",
      };
    }
    return {
      mode: "oauth" as const,
      authorizeUrl: `https://www.goodreads.com/oauth/authorize?mobile=1&key=${encodeURIComponent(key)}`,
      message: null,
    };
  });

function normalizeGoodreadsUrl(input: string): string | null {
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

export const connectGoodreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { profileUrl: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const url = normalizeGoodreadsUrl(data.profileUrl);
    if (!url) {
      throw new Error("That doesn't look like a Goodreads profile. Paste a link like https://www.goodreads.com/user/show/12345-alex");
    }

    // Verify the profile is reachable and public before saving it.
    let reachable = false;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "user-agent": "CircleByMyFlip/1.0 (+profile-link-verification)" },
      });
      reachable = res.ok;
      if (res.status === 404) throw new Error("We couldn't find that Goodreads profile. Double-check the link.");
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("We couldn't find")) throw e;
      reachable = false;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        goodreads_connected: true,
        goodreads_profile: url,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) throw new Error("We couldn't save your Goodreads link. Please try again.");

    return { ok: true, profileUrl: url, verified: reachable, imported: false as const };
  });

export const disconnectGoodreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ goodreads_connected: false, goodreads_profile: null, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw new Error("We couldn't disconnect Goodreads. Please try again.");
    return { ok: true };
  });


/* --------------------------- onboarding analytics -------------------------- */

const ONBOARDING_EVENTS = [
  "onboarding_started",
  "onboarding_resumed",
  "profile_step_viewed",
  "profile_step_completed",
  "stage_viewed",
  "stage_completed",
  "stage_back",
  "onboarding_completed",
  "onboarding_abandoned",
  "personality_regenerated",
  "edit_answers_started",
] as const;

export type OnboardingEventType = (typeof ONBOARDING_EVENTS)[number];

export const logOnboardingEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    sessionId: string;
    eventType: string;
    stageIndex?: number;
    stageKey?: string;
    metadata?: Record<string, unknown>;
  }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!(ONBOARDING_EVENTS as readonly string[]).includes(data.eventType)) {
      return { ok: false as const };
    }
    const { error } = await supabase.from("onboarding_events").insert({
      user_id: userId,
      session_id: data.sessionId.slice(0, 64),
      event_type: data.eventType,
      stage_index: data.stageIndex ?? null,
      stage_key: data.stageKey ?? null,
      metadata: (data.metadata ?? {}) as never,
    });
    if (error) return { ok: false as const };
    return { ok: true as const };
  });

/** Funnel summary for the signed-in reader: per-stage views, completions and drop-off. */
export const getOnboardingFunnel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("onboarding_events")
      .select("event_type, stage_index, stage_key, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const stages = [0, 1, 2, 3].map((i) => ({
      stageIndex: i,
      views: rows.filter((r) => r.event_type === "stage_viewed" && r.stage_index === i).length,
      completions: rows.filter((r) => r.event_type === "stage_completed" && r.stage_index === i).length,
    }));
    const lastViewed = [...rows].reverse().find((r) => r.event_type === "stage_viewed");

    return {
      totalEvents: rows.length,
      stages,
      resumes: rows.filter((r) => r.event_type === "onboarding_resumed").length,
      abandons: rows.filter((r) => r.event_type === "onboarding_abandoned").length,
      completed: rows.some((r) => r.event_type === "onboarding_completed"),
      dropOffStage: lastViewed?.stage_index ?? null,
    };
  });
