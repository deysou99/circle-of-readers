import { createFileRoute } from "@tanstack/react-router";
import { SearchScreen } from "@/components/search-screen";

export const Route = createFileRoute("/_authenticated/search")({
  component: SearchRoute,
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
  return <SearchScreen />;
}
