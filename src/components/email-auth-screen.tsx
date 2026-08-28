import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const EMAIL_DRAFT_KEY = "circle.auth.email-draft";

export function EmailAuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  // Preserve the typed email across reloads and retries.
  useEffect(() => {
    const saved = sessionStorage.getItem(EMAIL_DRAFT_KEY);
    if (saved) setEmail(saved);
  }, []);
  useEffect(() => {
    if (email) sessionStorage.setItem(EMAIL_DRAFT_KEY, email);
  }, [email]);

  function fail(message: string, context: Record<string, unknown>) {
    console.error("[auth] Continue with Email failed", { mode, email, ...context });
    setFailure(message);
    toast.error(message);
  }

  async function run() {
    setLoading(true);
    setFailure(null);
    try {
      await submitCredentials();
    } catch (error) {
      fail(
        "Something went wrong reaching Circle. Check your connection and try again.",
        { error: error instanceof Error ? error.message : String(error) },
      );
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void run();
  }

  async function submitCredentials() {

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/verify-email` },
      });
      setLoading(false);
      if (error) {
        fail(error.message, { stage: "signup" });
      } else if (data.user && !data.user.email_confirmed_at) {
        toast.success("Account created. Confirm your email to continue.");
        navigate({ to: "/verify-email", replace: true });
      } else if (data.session) {
        sessionStorage.removeItem(EMAIL_DRAFT_KEY);
        navigate({ to: "/onboarding", replace: true });
      } else {
        setMode("signin");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        fail(error.message, { stage: "signin" });
      } else if (data.session) {
        if (!data.user?.email_confirmed_at && (data.user?.app_metadata?.provider ?? "email") === "email") {
          navigate({ to: "/verify-email", replace: true });
          return;
        }
        // /onboarding resumes an incomplete flow, or forwards to /home.
        sessionStorage.removeItem(EMAIL_DRAFT_KEY);
        navigate({ to: "/onboarding", replace: true });
      }
    }
  }

  return (
    <div className="phone-shell flex min-h-screen flex-col bg-paper px-6 pt-safe-top">
      <button onClick={() => navigate({ to: "/auth" })} className="mt-4 self-start text-sm text-muted-foreground hover:text-ink">
        ← Back
      </button>
      <div className="mt-8 flex flex-1 flex-col">
        <h2 className="text-2xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Welcome back to Circle." : "Join Circle and start reading together."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 rounded-xl border-input bg-paper" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 rounded-xl border-input bg-paper" />
          </div>
          <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
          {failure && (
            <div role="alert" className="rounded-xl border border-secondary/30 bg-secondary/10 p-3">
              <p className="text-xs text-ink">{failure}</p>
              <Button
                type="button"
                onClick={() => void run()}
                disabled={loading}
                variant="outline"
                className="mt-2 h-9 w-full rounded-lg border-border bg-paper text-ink hover:bg-muted"
              >
                Retry with {email || "this email"}
              </Button>
            </div>
          )}
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          {mode === "signin" ? (
            <>
              <span className="text-muted-foreground">No account?</span>
              <button onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">Already on Circle?</span>
              <button onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">
                Sign in
              </button>
            </>
          )}
        </div>
        {mode === "signin" && (
          <button onClick={() => navigate({ to: "/reset-password" })} className="mt-4 self-start text-sm text-muted-foreground hover:text-ink">
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}
