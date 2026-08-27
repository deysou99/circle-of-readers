import { createFileRoute } from "@tanstack/react-router";
import { ChatScreen } from "@/components/chat-screen";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  component: ChatRoute,
  head: () => ({
    meta: [
      { title: "Chat — Circle" },
      { name: "description", content: "Conversation with another reader." },
      { property: "og:title", content: "Chat — Circle" },
      { property: "og:description", content: "Conversation with another reader." },
    ],
  }),
});

function ChatRoute() {
  return <ChatScreen />;
}
