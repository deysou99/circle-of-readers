import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CONVERSATIONS } from "@/lib/seed";

export function MessagesScreen() {
  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Messages</h1>
      </header>

      <main className="px-4 pt-2">
        {CONVERSATIONS.map((conv) => (
          <Link
            key={conv.id}
            to="/messages/$id"
            params={{ id: conv.id }}
            className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={conv.readerAvatar} />
                <AvatarFallback>{conv.readerName.slice(0, 2)}</AvatarFallback>
              </Avatar>
              {conv.unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                  {conv.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">{conv.readerName}</p>
              <p className={`truncate text-sm ${conv.unread ? "font-medium text-ink" : "text-muted-foreground"}`}>{conv.lastMessage}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">{conv.lastMessageAt}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
