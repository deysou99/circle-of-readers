import { createFileRoute, redirect } from "@tanstack/react-router";
import { SplashScreen } from "@/components/splash-screen";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  component: SplashRoute,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      throw redirect({ to: "/home" });
    }
  },
});

function SplashRoute() {
  return <SplashScreen />;
}
