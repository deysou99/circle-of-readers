import { createFileRoute } from "@tanstack/react-router";
import { ProfileCircleScreen } from "@/components/profile-circle-screen";
import type { CircleFilter, CircleSort } from "@/lib/profile-tabs.functions";

const SORTS: CircleSort[] = ["alphabetical", "newest", "mutual"];
const FILTERS: CircleFilter[] = ["all", "mutual", "not_mutual"];

export const Route = createFileRoute("/_authenticated/profile/circle")({
  component: ProfileCircleRoute,
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: "followers" | "following"; q?: string; sort?: CircleSort; filter?: CircleFilter; s?: number } => {
    const tab = String(search["tab"] ?? "");
    const q = typeof search["q"] === "string" ? search["q"].slice(0, 60) : "";
    const sort = String(search["sort"] ?? "") as CircleSort;
    const filter = String(search["filter"] ?? "") as CircleFilter;
    const s = Number(search["s"]);
    return {
      ...(tab === "following" || tab === "followers" ? { tab } : {}),
      ...(q ? { q } : {}),
      ...(SORTS.includes(sort) ? { sort } : {}),
      ...(FILTERS.includes(filter) ? { filter } : {}),
      ...(Number.isFinite(s) && s > 0 ? { s: Math.min(Math.round(s), 100000) } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "My Circle — Circle" },
      { name: "description", content: "The readers who follow you and the readers you follow on Circle." },
      { property: "og:title", content: "My Circle — Circle" },
      { property: "og:description", content: "The readers who follow you and the readers you follow on Circle." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProfileCircleRoute() {
  const { tab, q, sort, filter, s } = Route.useSearch();
  return (
    <ProfileCircleScreen
      initialTab={tab}
      initialQuery={q}
      initialSort={sort}
      initialFilter={filter}
      initialScroll={s}
    />
  );
}
