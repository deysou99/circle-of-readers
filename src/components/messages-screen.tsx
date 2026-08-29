import { Link } from "@tanstack/react-router";
import { ChevronRight, CheckCheck, MessagesSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getConversations } from "@/lib/social.functions";

function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function MessagesScreen() {
  const fetchConversations = useServerFn(getConversations);
  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchConversations(),
    refetchInterval: 15000,
  });

  const conversations = data ?? [];

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Messages</h1>
      </header>

      <main className="px-4 pt-2">
        {isLoading && <p className="pt-8 text-center text-sm text-muted-foreground">Loading conversations…</p>}

        {!isLoading && conversations.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-parchment p-8 text-center">
            <MessagesSquare className="mx-auto text-primary" size={28} />
            <p className="mt-3 text-sm font-medium text-ink">No conversations yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Open a reader's profile and tap Message, or join a circle to use its group chat.</p>
            <Link to="/search" className="mt-4 inline-block text-sm font-medium text-primary">Find readers</Link>
          </div>
        )}

        {conversations.map((conv) => {
          const other = conv.others[0];
          const name = conv.club?.name ?? conv.title ?? other?.display_name ?? other?.username ?? "Conversation";
          return (
            <Link
              key={conv.id}
              to="/messages/$id"
              params={{ id: conv.id }}
              className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
            >
              <div className="relative">
                <Avatar className={`h-12 w-12 ${conv.kind !== "direct" ? "rounded-xl" : ""}`}>
                  <AvatarImage src={(conv.club?.avatar_url ?? other?.avatar_url) ?? undefined} />
                  <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                {conv.unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                    {conv.unread}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{name}</p>
                <p className={`flex items-center gap-1 truncate text-sm ${conv.unread ? "font-medium text-ink" : "text-muted-foreground"}`}>
                  {conv.lastMessage?.mine && <CheckCheck size={13} className="shrink-0 text-primary" />}
                  <span className="truncate">{conv.lastMessage?.content ?? "No messages yet"}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">{timeAgo(conv.lastMessage?.createdAt ?? conv.lastMessageAt)}</span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </main>
    </div>
  );
}
