import { useEffect } from "react";
import { Outlet, createFileRoute, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getOnboardingState } from "@/lib/onboarding.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    // Email sign-ups must confirm their address before entering the app.
    const provider = data.user.app_metadata?.provider;
    const emailOnly = !provider || provider === "email";
    if (emailOnly && !data.user.email_confirmed_at && !data.user.confirmed_at) {
      throw redirect({ to: "/verify-email" });
    }
    return { user: data.user };
  },

  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onOnboarding = pathname === "/onboarding";

  const fetchState = useServerFn(getOnboardingState);
  const gate = useQuery({
    queryKey: ["onboarding-state"],
    queryFn: () => fetchState({}),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const needsOnboarding = gate.data ? gate.data.stage !== "done" : false;

  useEffect(() => {
    if (needsOnboarding && !onOnboarding) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [needsOnboarding, onOnboarding, navigate]);

  if (isLoading) {
    return (
      <div className="phone-shell flex min-h-screen items-center justify-center bg-paper">
        <div className="text-sm text-muted-foreground">Loading Circle…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="phone-shell flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="text-center">
          <p className="text-ink">Please sign in to continue.</p>
        </div>
      </div>
    );
  }

  if (onOnboarding) {
    return <Outlet />;
  }

  return (
    <div className="phone-shell relative min-h-screen bg-paper pb-[88px]">
      <Outlet />
      <BottomNav />
    </div>
  );
}
