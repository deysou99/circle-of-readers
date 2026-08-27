import { createFileRoute } from "@tanstack/react-router";
import { ArticleScreen } from "@/components/article-screen";

export const Route = createFileRoute("/_authenticated/journal/$slug")({
  component: ArticleRoute,
  head: () => ({
    meta: [
      { title: "Circle Journal" },
      { name: "description", content: "Editorial content from Circle." },
      { property: "og:title", content: "Circle Journal" },
      { property: "og:description", content: "Editorial content from Circle." },
    ],
  }),
});

function ArticleRoute() {
  return <ArticleScreen />;
}
