import { createFileRoute } from "@tanstack/react-router";
import { VerifyEmailScreen } from "@/components/verify-email-screen";

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  component: VerifyEmailRoute,
  head: () => ({
    meta: [
      { title: "Confirm your email — Circle" },
      { name: "description", content: "Verify your email address to start reading with Circle." },
      { property: "og:title", content: "Confirm your email — Circle" },
      { property: "og:description", content: "Verify your email address to start reading with Circle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function VerifyEmailRoute() {
  return <VerifyEmailScreen />;
}
