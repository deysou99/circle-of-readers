import { createFileRoute } from "@tanstack/react-router";
import { ProfileScreen, PROFILE_TAB_IDS, type ProfileTabId } from "@/components/profile-screen";

export const Route = createFileRoute("/_authenticated/profile/")({
  component: ProfileRoute,
  validateSearch: (search: Record<string, unknown>): { tab?: ProfileTabId } => {
    const tab = String(search["tab"] ?? "");
    return PROFILE_TAB_IDS.includes(tab as ProfileTabId) ? { tab: tab as ProfileTabId } : {};
  },
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
  const { tab } = Route.useSearch();
  return <ProfileScreen initialTab={tab} />;
}
