import { Link } from "@tanstack/react-router";
import { Settings, Mail, Users, BookOpen, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { READERS, BOOKS, CLUBS } from "@/lib/seed";

export function ProfileScreen() {
  const user = READERS[0];
  const myBooks = BOOKS.slice(0, 4);
  const myClubs = CLUBS.slice(0, 3);

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Profile</h1>
        <Link to="/profile/settings">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-ink hover:bg-muted">
            <Settings size={20} />
          </Button>
        </Link>
      </header>

      <section className="px-4 pt-6 text-center">
        <Avatar className="mx-auto h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-paper">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback>YO</AvatarFallback>
        </Avatar>
        <h2 className="mt-3 text-xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{user?.name}</h2>
        <p className="text-sm text-muted-foreground">@{user?.handle}</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-ink">{user?.bio}</p>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div><span className="font-semibold text-ink">{user?.booksRead}</span> <span className="text-muted-foreground">books</span></div>
          <div><span className="font-semibold text-ink">{user?.followers}</span> <span className="text-muted-foreground">followers</span></div>
          <div><span className="font-semibold text-ink">{user?.following}</span> <span className="text-muted-foreground">following</span></div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border bg-parchment p-3 text-center">
            <BookOpen size={18} className="mx-auto text-primary" />
            <p className="mt-1 text-lg font-semibold text-ink">{user?.booksRead}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Read</p>
          </div>
          <div className="rounded-2xl border border-border bg-parchment p-3 text-center">
            <Users size={18} className="mx-auto text-forest" />
            <p className="mt-1 text-lg font-semibold text-ink">{myClubs.length}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Clubs</p>
          </div>
          <div className="rounded-2xl border border-border bg-parchment p-3 text-center">
            <BarChart3 size={18} className="mx-auto text-secondary" />
            <p className="mt-1 text-lg font-semibold text-ink">40%</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Goal</p>
          </div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currently Reading</p>
          <Link to="/books" className="text-xs text-primary hover:underline">See all</Link>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {myBooks.map((book) => (
            <Link key={book.id} to="/books/$id" params={{ id: book.id }} className="shrink-0">
              <img src={book.cover} alt={book.title} className="h-28 w-20 rounded-lg object-cover shadow-sm" />
              <p className="mt-2 max-w-[80px] truncate text-xs font-medium text-ink">{book.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">My Clubs</p>
        <div className="mt-3 space-y-2">
          {myClubs.map((club) => (
            <Link key={club.id} to="/clubs/$id" params={{ id: club.id }} className="flex items-center gap-3 rounded-xl border border-border bg-parchment p-3">
              <img src={club.avatar} alt={club.name} className="h-10 w-10 rounded-lg object-cover" />
              <div>
                <p className="text-sm font-medium text-ink">{club.name}</p>
                <p className="text-xs text-muted-foreground">{club.members.toLocaleString()} members</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
