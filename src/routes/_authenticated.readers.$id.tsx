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

  head: ({ match }) => {
    const search = match.search as { tab?: string };
    const tab = search.tab ? search.tab.replace(/[^a-z]/gi, "").slice(0, 20) : "";
    const title = tab ? `Reader Profile · ${tab} — Circle` : "Reader Profile — Circle";
    const description = tab
      ? `See this reader's ${tab} on Circle.`
      : "Another reader's profile on Circle.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
});

function UserProfileRoute() {
  return <UserProfileScreen />;
}
