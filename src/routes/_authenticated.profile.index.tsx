import { createFileRoute } from "@tanstack/react-router";
import { ProfileScreen } from "@/components/profile-screen";

export const Route = createFileRoute("/_authenticated/profile/")({
  component: ProfileRoute,
  head: () => ({
    meta: [
      { title: "Profile — Circle" },
      { name: "description", content: "Your reader identity and reading dashboard." },
      { property: "og:title", content: "Profile — Circle" },
      { property: "og:description", content: "Your reader identity and reading dashboard." },
    ],
  }),
});

function ProfileRoute() {
  return <ProfileScreen />;
}
