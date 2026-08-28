import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  | { kind: "error"; message: string }
  | { kind: "success" };

function GoodreadsCallback() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const denied = params.get("authorize") === "0" || params.get("error");
    if (denied) {
      setState({
        kind: "error",
        message: "Goodreads authorization was cancelled. You can try again or paste your profile link instead.",
      });
      return;
    }
    if (params.get("authorize") === "1") {
      setState({ kind: "success" });
      const t = setTimeout(() => navigate({ to: "/onboarding" }), 1200);
      return () => clearTimeout(t);
    }
    setState({
      kind: "error",
      message:
        "We didn't get a valid response from Goodreads. Goodreads no longer issues API access to new apps — link your public profile instead.",
    });
    return;
  }, [navigate]);

  return (
    <div className="phone-shell flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      {state.kind === "loading" && (
        <>
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Finishing your Goodreads connection…</p>
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
          <Button
            onClick={() => navigate({ to: "/onboarding" })}
            className="mt-6 h-12 w-full max-w-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Back to Circle
          </Button>
        </>
      )}
    </div>
  );
}
