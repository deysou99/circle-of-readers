import { version as reactVersion } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { detectDuplicateReact } from "@/lib/react-integrity";

export type CrashRecord = {
  at: string;
  message: string;
  stack?: string;
  route: string;
  kind: "error" | "unhandledrejection" | "boundary";
  env: { react: string; duplicateReact: boolean; userAgent: string; viewport: string };
};

const STORAGE_KEY = "circle.diagnostics.crashes";
const MAX_RECORDS = 20;
let installed = false;

function environment() {
  return {
    react: reactVersion,
    duplicateReact: detectDuplicateReact().duplicate,
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}

export function recordCrash(error: unknown, kind: CrashRecord["kind"]) {
  if (typeof window === "undefined") return;
  const err = error instanceof Error ? error : new Error(String(error));
  const record: CrashRecord = {
    at: new Date().toISOString(),
    message: err.message,
    ...(err.stack ? { stack: err.stack.slice(0, 4000) } : {}),
    route: window.location.pathname + window.location.search,
    kind,
    env: environment(),
  };
  try {
    const existing = readCrashes();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...existing].slice(0, MAX_RECORDS)));
  } catch {
    /* storage may be full or blocked */
  }
  reportLovableError(err, { kind, ...record.env });
}

export function readCrashes(): CrashRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CrashRecord[]) : [];
  } catch {
    return [];
  }
}

export function clearCrashes() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Captures uncaught errors and rejections so crashes can be reviewed later. */
export function installCrashReporting() {
  if (typeof window === "undefined" || installed) return;
  installed = true;
  window.addEventListener("error", (event) => {
    recordCrash(event.error ?? event.message, "error");
  });
  window.addEventListener("unhandledrejection", (event) => {
    recordCrash(event.reason, "unhandledrejection");
  });
}
