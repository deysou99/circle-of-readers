import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthScreen } from "@/components/auth-screen";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthRoute,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      throw redirect({ to: "/home" });
    }
  },
  head: () => ({
    meta: [
      { title: "Welcome to Circle" },
      { name: "description", content: "Sign in to Circle by MyFlip." },
      { property: "og:title", content: "Welcome to Circle" },
      { property: "og:description", content: "Sign in to Circle by MyFlip." },
    ],
  }),
});

function AuthRoute() {
  return <AuthScreen />;
}
