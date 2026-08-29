import { createFileRoute } from "@tanstack/react-router";
import { UserProfileScreen } from "@/components/user-profile-screen";

export const Route = createFileRoute("/_authenticated/readers/$id")({
  component: UserProfileRoute,
  validateSearch: (search: Record<string, unknown>): { tab?: string; s?: number } => {
    const tab = String(search["tab"] ?? "");
    const s = Number(search["s"]);
    return {
      ...(tab ? { tab } : {}),
      ...(Number.isFinite(s) && s > 0 ? { s: Math.min(Math.round(s), 100000) } : {}),
    };
  },

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
