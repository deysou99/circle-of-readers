import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";

export function VerifyEmailScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) {
        navigate({ to: "/auth" });
        return;
      }
      setEmail(user.email ?? "");
      if (user.email_confirmed_at) navigate({ to: "/onboarding" });
    });
  }, [navigate]);

  // Poll while the user confirms in another tab / on another device.
  useEffect(() => {
    const id = setInterval(async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email_confirmed_at) {
        clearInterval(id);
        toast.success("Email verified");
        navigate({ to: "/onboarding" });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function resend() {
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    setSending(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Verification email sent");
      setCooldown(45);
    }
  }

  async function checkNow() {
    setChecking(true);
    const { data } = await supabase.auth.getUser();
    setChecking(false);
    if (data.user?.email_confirmed_at) navigate({ to: "/onboarding" });
    else toast.error("Not verified yet — open the link in your inbox.");
  }

  async function useAnotherAccount() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="phone-shell mx-auto flex min-h-screen max-w-md flex-col bg-paper px-7 pt-safe-top">
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-6 w-6 text-primary" />
        </div>
        <h1
          className="mt-6 text-[30px] leading-tight font-semibold text-ink"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Confirm your email
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          We sent a verification link to <span className="font-medium text-ink">{email || "your inbox"}</span>. Open it
          to unlock Circle — we'll take you in automatically once it's confirmed.
        </p>
        <div className="mt-8 space-y-3">
          <Button
            onClick={checkNow}
            disabled={checking}
            className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            I've verified — continue
          </Button>
          <Button
            onClick={resend}
            disabled={sending || cooldown > 0}
            variant="outline"
            className="h-12 w-full rounded-xl"
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
          </Button>
        </div>
      </div>
      <div className="pb-10 safe-bottom">
        <button onClick={useAnotherAccount} className="text-sm text-muted-foreground hover:text-ink">
          Use a different account
        </button>
      </div>
    </div>
  );
}
