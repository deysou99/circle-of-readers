import { createFileRoute } from "@tanstack/react-router";
import { BooksScreen } from "@/components/books-screen";

export const Route = createFileRoute("/_authenticated/books")({
  component: BooksRoute,
  head: () => ({
    meta: [
      { title: "My Books — Circle" },
      { name: "description", content: "Your personal reading collection." },
      { property: "og:title", content: "My Books — Circle" },
      { property: "og:description", content: "Your personal reading collection." },
    ],
  }),
});

function BooksRoute() {
  return <BooksScreen />;
}
