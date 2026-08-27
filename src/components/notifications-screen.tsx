import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, UserPlus, BookOpen, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NOTIFICATIONS = [
  { id: "n1", type: "like", text: "Maya Okonkwo liked your post about The Paper War", time: "5m ago", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", read: false },
  { id: "n2", type: "comment", text: "Samir Hossain commented on your review", time: "1h ago", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop", read: false },
  { id: "n3", type: "follow", text: "Linnea Berg started following you", time: "3h ago", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop", read: true },
  { id: "n4", type: "club", text: "New discussion in The Common Room", time: "6h ago", avatar: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=200&h=200&fit=crop", read: true },
  { id: "n5", type: "book", text: "Quiet Currency is trending in Design & Pages", time: "1d ago", avatar: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=200&h=200&fit=crop", read: true },
];

const ICONS = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  club: BookOpen,
  book: BookOpen,
};

export function NotificationsScreen() {
  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Notifications</h1>
        <button className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Check size={14} /> Mark read
        </button>
      </header>

      <main className="px-4 pt-2">
        {NOTIFICATIONS.map((note) => {
          const Icon = ICONS[note.type as keyof typeof ICONS] || Heart;
          return (
            <div key={note.id} className={`flex items-start gap-3 border-b border-border py-3 last:border-b-0 ${note.read ? "opacity-70" : ""}`}>
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={note.avatar} />
                  <AvatarFallback>NO</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon size={12} />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-ink">{note.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">{note.time}</p>
              </div>
              {!note.read && <div className="mt-2 h-2 w-2 rounded-full bg-secondary" />}
            </div>
          );
        })}
      </main>
    </div>
  );
}
