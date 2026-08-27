import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function EmailAuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created. Check your email to confirm.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        navigate({ to: "/onboarding" });
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
