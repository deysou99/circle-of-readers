import { createFileRoute } from "@tanstack/react-router";
import { SearchScreen } from "@/components/search-screen";

type SearchParams = { club?: string; clubName?: string };

export const Route = createFileRoute("/_authenticated/search")({
  component: SearchRoute,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    club: typeof search['club'] === "string" ? (search['club'] as string) : undefined,
    clubName: typeof search['clubName'] === "string" ? (search['clubName'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Find Readers & Circles — Circle" },
      { name: "description", content: "Search for friends, fellow readers and reading circles on Circle." },
      { property: "og:title", content: "Find Readers & Circles — Circle" },
      { property: "og:description", content: "Search for friends, fellow readers and reading circles on Circle." },
    ],
  }),
});

function SearchRoute() {
  const { club, clubName } = Route.useSearch();
  return <SearchScreen clubId={club} clubName={clubName} />;
}
