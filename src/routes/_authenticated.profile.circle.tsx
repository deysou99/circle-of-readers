import { createFileRoute } from "@tanstack/react-router";
import { ProfileCircleScreen } from "@/components/profile-circle-screen";
import type { CircleFilter, CircleSort } from "@/lib/profile-tabs.functions";

const SORTS: CircleSort[] = ["alphabetical", "newest", "mutual"];
const FILTERS: CircleFilter[] = ["all", "mutual", "not_mutual"];

export const Route = createFileRoute("/_authenticated/profile/circle")({
  component: ProfileCircleRoute,
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    tab?: "followers" | "following";
    q?: string;
    sort?: CircleSort;
    filter?: CircleFilter;
    s?: number;
    n?: number;
  } => {
    const tab = String(search["tab"] ?? "");
    const q = typeof search["q"] === "string" ? search["q"].slice(0, 60) : "";
    const sort = String(search["sort"] ?? "") as CircleSort;
    const filter = String(search["filter"] ?? "") as CircleFilter;
    const s = Number(search["s"]);
    const n = Number(search["n"]);
    return {
      ...(tab === "following" || tab === "followers" ? { tab } : {}),
      ...(q ? { q } : {}),
      ...(SORTS.includes(sort) ? { sort } : {}),
      ...(FILTERS.includes(filter) ? { filter } : {}),
      ...(Number.isFinite(s) && s > 0 ? { s: Math.min(Math.round(s), 100000) } : {}),
      ...(Number.isFinite(n) && n >= 0 ? { n: Math.min(Math.round(n), 1000000) } : {}),
    };
  },
  head: ({ match }) => {
    const search = match.search as { tab?: string; q?: string; n?: number };
    const tab = search.tab === "following" ? "following" : "followers";
    const query = search.q ?? "";
    const matches = typeof search.n === "number" ? search.n : null;
    const title = query ? `“${query}” in my ${tab} — Circle` : `My ${tab} — Circle`;
    const description = query
      ? `${matches ?? 0} ${matches === 1 ? "match" : "matches"} for “${query}” among my ${tab} on Circle.`
      : matches !== null
        ? `${matches} readers in my ${tab} on Circle.`
        : `The readers who follow me and the readers I follow on Circle.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
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
