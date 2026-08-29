import { createFileRoute } from "@tanstack/react-router";
import { ProfileCircleScreen } from "@/components/profile-circle-screen";

export const Route = createFileRoute("/_authenticated/profile/circle")({
  component: ProfileCircleRoute,
  validateSearch: (search: Record<string, unknown>): { tab?: "followers" | "following"; q?: string } => {
    const tab = String(search["tab"] ?? "");
    const q = typeof search["q"] === "string" ? search["q"].slice(0, 60) : "";
    return {
      ...(tab === "following" || tab === "followers" ? { tab } : {}),
      ...(q ? { q } : {}),
    };
  },
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
  const { tab, q } = Route.useSearch();
  return <ProfileCircleScreen initialTab={tab} initialQuery={q} />;
}
