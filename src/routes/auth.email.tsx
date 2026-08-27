import { createFileRoute, redirect } from "@tanstack/react-router";
import { EmailAuthScreen } from "@/components/email-auth-screen";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/email")({
  component: EmailAuthRoute,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      throw redirect({ to: "/home" });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in with Email" },
      { name: "description", content: "Sign in or create your Circle account." },
      { property: "og:title", content: "Sign in with Email" },
      { property: "og:description", content: "Sign in or create your Circle account." },
    ],
  }),
});

function EmailAuthRoute() {
  return <EmailAuthScreen />;
}
