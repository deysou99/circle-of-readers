import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Reset link sent if that email exists.");
    }
  }

  return (
    <div className="phone-shell flex min-h-screen flex-col bg-paper px-6 pt-safe-top">
      <button onClick={() => navigate({ to: "/auth/email" })} className="mt-4 self-start text-sm text-muted-foreground hover:text-ink">
        ← Back
      </button>
      <div className="mt-8 flex flex-1 flex-col">
        <h2 className="text-2xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
          Reset password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <div className="mt-6 rounded-2xl border border-border bg-parchment p-5 text-sm text-ink">
            Check your inbox for a reset link. If you don't see it, check your spam folder.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 rounded-xl border-input bg-paper" />
            </div>
            <Button type="submit" className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              Send reset link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
