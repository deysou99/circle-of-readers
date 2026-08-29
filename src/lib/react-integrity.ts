import * as React from "react";

/**
 * Guards against the "two React copies" failure mode.
 *
 * When a stale bundler cache serves two different React instances, hooks read
 * a null dispatcher and every render throws
 * `Cannot read properties of null (reading 'use' | 'useContext' | ...)`,
 * which shows up as a blank screen. We register our React instance on
 * `globalThis` so a second copy is detected immediately, and we also classify
 * the runtime error itself so the UI can explain what happened.
 */

type Registry = {
  instances: Set<unknown>;
  versions: Set<string>;
};

const KEY = "__circle_react_registry__";

function registry(): Registry | null {
  if (typeof globalThis === "undefined") return null;
  const g = globalThis as unknown as Record<string, Registry | undefined>;
  if (!g[KEY]) g[KEY] = { instances: new Set(), versions: new Set() };
  return g[KEY]!;
}

export function registerReactInstance(): void {
  const reg = registry();
  if (!reg) return;
  reg.instances.add(React);
  if (typeof React.version === "string") reg.versions.add(React.version);
}

export function detectDuplicateReact(): { duplicate: boolean; versions: string[] } {
  const reg = registry();
  if (!reg) return { duplicate: false, versions: [] };
  return {
    duplicate: reg.instances.size > 1 || reg.versions.size > 1,
    versions: Array.from(reg.versions),
  };
}

const NULL_DISPATCHER_RE =
  /Cannot read propert(?:y|ies) of null \(reading '(use|useContext|useState|useEffect|useMemo|useRef|useCallback|useSyncExternalStore|H)'\)|Invalid hook call|reading 'use'/i;

/** True when an error looks like a duplicate-React / null-dispatcher crash. */
export function isReactInstanceError(error: unknown): boolean {
  const message =
    error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error ?? "");
  return NULL_DISPATCHER_RE.test(message);
}

registerReactInstance();
