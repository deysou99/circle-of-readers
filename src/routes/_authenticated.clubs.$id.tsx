import { createFileRoute } from "@tanstack/react-router";
import { ClubDetailScreen } from "@/components/club-detail-screen";

export const Route = createFileRoute("/_authenticated/clubs/$id")({
  component: ClubDetailRoute,
  head: () => ({
    meta: [
      { title: "Circle Detail — Circle" },
      { name: "description", content: "Reading circle details and discussion." },
      { property: "og:title", content: "Circle Detail — Circle" },
      { property: "og:description", content: "Reading circle details and discussion." },
    ],
  }),
});

function ClubDetailRoute() {
  return <ClubDetailScreen />;
}
