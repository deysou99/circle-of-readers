import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export function AuthScreen() {
  const navigate = useNavigate();

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) {
      toast.error(result.error.message ?? "Could not sign in with Google");
      return;
    }
    if (!result?.redirected) {
      // /onboarding sends already-onboarded members straight to /home.
      navigate({ to: "/onboarding" });
    }
  }

  return (
    <div className="phone-shell flex min-h-screen flex-col bg-paper px-6 pt-safe-top">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
          Circle
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
          A community for people who love to read, share, and discover books together.
        </p>
      </div>

      <div className="mb-8 space-y-3 safe-bottom">
        <Button onClick={handleGoogle} variant="outline" className="h-12 w-full gap-2 rounded-xl border-border bg-paper text-ink hover:bg-muted">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>
        <Button onClick={() => navigate({ to: "/auth/email" })} className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
          Continue with Email
        </Button>
        <p className="pt-2 text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
