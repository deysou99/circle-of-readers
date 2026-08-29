import { useParams } from "@tanstack/react-router";
import { ConversationView } from "@/components/conversation-view";

export function ChatScreen() {
  const { id } = useParams({ from: "/_authenticated/messages/$id" });
  return <ConversationView conversationId={id} backTo={{ label: "Back to messages", href: "/messages" }} />;
}
