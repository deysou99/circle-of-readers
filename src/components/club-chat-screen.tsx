import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getClub, READERS } from "@/lib/seed";

const INITIAL = [
  { id: "1", senderId: "u2", text: "Has everyone finished chapter 8 yet?", createdAt: "Yesterday" },
  { id: "2", senderId: "u3", text: "Just got there. The train station scene was so tense.", createdAt: "Yesterday" },
  { id: "3", senderId: "u4", text: "I had to re-read the letter twice. Beautifully written.", createdAt: "3h ago" },
  { id: "4", senderId: "u2", text: "Let's discuss it live this Saturday?", createdAt: "1h ago" },
];

export function ClubChatScreen() {
  const { id } = useParams({ from: "/_authenticated/clubs/$id/chat" });
  const club = getClub(id);
  const [messages, setMessages] = useState(INITIAL);
  const [input, setInput] = useState("");

  if (!club) return null;

  function send() {
    if (!input.trim()) return;
    setMessages((m) => [...m, { id: Date.now().toString(), senderId: "u1", text: input, createdAt: "Just now" }]);
    setInput("");
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/clubs/$id" params={{ id }}>
          <ArrowLeft size={22} className="text-ink" />
        </Link>
        <Avatar className="h-9 w-9 rounded-xl">
          <AvatarImage src={club.avatar} />
          <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">{club.name}</p>
          <p className="text-xs text-muted-foreground">{club.members.toLocaleString()} members</p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === "u1";
          const reader = READERS.find((r) => r.id === msg.senderId);
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              {!isMe && reader && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={reader.avatar} />
                  <AvatarFallback>{reader.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-parchment text-ink"}`}>
                {!isMe && reader && <p className="mb-0.5 text-[11px] font-medium text-primary">{reader.name}</p>}
                <p>{msg.text}</p>
                <p className={`mt-1 text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.createdAt}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-paper p-3 safe-bottom">
        <div className="flex items-center gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message the circle..." className="h-11 flex-1 rounded-full border-input bg-paper px-4" />
          <Button onClick={send} size="icon" className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
