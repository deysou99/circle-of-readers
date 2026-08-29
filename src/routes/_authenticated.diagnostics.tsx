import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { version as reactVersion } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectDuplicateReact } from "@/lib/react-integrity";
import { clearCrashes, readCrashes, type CrashRecord } from "@/lib/crash-reporting";
import routerPkg from "@tanstack/react-router/package.json" with { type: "json" };
import queryPkg from "@tanstack/react-query/package.json" with { type: "json" };

export const Route = createFileRoute("/_authenticated/diagnostics")({
  component: DiagnosticsRoute,
  head: () => ({
    meta: [
      { title: "Diagnostics — Circle" },
      { name: "description", content: "Check React and router versions and confirm there are no dependency mismatches." },
      { property: "og:title", content: "Diagnostics — Circle" },
      { property: "og:description", content: "Check React and router versions and confirm there are no dependency mismatches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-right text-sm font-medium ${warn ? "text-secondary" : "text-ink"}`}>{value}</span>
    </div>
  );
}

function DiagnosticsRoute() {
  const [env, setEnv] = useState<{ ua: string; url: string; hydrated: boolean; duplicate: boolean; detail: string }>({
    ua: "—",
    url: "—",
    hydrated: false,
    duplicate: false,
    detail: "checking…",
  });

  const [crashes, setCrashes] = useState<CrashRecord[]>([]);

  useEffect(() => {
    setCrashes(readCrashes());
    const check = detectDuplicateReact();
    setEnv({
      ua: navigator.userAgent,
      url: window.location.href,
      hydrated: true,
      duplicate: check.duplicate,
      detail: check.duplicate ? "Multiple React copies detected" : "Single React instance",
    });
  }, []);

  return (
    <div className="min-h-screen bg-paper pb-24 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/profile/settings" aria-label="Back to settings"><ArrowLeft size={22} className="text-ink" /></Link>
        <h1 className="flex-1 text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Diagnostics</h1>
        <Button variant="ghost" size="icon" onClick={() => window.location.reload()} aria-label="Reload diagnostics">
          <RefreshCw size={18} className="text-ink" />
        </Button>
      </header>

      <p className="px-4 pt-4 text-sm text-muted-foreground">
        Use this when the app crashes unexpectedly — mismatched library versions are the usual cause.
      </p>

      <section className="mx-4 mt-4 rounded-2xl border border-border bg-parchment">
        <Row label="React" value={reactVersion} />
        <Row label="TanStack Router" value={routerPkg.version} />
        <Row label="TanStack Query" value={queryPkg.version} />
        <Row label="React instances" value={env.detail} warn={env.duplicate} />
        <Row label="Hydrated" value={env.hydrated ? "Yes" : "No"} warn={!env.hydrated} />
      </section>

      <section className="mx-4 mt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent crashes</p>
          {crashes.length > 0 && (
            <button
              onClick={() => {
                clearCrashes();
                setCrashes([]);
              }}
              className="text-xs text-secondary"
            >
              Clear
            </button>
          )}
        </div>
        {crashes.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-border bg-parchment p-4 text-sm text-muted-foreground">
            No crashes recorded on this device.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {crashes.map((c, i) => (
              <li key={`${c.at}-${i}`} className="rounded-2xl border border-border bg-parchment p-3">
                <p className="text-sm font-medium text-ink">{c.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(c.at).toLocaleString()} · {c.kind} · {c.route}
                </p>
                {c.stack && (
                  <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-paper p-2 text-[10px] leading-snug text-muted-foreground">
                    {c.stack}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-4 mt-4 rounded-2xl border border-border bg-parchment">
        <Row label="Current URL" value={env.url} />
        <Row label="Browser" value={env.ua} />
      </section>
    </div>
  );
}
