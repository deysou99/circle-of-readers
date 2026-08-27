import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getReader, CONVERSATIONS, MESSAGES } from "@/lib/seed";

export function ChatScreen() {
  const { id } = useParams({ from: "/_authenticated/messages/$id" });
  const conv = CONVERSATIONS.find((c) => c.id === id);
  const reader = conv ? getReader(conv.readerId) : null;
  const [messages, setMessages] = useState(MESSAGES[id] || []);
  const [input, setInput] = useState("");

  if (!conv || !reader) {
    return (
      <div className="phone-shell flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-muted-foreground">Conversation not found.</p>
      </div>
    );
  }

  function send() {
    if (!input.trim()) return;
    setMessages((m) => [...m, { id: Date.now().toString(), senderId: "u1", text: input, createdAt: "Just now" }]);
    setInput("");
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/messages">
          <ArrowLeft size={22} className="text-ink" />
        </Link>
        <Avatar className="h-9 w-9">
          <AvatarImage src={reader.avatar} />
          <AvatarFallback>{reader.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">{reader.name}</p>
          <p className="text-xs text-muted-foreground">@{reader.handle}</p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === "u1";
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-parchment text-ink"}`}>
                <p>{msg.text}</p>
                <p className={`mt-1 text-right text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.createdAt}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-paper p-3 safe-bottom">
        <div className="flex items-center gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" className="h-11 flex-1 rounded-full border-input bg-paper px-4" />
          <Button onClick={send} size="icon" className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
