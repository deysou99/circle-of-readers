import { useCallback, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { logOnboardingEvent } from "@/lib/onboarding.functions";

const STAGE_KEYS = ["curiosity", "places", "after-book", "belonging"] as const;

/** Coarse device bucket used to drill into the onboarding funnel. */
function detectDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined" || typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
}

/**
 * Fire-and-forget onboarding funnel analytics. Events are stored in the
 * backend so stage views, completions, drop-offs and resumes can be analysed.
 */
export function useOnboardingTracker(editMode = false) {
  const log = useServerFn(logOnboardingEvent);
  const sessionId = useMemo(
    () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const device = useMemo(() => detectDevice(), []);

  return useCallback(
    (eventType: string, stageIndex?: number, metadata?: Record<string, unknown>) => {
      void log({
        data: {
          sessionId,
          eventType,
          ...(stageIndex === undefined ? {} : { stageIndex, stageKey: STAGE_KEYS[stageIndex] }),
          metadata: { ...(metadata ?? {}), device, mode: editMode ? "edit" : "onboarding" },
        },
      }).catch(() => {
        /* analytics must never block the flow */
      });
    },
    [log, sessionId, editMode],
  );
}
