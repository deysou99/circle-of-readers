import { createFileRoute } from "@tanstack/react-router";
import { ClubsScreen } from "@/components/clubs-screen";

export const Route = createFileRoute("/_authenticated/clubs")({
  component: ClubsRoute,
  head: () => ({
    meta: [
      { title: "My Clubs — Circle" },
      { name: "description", content: "Your reading circles and book clubs." },
      { property: "og:title", content: "My Clubs — Circle" },
      { property: "og:description", content: "Your reading circles and book clubs." },
    ],
  }),
});

function ClubsRoute() {
  return <ClubsScreen />;
}
