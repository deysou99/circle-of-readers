import { useCallback, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { logOnboardingEvent } from "@/lib/onboarding.functions";

const STAGE_KEYS = ["curiosity", "places", "after-book", "belonging"] as const;

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

  return useCallback(
    (eventType: string, stageIndex?: number, metadata?: Record<string, unknown>) => {
      void log({
        data: {
          sessionId,
          eventType,
          ...(stageIndex === undefined ? {} : { stageIndex, stageKey: STAGE_KEYS[stageIndex] }),
          metadata: { ...(metadata ?? {}), mode: editMode ? "edit" : "onboarding" },
        },
      }).catch(() => {
        /* analytics must never block the flow */
      });
    },
    [log, sessionId, editMode],
  );
}
