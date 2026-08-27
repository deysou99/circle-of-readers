import { createFileRoute } from "@tanstack/react-router";
import { BookDetailScreen } from "@/components/book-detail-screen";

export const Route = createFileRoute("/_authenticated/books/$id")({
  component: BookDetailRoute,
  head: () => ({
    meta: [
      { title: "Book Detail — Circle" },
      { name: "description", content: "Book details and your reading status." },
      { property: "og:title", content: "Book Detail — Circle" },
      { property: "og:description", content: "Book details and your reading status." },
    ],
  }),
});

function BookDetailRoute() {
  return <BookDetailScreen />;
}
