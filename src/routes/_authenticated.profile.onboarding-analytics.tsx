import { createFileRoute } from "@tanstack/react-router";
import { OnboardingAnalyticsScreen } from "@/components/onboarding-analytics-screen";

export const Route = createFileRoute("/_authenticated/profile/onboarding-analytics")({
  component: OnboardingAnalyticsRoute,
  head: () => ({
    meta: [
      { title: "Onboarding funnel — Circle" },
      { name: "description", content: "Stage completion rates, drop-offs and resume points for your onboarding." },
      { property: "og:title", content: "Onboarding funnel — Circle" },
      { property: "og:description", content: "Stage completion rates, drop-offs and resume points for your onboarding." },
    ],
  }),
});

function OnboardingAnalyticsRoute() {
  return <OnboardingAnalyticsScreen />;
}
