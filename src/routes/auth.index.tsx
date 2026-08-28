import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "@/components/auth-screen";

export const Route = createFileRoute("/auth/")({
  component: AuthRoute,
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
