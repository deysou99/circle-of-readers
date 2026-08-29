import { createFileRoute } from "@tanstack/react-router";
import { ProfileCircleScreen } from "@/components/profile-circle-screen";

export const Route = createFileRoute("/_authenticated/profile/circle")({
  component: ProfileCircleRoute,
  head: () => ({
    meta: [
      { title: "My Circle — Circle" },
      { name: "description", content: "The readers who follow you and the readers you follow on Circle." },
      { property: "og:title", content: "My Circle — Circle" },
      { property: "og:description", content: "The readers who follow you and the readers you follow on Circle." },
    ],
  }),
});

function ProfileCircleRoute() {
  return <ProfileCircleScreen />;
}
