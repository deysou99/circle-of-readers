import { createFileRoute } from "@tanstack/react-router";
import { DiscoverScreen } from "@/components/discover-screen";

export const Route = createFileRoute("/_authenticated/discover")({
  component: DiscoverRoute,
  head: () => ({
    meta: [
      { title: "Discover — Circle" },
      { name: "description", content: "Discover books, clubs, readers and stories." },
      { property: "og:title", content: "Discover — Circle" },
      { property: "og:description", content: "Discover books, clubs, readers and stories." },
    ],
  }),
});

function DiscoverRoute() {
  return <DiscoverScreen />;
}
