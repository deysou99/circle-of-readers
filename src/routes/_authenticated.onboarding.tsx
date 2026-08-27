import { createFileRoute } from "@tanstack/react-router";
import { OnboardingScreen } from "@/components/onboarding-screen";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingRoute,
  head: () => ({
    meta: [
      { title: "Welcome to Circle" },
      { name: "description", content: "Complete your reader profile." },
      { property: "og:title", content: "Welcome to Circle" },
      { property: "og:description", content: "Complete your reader profile." },
    ],
  }),
});

function OnboardingRoute() {
  return <OnboardingScreen />;
}
