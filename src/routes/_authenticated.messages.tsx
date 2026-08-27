import { createFileRoute } from "@tanstack/react-router";
import { MessagesScreen } from "@/components/messages-screen";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesRoute,
  head: () => ({
    meta: [
      { title: "Messages — Circle" },
      { name: "description", content: "Direct messages with other readers." },
      { property: "og:title", content: "Messages — Circle" },
      { property: "og:description", content: "Direct messages with other readers." },
    ],
  }),
});

function MessagesRoute() {
  return <MessagesScreen />;
}
