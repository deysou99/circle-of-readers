import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getConversation, getNotificationPreferences, markConversationRead, sendMessage } from "@/lib/social.functions";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ConversationView({
  conversationId,
  backTo,
}: {
  conversationId: string;
  backTo: { label: string; href: string };
}) {
  const fetchConversation = useServerFn(getConversation);
  const send = useServerFn(sendMessage);
  const markRead = useServerFn(markConversationRead);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const fetchPrefs = useServerFn(getNotificationPreferences);
  const { data: prefs } = useQuery({ queryKey: ["notification-preferences"], queryFn: () => fetchPrefs(), staleTime: 60_000 });
  const seenMode = ((prefs as { seen_indicator_mode?: string } | null | undefined)?.seen_indicator_mode ?? "full") as
    | "full"
    | "initials"
    | "hidden";

  const { data, isLoading } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversation({ data: { conversationId } }),
    refetchInterval: 8000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => send({ data: { conversationId, content } }),
    onSuccess: () => {
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (!data) return;
    // "Hidden" keeps read receipts private: we never publish a read marker.
    if (seenMode === "hidden") return;
    markRead({ data: { conversationId } })
      .then(() => queryClient.invalidateQueries({ queryKey: ["conversations"] }))
      .catch(() => undefined);
  }, [data, conversationId, markRead, queryClient, seenMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-paper"><p className="text-sm text-muted-foreground">Loading conversation…</p></div>;
  }
  if (!data) {
    return <div className="flex min-h-screen items-center justify-center bg-paper"><p className="text-sm text-muted-foreground">Conversation not found.</p></div>;
  }

  const isGroup = data.conversation.kind !== "direct";
  const other = data.others[0];
  const heading = data.conversation.club?.name ?? data.conversation.title ?? other?.display_name ?? other?.username ?? "Conversation";
  const subtitle = isGroup ? `${data.participantCount} in this chat` : other ? `@${other.username}` : "";

  return (
    <div className="flex min-h-screen flex-col bg-paper pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to={backTo.href} aria-label={backTo.label}>
          <ArrowLeft size={22} className="text-ink" />
        </Link>
        <Avatar className={`h-9 w-9 ${isGroup ? "rounded-xl" : ""}`}>
          <AvatarImage src={(data.conversation.club?.avatar_url ?? other?.avatar_url) ?? undefined} />
          <AvatarFallback>{heading.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{heading}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {data.messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">No messages yet — say hello.</p>
        )}
        {data.messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              {!isMe && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.sender?.avatar_url ?? undefined} />
                  <AvatarFallback>{(msg.sender?.display_name ?? msg.sender?.username ?? "R").slice(0, 2)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-parchment text-ink"}`}>
                {!isMe && isGroup && msg.sender && (
                  <p className="mb-0.5 text-[11px] font-medium text-primary">{msg.sender.display_name ?? msg.sender.username}</p>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  <span>{timeLabel(msg.created_at)}</span>
                  {isMe && seenMode !== "hidden" && (
                    msg.seenCount > 0 ? (
                      <span className="flex items-center gap-0.5" title={`Seen by ${msg.seenBy.map((s) => s?.display_name ?? s?.username).join(", ")}`}>
                        <CheckCheck size={13} />
                        {seenMode === "initials" ? (
                          <span>
                            {msg.seenBy
                              .map((s) => (s?.display_name ?? s?.username ?? "R").slice(0, 1).toUpperCase())
                              .slice(0, 3)
                              .join("")}
                          </span>
                        ) : isGroup ? (
                          <span>Seen {msg.seenCount}</span>
                        ) : (
                          <span>Seen</span>
                        )}
                      </span>
                    ) : (
                      <Check size={13} aria-label="Sent" />
                    )
                  )}
                  {isMe && seenMode === "hidden" && <Check size={13} aria-label="Sent" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 border-t border-border bg-paper p-3 safe-bottom">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && input.trim() && sendMutation.mutate(input)}
            placeholder={isGroup ? "Message the circle…" : "Type a message…"}
            className="h-11 flex-1 rounded-full border-input bg-paper px-4"
          />
          <Button
            onClick={() => input.trim() && sendMutation.mutate(input)}
            disabled={sendMutation.isPending || !input.trim()}
            size="icon"
            className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
