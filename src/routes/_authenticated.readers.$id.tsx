import { createFileRoute } from "@tanstack/react-router";
import { UserProfileScreen } from "@/components/user-profile-screen";

export const Route = createFileRoute("/_authenticated/readers/$id")({
  component: UserProfileRoute,
  head: () => ({
    meta: [
      { title: "Reader Profile — Circle" },
      { name: "description", content: "Another reader's profile on Circle." },
      { property: "og:title", content: "Reader Profile — Circle" },
      { property: "og:description", content: "Another reader's profile on Circle." },
    ],
  }),
});

function UserProfileRoute() {
  return <UserProfileScreen />;
}
