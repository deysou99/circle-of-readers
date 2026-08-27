import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/home-screen";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomeRoute,
  head: () => ({
    meta: [
      { title: "Home — Circle" },
      { name: "description", content: "Your reading community feed." },
      { property: "og:title", content: "Home — Circle" },
      { property: "og:description", content: "Your reading community feed." },
    ],
  }),
});

function HomeRoute() {
  return <HomeScreen />;
}
