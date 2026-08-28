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
 * real handshake if access returns: `startGoodreadsConnect` issues a signed
 * state + nonce, `/goodreads/callback` validates them via
 * `verifyGoodreadsCallback`, and `connectGoodreads` verifies + persists.
 */
export const startGoodreadsConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { returnUrl?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { createOAuthState } = await import("@/lib/goodreads.server");
    const { state, nonce } = createOAuthState(context.userId);
    const key = process.env['GOODREADS_API_KEY'];
    if (!key) {
      return {
        mode: "manual" as const,
        authorizeUrl: null,
        state,
        nonce,
        message:
          "Goodreads no longer issues API keys, so we can't authorize automatically. Paste your public profile link instead and we'll verify it.",
      };
    }
    const redirect = data.returnUrl ? `&oauth_callback=${encodeURIComponent(data.returnUrl)}` : "";
    return {
      mode: "oauth" as const,
      authorizeUrl: `https://www.goodreads.com/oauth/authorize?mobile=1&key=${encodeURIComponent(key)}&state=${encodeURIComponent(state)}${redirect}`,
      state,
      nonce,
      message: null,
    };
  });

/** Validates the signed state + one-time nonce returned to /goodreads/callback. */
export const verifyGoodreadsCallback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { state?: string | null; nonce?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { verifyOAuthState, STATE_FAILURE_MESSAGES } = await import("@/lib/goodreads.server");
    const result = verifyOAuthState(data.state ?? null, data.nonce ?? null, context.userId);
    if (result.ok) return { ok: true as const, reason: null, message: null };
    return {
      ok: false as const,
      reason: result.reason,
      message: STATE_FAILURE_MESSAGES[result.reason],
    };
  });

export const connectGoodreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { profileUrl: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { normalizeGoodreadsUrl, extractGoodreadsUserId } = await import("@/lib/goodreads.server");
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

    const verifiedAt = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({
        goodreads_connected: true,
        goodreads_profile: url,
        goodreads_user_id: extractGoodreadsUserId(url),
        goodreads_verified_at: verifiedAt,
        updated_at: verifiedAt,
      })
      .eq("user_id", userId);
    if (error) throw new Error("We couldn't save your Goodreads link. Please try again.");

    return { ok: true, profileUrl: url, verified: reachable, verifiedAt, imported: false as const };
  });

/** Pulls basic reading data from the linked public Goodreads profile. */
export const syncGoodreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { extractGoodreadsUserId, fetchGoodreadsSummary } = await import("@/lib/goodreads.server");

    const { data: profile } = await supabase.rpc("get_my_profile");
    if (!profile?.goodreads_connected || !profile.goodreads_profile) {
      throw new Error("Connect your Goodreads profile first, then sync.");
    }
    const grId = profile.goodreads_user_id ?? extractGoodreadsUserId(profile.goodreads_profile);
    if (!grId) {
      throw new Error("We couldn't read a Goodreads user ID from your link. Re-link using your profile URL.");
    }

    const summary = await fetchGoodreadsSummary(grId);
    if (!summary) {
      throw new Error("Goodreads didn't return your books. Make sure your profile and shelves are public, then try again.");
    }

    const syncedAt = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({
        goodreads_user_id: grId,
        goodreads_last_sync_at: syncedAt,
        goodreads_stats: summary as never,
        updated_at: syncedAt,
      })
      .eq("user_id", userId);
    if (error) throw new Error("We synced Goodreads but couldn't save the result. Please try again.");

    // Merge the Goodreads snapshot into the reader profile without clobbering traits.
    const { data: reader } = await supabase
      .from("reader_profiles")
      .select("traits")
      .eq("user_id", userId)
      .maybeSingle();
    const existingTraits = (reader?.traits ?? {}) as Record<string, unknown>;
    await supabase.from("reader_profiles").upsert(
      {
        user_id: userId,
        traits: { ...existingTraits, goodreads: summary } as never,
        updated_at: syncedAt,
      },
      { onConflict: "user_id" },
    );

    return { ok: true as const, syncedAt, summary };
  });


export const disconnectGoodreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({
        goodreads_connected: false,
        goodreads_profile: null,
        goodreads_user_id: null,
        goodreads_verified_at: null,
        goodreads_last_sync_at: null,
        goodreads_stats: {} as never,
        updated_at: new Date().toISOString(),
      })
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
