import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BOOKS } from "@/lib/seed";

const SHELVES = ["All", "Reading", "Want to Read", "Finished", "Favorites"];

export function BooksScreen() {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");

  const books = BOOKS.filter((b) => b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 space-y-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>My Books</h1>
          <Button size="icon" className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus size={16} />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your collection…" className="h-10 rounded-full border-border bg-parchment pl-9 text-sm" />
        </div>
      </header>

      <section className="flex gap-2 overflow-x-auto px-4 py-4">
        {SHELVES.map((shelf) => (
          <button
            key={shelf}
            onClick={() => setActive(shelf)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              active === shelf ? "bg-primary text-primary-foreground" : "border border-border bg-paper text-ink hover:bg-muted"
            }`}
          >
            {shelf}
          </button>
        ))}
      </section>

      <section className="px-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{active} ({books.length})</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {books.map((book) => (
            <Link key={book.id} to="/books/$id" params={{ id: book.id }} className="group">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-sm">
                <img src={book.cover} alt={book.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                {active === "Reading" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                    <div className="h-full w-[45%] bg-forest" />
                  </div>
                )}
              </div>
              <p className="mt-2 line-clamp-1 text-xs font-medium text-ink">{book.title}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reading Goal</p>
        <div className="mt-3 rounded-2xl border border-border bg-parchment p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">12 of 30 books</p>
            <p className="text-xs text-muted-foreground">40%</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full w-[40%] rounded-full bg-primary" />
          </div>
        </div>
      </section>
    </div>
  );
}
