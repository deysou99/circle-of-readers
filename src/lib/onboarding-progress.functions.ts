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

    const timeline = rows.slice(-40).map((e) => ({
      eventType: e.event_type,
      stageKey: e.stage_key,
      stageIndex: e.stage_index,
      signupMethod: dimOf(e, "signupMethod"),
      device: dimOf(e, "device"),
      at: e.created_at,
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
    };
  });
