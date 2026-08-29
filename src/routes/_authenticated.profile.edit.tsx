import { createFileRoute } from "@tanstack/react-router";
import { ProfileEditScreen } from "@/components/profile-edit-screen";

export const Route = createFileRoute("/_authenticated/profile/edit")({
  component: ProfileEditRoute,
  head: () => ({
    meta: [
      { title: "Edit Profile — Circle" },
      { name: "description", content: "Update your reader name, bio, favourite genres and yearly reading goal." },
      { property: "og:title", content: "Edit Profile — Circle" },
      { property: "og:description", content: "Update your reader name, bio, favourite genres and yearly reading goal." },
    ],
  }),
});

function ProfileEditRoute() {
  return <ProfileEditScreen />;
}
