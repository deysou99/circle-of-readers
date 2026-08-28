import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, AlertCircle, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { verifyGoodreadsCallback } from "@/lib/onboarding.functions";
import { GOODREADS_NONCE_KEY } from "@/components/goodreads-panel";

export const Route = createFileRoute("/goodreads/callback")({
  component: GoodreadsCallback,
  head: () => ({
    meta: [
      { title: "Connecting Goodreads — Circle" },
      { name: "description", content: "Finishing your Goodreads connection for your Circle reader profile." },
      { property: "og:title", content: "Connecting Goodreads — Circle" },
      { property: "og:description", content: "Finishing your Goodreads connection for your Circle reader profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string; steps: string[] }
  | { kind: "success" };

const GENERIC_STEPS = [
  "Head back to Circle and tap Connect Goodreads again.",
  "Make sure your Goodreads profile and shelves are set to public.",
  "If it keeps failing, paste your Goodreads profile link manually — it works the same way.",
];

const DENIED_STEPS = [
  "Tap Try again below to restart the connection.",
  "On the Goodreads screen, choose Allow so Circle can read your public shelves.",
  "Prefer not to authorize? Paste your public profile link in Circle instead.",
];

function GoodreadsCallback() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const verify = useServerFn(verifyGoodreadsCallback);

  const run = useCallback(async () => {
    setState({ kind: "loading" });
    const params = new URLSearchParams(window.location.search);

    let nonce: string | null = null;
    try {
      nonce = window.sessionStorage.getItem(GOODREADS_NONCE_KEY);
    } catch {
      nonce = null;
    }

    // Always validate state/nonce first — even on a denial — so a forged
    // callback can never be mistaken for a real one.
    let check: { ok: boolean; message: string | null };
    try {
      check = await verify({ data: { state: params.get("state"), nonce } });
    } catch {
      check = { ok: false, message: "We couldn't verify this Goodreads response. Please start the connection again." };
    }

    try {
      window.sessionStorage.removeItem(GOODREADS_NONCE_KEY);
    } catch {
      /* ignore */
    }

    if (!check.ok) {
      setState({
        kind: "error",
        message: check.message ?? "This Goodreads response failed our security checks.",
        steps: GENERIC_STEPS,
      });
      return;
    }

    if (params.get("authorize") === "0" || params.get("error")) {
      setState({
        kind: "error",
        message: "Goodreads authorization was cancelled, so nothing was connected.",
        steps: DENIED_STEPS,
      });
      return;
    }

    if (params.get("authorize") === "1") {
      setState({ kind: "success" });
      return;
    }

    setState({
      kind: "error",
      message:
        "We didn't get a valid response from Goodreads. Goodreads no longer issues API access to new apps — link your public profile instead.",
      steps: GENERIC_STEPS,
    });
  }, [verify]);

  useEffect(() => {
    void run();
  }, [run, attempt]);

  useEffect(() => {
    if (state.kind !== "success") return;
    const t = setTimeout(() => navigate({ to: "/onboarding" }), 1200);
    return () => clearTimeout(t);
  }, [state.kind, navigate]);

  return (
    <div className="phone-shell flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      {state.kind === "loading" && (
        <>
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Verifying your Goodreads connection…</p>
        </>
      )}

      {state.kind === "success" && (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-forest">
            <Check size={22} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
            Goodreads connected
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Taking you back to Circle…</p>
        </>
      )}

      {state.kind === "error" && (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <AlertCircle size={22} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
            Couldn't connect Goodreads
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{state.message}</p>

          <div className="mt-5 w-full max-w-xs rounded-2xl border border-border bg-parchment p-4 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              What to do next
            </p>
            <ol className="mt-2 space-y-2">
              {state.steps.map((step, i) => (
                <li key={step} className="flex gap-2 text-xs leading-relaxed text-ink">
                  <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink/10 text-[10px] font-semibold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <Button
            onClick={() => setAttempt((a) => a + 1)}
            className="mt-5 h-12 w-full max-w-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/onboarding" })}
            className="mt-2 h-11 w-full max-w-xs rounded-xl text-muted-foreground"
          >
            Back to Circle
          </Button>
        </>
      )}
    </div>
  );
}
