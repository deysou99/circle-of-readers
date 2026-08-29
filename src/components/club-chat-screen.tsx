import { useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { getClubConversation } from "@/lib/social.functions";
import { ConversationView } from "@/components/conversation-view";

export function ClubChatScreen() {
  const { id } = useParams({ from: "/_authenticated/clubs/$id/chat" });
  const resolve = useServerFn(getClubConversation);

  const { data, isLoading, error } = useQuery({
    queryKey: ["club-conversation", id],
    queryFn: () => resolve({ data: { clubId: id } }),
    retry: false,
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-paper"><p className="text-sm text-muted-foreground">Opening the circle chat…</p></div>;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
        <p className="text-sm text-ink">{(error as Error)?.message ?? "This circle chat is unavailable."}</p>
        <Link to="/clubs/$id" params={{ id }} className="flex items-center gap-1 text-sm text-primary">
          <ArrowLeft size={16} /> Back to the circle
        </Link>
      </div>
    );
  }

  return <ConversationView conversationId={data.conversationId} backTo={{ label: "Back to circle", href: `/clubs/${id}` }} />;
}
