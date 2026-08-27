import { createFileRoute } from "@tanstack/react-router";
import { CreatePostScreen } from "@/components/create-post-screen";

export const Route = createFileRoute("/_authenticated/create-post")({
  component: CreatePostRoute,
  head: () => ({
    meta: [
      { title: "Create Post — Circle" },
      { name: "description", content: "Share what you're reading." },
      { property: "og:title", content: "Create Post — Circle" },
      { property: "og:description", content: "Share what you're reading." },
    ],
  }),
});

function CreatePostRoute() {
  return <CreatePostScreen />;
}
