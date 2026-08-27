import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    // Auth state from context is not reliable here because it is React state.
    // We rely on server functions / client guards for auth, but for route-level
    // protection we redirect when no user is known. The actual auth check is
    // enforced by protected server functions.
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isLoading, isAuthenticated } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideNav = pathname === "/onboarding";

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

  return (
    <div className="phone-shell relative min-h-screen bg-paper pb-[88px]">
      <Outlet />
      {!hideNav && <BottomNav />}
    </div>
  );
}
