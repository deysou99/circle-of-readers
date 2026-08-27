import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare, Users, BookOpen, Lock, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getClub, getBook, READERS } from "@/lib/seed";

export function ClubDetailScreen() {
  const { id } = useParams({ from: "/_authenticated/clubs/$id" });
  const club = getClub(id);

  if (!club) {
    return (
      <div className="phone-shell flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-muted-foreground">Circle not found.</p>
      </div>
    );
  }

  const book = getBook(club.activeBookId);
  const members = READERS.slice(1, 5);

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/clubs">
          <ArrowLeft size={22} className="text-ink" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{club.name}</h1>
      </header>

      <section className="px-4 pt-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 rounded-2xl">
            <AvatarImage src={club.avatar} />
            <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{club.name}</p>
              {club.isPrivate ? <Lock size={14} className="text-muted-foreground" /> : <Globe size={14} className="text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground">@{club.handle}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users size={14} /> {club.members.toLocaleString()}</span>
              <span>{club.category}</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink">{club.description}</p>

        <div className="mt-5 flex gap-2">
          <Button className="h-11 flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">Joined</Button>
          <Link to="/clubs/$id/chat" params={{ id: club.id }} className="flex-1">
            <Button variant="outline" className="h-11 w-full rounded-xl border-border bg-paper text-ink hover:bg-muted">
              <MessageSquare size={18} className="mr-2" /> Chat
            </Button>
          </Link>
        </div>
      </section>

      <section className="px-4 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currently Reading</p>
        {book ? (
          <div className="mt-3 flex gap-4 rounded-2xl border border-border bg-parchment p-4">
            <img src={book.cover} alt={book.title} className="h-28 w-20 rounded-lg object-cover shadow-sm" />
            <div className="flex flex-1 flex-col justify-center">
              <p className="text-base font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{book.title}</p>
              <p className="text-sm text-muted-foreground">{book.author}</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full w-[40%] rounded-full bg-forest" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Club is 40% through</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No active book selected.</p>
        )}
      </section>

      <section className="px-4 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Members</p>
        <div className="mt-3 flex -space-x-2">
          {members.map((m) => (
            <Avatar key={m.id} className="h-10 w-10 ring-2 ring-paper">
              <AvatarImage src={m.avatar} />
              <AvatarFallback>{m.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
          ))}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-medium text-ink ring-2 ring-paper">
            +{club.members - members.length}
          </div>
        </div>
      </section>

      <section className="px-4 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent Discussion</p>
        <div className="mt-3 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-parchment p-4">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-primary" />
                <span className="text-sm font-medium text-ink">Chapter discussion thread</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{12 * i} replies • {i === 1 ? "2h" : "6h"} ago</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
