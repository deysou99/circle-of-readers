import { createFileRoute } from "@tanstack/react-router";
import { OnboardingScreen } from "@/components/onboarding-screen";

export const Route = createFileRoute("/_authenticated/profile/reader-answers")({
  component: ReaderAnswersRoute,
  head: () => ({
    meta: [
      { title: "Edit reader answers — Circle" },
      { name: "description", content: "Revisit your reading questions and regenerate your reader personality." },
      { property: "og:title", content: "Edit reader answers — Circle" },
      { property: "og:description", content: "Revisit your reading questions and regenerate your reader personality." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ReaderAnswersRoute() {
  return <OnboardingScreen editMode />;
}
