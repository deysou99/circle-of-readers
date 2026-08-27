import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordScreen } from "@/components/reset-password-screen";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordRoute,
  head: () => ({
    meta: [
      { title: "Reset Password" },
      { name: "description", content: "Set a new password for Circle." },
      { property: "og:title", content: "Reset Password" },
      { property: "og:description", content: "Set a new password for Circle." },
    ],
  }),
});

function ResetPasswordRoute() {
  return <ResetPasswordScreen />;
}
