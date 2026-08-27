import { createFileRoute } from "@tanstack/react-router";
import { ClubChatScreen } from "@/components/club-chat-screen";

export const Route = createFileRoute("/_authenticated/clubs/$id/chat")({
  component: ClubChatRoute,
  head: () => ({
    meta: [
      { title: "Circle Chat — Circle" },
      { name: "description", content: "Group discussion in a reading circle." },
      { property: "og:title", content: "Circle Chat — Circle" },
      { property: "og:description", content: "Group discussion in a reading circle." },
    ],
  }),
});

function ClubChatRoute() {
  return <ClubChatScreen />;
}
