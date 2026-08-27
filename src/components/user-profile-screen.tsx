import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Users, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getReader, BOOKS } from "@/lib/seed";
import { useState } from "react";

export function UserProfileScreen() {
  const { id } = useParams({ from: "/_authenticated/readers/$id" });
  const reader = getReader(id);
  const [following, setFollowing] = useState(false);

  if (!reader) {
    return (
      <div className="phone-shell flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-muted-foreground">Reader not found.</p>
      </div>
    );
  }

  const books = BOOKS.slice(1, 5);

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/home">
          <ArrowLeft size={22} className="text-ink" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{reader.name}</h1>
      </header>

      <section className="px-4 pt-6 text-center">
        <Avatar className="mx-auto h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-paper">
          <AvatarImage src={reader.avatar} />
          <AvatarFallback>{reader.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <h2 className="mt-3 text-xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{reader.name}</h2>
        <p className="text-sm text-muted-foreground">@{reader.handle}</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-ink">{reader.bio}</p>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div><span className="font-semibold text-ink">{reader.booksRead}</span> <span className="text-muted-foreground">books</span></div>
          <div><span className="font-semibold text-ink">{reader.followers}</span> <span className="text-muted-foreground">followers</span></div>
          <div><span className="font-semibold text-ink">{reader.following}</span> <span className="text-muted-foreground">following</span></div>
        </div>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={() => setFollowing((v) => !v)} className={`h-10 rounded-full px-6 ${following ? "border border-border bg-paper text-ink" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
            {following ? "Following" : "Follow"}
          </Button>
          <Button variant="outline" className="h-10 rounded-full border-border bg-paper text-ink hover:bg-muted">Message</Button>
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reading</p>
          <BookOpen size={16} className="text-muted-foreground" />
        </div>
        <div className="mt-3 rounded-2xl border border-border bg-parchment p-4">
          <p className="text-sm font-medium text-ink">Currently reading</p>
          <p className="text-lg font-semibold text-primary" style={{ fontFamily: "var(--font-heading)" }}>{reader.currentlyReading}</p>
        </div>
      </section>

      <section className="px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Favorite Books</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {books.map((book) => (
            <Link key={book.id} to="/books/$id" params={{ id: book.id }}>
              <img src={book.cover} alt={book.title} className="aspect-[2/3] w-full rounded-lg object-cover shadow-sm" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
