import { createFileRoute } from "@tanstack/react-router";
import { OnboardingProgressScreen } from "@/components/onboarding-progress-screen";

export const Route = createFileRoute("/_authenticated/profile/onboarding-progress")({
  component: OnboardingProgressRoute,
  head: () => ({
    meta: [
      { title: "Your onboarding progress — Circle" },
      { name: "description", content: "See which onboarding stages you finished and what comes next." },
      { property: "og:title", content: "Your onboarding progress — Circle" },
      { property: "og:description", content: "See which onboarding stages you finished and what comes next." },
    ],
  }),
});

function OnboardingProgressRoute() {
  return <OnboardingProgressScreen />;
}
