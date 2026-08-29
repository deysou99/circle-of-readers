import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const STAGE_LABELS = [
  "What makes you curious?",
  "Where you read",
  "After a great book",
  "Finding your people",
] as const;

export type OnboardingStageKey = "curiosity" | "places" | "after-book" | "belonging";

const STAGE_KEYS: OnboardingStageKey[] = ["curiosity", "places", "after-book", "belonging"];

/**
 * Personalised onboarding progress: which stages are done, where the reader
 * last dropped off, and the single next best step.
 */
export const getOnboardingProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { readOwnProfile: readOwnProfileServer } = await import("@/lib/profile.server");
    const { supabase, userId } = context;

    const [{ data: profile }, { data: reader }, { data: events }] = await Promise.all([
      readOwnProfileServer(userId),
      supabase.from("reader_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("onboarding_events")
        .select("event_type, stage_index, stage_key, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const p = profile as {
      profile_completed?: boolean;
      phone_verified?: boolean;
      onboarding_step?: number;
    } | null;

    const answered = [
      (reader?.curiosity_preferences ?? []).length > 0,
      (reader?.reading_locations ?? []).length > 0 && (reader?.reading_interruptions ?? []).length > 0,
      (reader?.post_book_behaviour ?? []).length > 0 && (reader?.conversation_style ?? []).length > 0,
      (reader?.community_motivations ?? []).length > 0,
    ];

    const readerStages = STAGE_KEYS.map((key, index) => ({
      key,
      index,
      label: STAGE_LABELS[index]!,
      complete: answered[index] ?? false,
    }));

    const steps = [
      { key: "profile", label: "Your details", complete: Boolean(p?.profile_completed) },
      { key: "phone", label: "Phone verification", complete: Boolean(p?.phone_verified) },
      ...readerStages.map((s) => ({ key: s.key, label: s.label, complete: s.complete })),
      { key: "personality", label: "Reader personality", complete: Boolean(reader?.completed) },
    ];

    const nextStep = steps.find((s) => !s.complete) ?? null;
    const completedCount = steps.filter((s) => s.complete).length;
    const lastEvent = events?.[0] ?? null;
    const dropOff =
      events?.find((e) => e.event_type === "onboarding_abandoned") ?? null;

    const resumeStageIndex = Math.min(
      Math.max((p?.onboarding_step ?? 1) - 1, 0),
      STAGE_KEYS.length - 1,
    );

    return {
      complete: Boolean(reader?.completed),
      steps,
      nextStep,
      completedCount,
      totalSteps: steps.length,
      percent: Math.round((completedCount / steps.length) * 100),
      resumeStageIndex,
      resumeStageLabel: STAGE_LABELS[resumeStageIndex] ?? null,
      dropOff: dropOff
        ? { stageIndex: dropOff.stage_index, stageKey: dropOff.stage_key, at: dropOff.created_at }
        : null,
      lastActivityAt: lastEvent?.created_at ?? null,
    };
  });

export type FunnelFilters = { signupMethod?: string; device?: string };

/** Aggregated onboarding funnel for the signed-in reader's own events. */
export const getOnboardingFunnel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: FunnelFilters | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: events } = await supabase
      .from("onboarding_events")
      .select("event_type, stage_index, stage_key, session_id, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(2000);

    const allRows = events ?? [];
    const dimOf = (e: (typeof allRows)[number], key: "signupMethod" | "device") => {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const value = meta[key];
      return typeof value === "string" && value ? value : "unknown";
    };
    const uniq = (key: "signupMethod" | "device") =>
      Array.from(new Set(allRows.map((e) => dimOf(e, key)))).sort();

    const rows = allRows.filter(
      (e) =>
        (!data.signupMethod || dimOf(e, "signupMethod") === data.signupMethod) &&
        (!data.device || dimOf(e, "device") === data.device),
    );
    const stages = STAGE_KEYS.map((key, index) => {
      const viewed = rows.filter((e) => e.event_type === "stage_viewed" && e.stage_index === index).length;
      const completed = rows.filter((e) => e.event_type === "stage_completed" && e.stage_index === index).length;
      const back = rows.filter((e) => e.event_type === "stage_back" && e.stage_index === index).length;
      const dropOffs = rows.filter(
        (e) => e.event_type === "onboarding_abandoned" && e.stage_index === index,
      ).length;
      return {
        key,
        index,
        label: STAGE_LABELS[index]!,
        viewed,
        completed,
        back,
        dropOffs,
        completionRate: viewed > 0 ? Math.round((completed / viewed) * 100) : 0,
      };
    });

    const sessions = new Set(rows.map((e) => e.session_id ?? "")).size;
    const starts = rows.filter((e) => e.event_type === "onboarding_started").length;
    const resumes = rows.filter((e) => e.event_type === "onboarding_resumed").length;
    const completions = rows.filter((e) => e.event_type === "onboarding_completed").length;
    const regenerations = rows.filter((e) => e.event_type === "personality_regenerated").length;

    const resumePoints = STAGE_KEYS.map((key, index) => ({
      key,
      label: STAGE_LABELS[index]!,
      count: rows.filter((e) => e.event_type === "onboarding_resumed" && e.stage_index === index).length,
    }));

    const allEventRows = rows.map((e) => ({
      eventType: e.event_type,
      stageKey: e.stage_key,
      stageIndex: e.stage_index,
      sessionId: e.session_id,
      signupMethod: dimOf(e, "signupMethod"),
      device: dimOf(e, "device"),
      at: e.created_at,
    }));
    const timeline = allEventRows.slice(-40);

    // SMS / OTP delivery health for the same window.
    const { data: otpRows } = await supabase
      .from("otp_events")
      .select("event_type, delivery_mode, attempts, error, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(2000);

    const otp = otpRows ?? [];
    const smsAttempts = otp.filter(
      (e) => e.delivery_mode === "sms" && (e.event_type === "sent" || e.event_type === "sms_failed"),
    ).length;
    const smsFailures = otp.filter((e) => e.event_type === "sms_failed").length;
    const fallbacks = otp.filter((e) => e.event_type === "fallback_in_app").length;

    const byDay = new Map<string, { attempts: number; failures: number }>();
    for (const e of otp) {
      if (e.delivery_mode !== "sms" && e.event_type !== "sms_failed") continue;
      const day = String(e.created_at).slice(0, 10);
      const bucket = byDay.get(day) ?? { attempts: 0, failures: 0 };
      if (e.event_type === "sent" || e.event_type === "sms_failed") bucket.attempts += 1;
      if (e.event_type === "sms_failed") bucket.failures += 1;
      byDay.set(day, bucket);
    }
    const smsTrend = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([day, v]) => ({
        day,
        attempts: v.attempts,
        failures: v.failures,
        failureRate: v.attempts > 0 ? Math.round((v.failures / v.attempts) * 100) : 0,
      }));

    return {
      filters: {
        applied: { signupMethod: data.signupMethod ?? null, device: data.device ?? null },
        signupMethods: uniq("signupMethod"),
        devices: uniq("device"),
      },
      totals: { sessions, starts, resumes, completions, regenerations, events: rows.length },
      stages,
      resumePoints,
      timeline,
      eventRows: allEventRows,
      sms: {
        attempts: smsAttempts,
        failures: smsFailures,
        fallbacks,
        failureRate: smsAttempts > 0 ? Math.round((smsFailures / smsAttempts) * 100) : 0,
        verifyFailures: otp.filter((e) => e.event_type === "verify_failed").length,
        blocked: otp.filter((e) => e.event_type === "verify_blocked").length,
        phoneChanges: otp.filter((e) => e.event_type === "phone_changed").length,
        trend: smsTrend,
      },
    };
  });

/**
 * Post-onboarding retention: whether the reader was active on day 1 and day 7
 * after completing onboarding, broken down by signup method and device.
 */
export const getOnboardingRetention = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: FunnelFilters | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: completions } = await supabase
      .from("onboarding_events")
      .select("metadata, created_at")
      .eq("user_id", userId)
      .eq("event_type", "onboarding_completed")
      .order("created_at", { ascending: true })
      .limit(50);

    const dim = (meta: unknown, key: string) => {
      const m = (meta ?? {}) as Record<string, unknown>;
      const v = m[key];
      return typeof v === "string" && v ? v : "unknown";
    };

    const cohorts = (completions ?? []).filter(
      (c) =>
        (!data.signupMethod || dim(c.metadata, "signupMethod") === data.signupMethod) &&
        (!data.device || dim(c.metadata, "device") === data.device),
    );

    if (cohorts.length === 0) {
      return { cohorts: [] as Array<never>, summary: { total: 0, day1: 0, day7: 0 } };
    }

    const since = cohorts[0]!.created_at;
    const [{ data: posts }, { data: comments }] = await Promise.all([
      supabase.from("posts").select("created_at").eq("user_id", userId).gte("created_at", since),
      supabase.from("comments").select("created_at").eq("user_id", userId).gte("created_at", since),
    ]);
    const activity = [...(posts ?? []), ...(comments ?? [])].map((a) =>
      new Date(a.created_at as string).getTime(),
    );

    const DAY = 86_400_000;
    const rows = cohorts.map((c) => {
      const start = new Date(c.created_at).getTime();
      const activeWithin = (days: number) =>
        activity.some((t) => t > start && t <= start + days * DAY);
      return {
        completedAt: c.created_at,
        signupMethod: dim(c.metadata, "signupMethod"),
        device: dim(c.metadata, "device"),
        day1: activeWithin(1),
        day7: activeWithin(7),
      };
    });

    return {
      cohorts: rows,
      summary: {
        total: rows.length,
        day1: rows.filter((r) => r.day1).length,
        day7: rows.filter((r) => r.day7).length,
      },
    };
  });

