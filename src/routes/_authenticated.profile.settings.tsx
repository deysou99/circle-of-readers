import { createFileRoute } from "@tanstack/react-router";
import { ProfileSettingsScreen } from "@/components/profile-settings-screen";

export const Route = createFileRoute("/_authenticated/profile/settings")({
  component: ProfileSettingsRoute,
  head: () => ({
    meta: [
      { title: "Settings — Circle" },
      { name: "description", content: "Manage your Circle account." },
      { property: "og:title", content: "Settings — Circle" },
      { property: "og:description", content: "Manage your Circle account." },
    ],
  }),
});

function ProfileSettingsRoute() {
  return <ProfileSettingsScreen />;
}
