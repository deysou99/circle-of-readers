import { createFileRoute } from "@tanstack/react-router";
import { PostDetailScreen } from "@/components/post-detail-screen";

export const Route = createFileRoute("/_authenticated/posts/$id")({
  component: PostDetailRoute,
  head: () => ({
    meta: [
      { title: "Post — Circle" },
      { name: "description", content: "A post from the Circle community." },
      { property: "og:title", content: "Post — Circle" },
      { property: "og:description", content: "A post from the Circle community." },
    ],
  }),
});

function PostDetailRoute() {
  return <PostDetailScreen />;
}
