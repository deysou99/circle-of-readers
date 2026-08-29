import { createFileRoute } from "@tanstack/react-router";
import { ProfileScreen, PROFILE_TAB_IDS, type ProfileTabId } from "@/components/profile-screen";

export const Route = createFileRoute("/_authenticated/profile/")({
  component: ProfileRoute,
  validateSearch: (search: Record<string, unknown>): { tab?: ProfileTabId; s?: number } => {
    const tab = String(search["tab"] ?? "");
    const s = Number(search["s"]);
    return {
      ...(PROFILE_TAB_IDS.includes(tab as ProfileTabId) ? { tab: tab as ProfileTabId } : {}),
      ...(Number.isFinite(s) && s > 0 ? { s: Math.min(Math.round(s), 100000) } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Profile — Circle" },
      { name: "description", content: "Your reader identity and reading dashboard." },
      { property: "og:title", content: "Profile — Circle" },
      { property: "og:description", content: "Your reader identity and reading dashboard." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProfileRoute() {
  const { tab, s } = Route.useSearch();
  return <ProfileScreen initialTab={tab} initialScroll={s} />;
}
