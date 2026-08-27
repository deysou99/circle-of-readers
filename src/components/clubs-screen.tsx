import { Link } from "@tanstack/react-router";
import { Plus, Lock, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CLUBS, getBook } from "@/lib/seed";

export function ClubsScreen() {
  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>My Clubs</h1>
        <Button size="sm" className="h-8 gap-1 rounded-full bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90">
          <Plus size={14} /> Create
        </Button>
      </header>

      <section className="px-4 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Circles</p>
        <div className="mt-3 space-y-3">
          {CLUBS.slice(0, 4).map((club) => {
            const book = getBook(club.activeBookId);
            return (
              <Link
                key={club.id}
                to="/clubs/$id"
                params={{ id: club.id }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-parchment p-3 transition-colors hover:border-primary/30"
              >
                <Avatar className="h-14 w-14 rounded-xl">
                  <AvatarImage src={club.avatar} />
                  <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-ink">{club.name}</p>
                    {club.isPrivate && <Lock size={12} className="text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{club.members.toLocaleString()} members</p>
                  {book && (
                    <p className="mt-1 truncate text-xs text-primary">Reading {book.title}</p>
                  )}
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-4 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested for You</p>
        <div className="mt-3 space-y-3">
          {CLUBS.slice(2, 4).map((club) => {
            const book = getBook(club.activeBookId);
            return (
              <div key={`suggest-${club.id}`} className="flex items-center gap-4 rounded-2xl border border-border bg-paper p-3">
                <Avatar className="h-12 w-12 rounded-xl">
                  <AvatarImage src={club.avatar} />
                  <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{club.name}</p>
                  <p className="text-xs text-muted-foreground">{club.category}</p>
                  {book && <p className="truncate text-xs text-muted-foreground">Current book: {book.title}</p>}
                </div>
                <Button variant="outline" size="sm" className="h-8 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Join
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
