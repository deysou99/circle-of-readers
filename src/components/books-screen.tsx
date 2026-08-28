import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBooks } from "@/lib/circle.functions";

const SHELVES = [
  { label: "All", value: "all" },
  { label: "Reading", value: "reading" },
  { label: "Want to Read", value: "want" },
  { label: "Finished", value: "finished" },
];

export function BooksScreen() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const fetchBooks = useServerFn(getBooks);

  const { data, isLoading } = useQuery({ queryKey: ["books"], queryFn: () => fetchBooks() });

  const shelfMap = new Map((data?.shelf ?? []).map((s) => [s.book_id, s]));
  const finished = (data?.shelf ?? []).filter((s) => s.status === "finished").length;
  const goal = data?.readingGoal ?? 30;
  const pct = Math.min(100, Math.round((finished / Math.max(goal, 1)) * 100));

  const books = (data?.books ?? [])
    .filter((b) =>
      active === "all" ? true : shelfMap.get(b.id)?.status === active,
    )
    .filter(
      (b) =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.author.toLowerCase().includes(query.toLowerCase()),
    );

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 space-y-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>My Books</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your collection…" className="h-10 rounded-full border-border bg-parchment pl-9 text-sm" />
        </div>
      </header>

      <section className="flex gap-2 overflow-x-auto px-4 py-4">
        {SHELVES.map((shelf) => (
          <button
            key={shelf.value}
            onClick={() => setActive(shelf.value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              active === shelf.value ? "bg-primary text-primary-foreground" : "border border-border bg-paper text-ink hover:bg-muted"
            }`}
          >
            {shelf.label}
          </button>
        ))}
      </section>

      <section className="px-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {SHELVES.find((s) => s.value === active)?.label} ({books.length})
        </p>
        {isLoading && <p className="pt-6 text-center text-sm text-muted-foreground">Loading your shelves…</p>}
        {!isLoading && books.length === 0 && (
          <p className="pt-6 text-center text-sm text-muted-foreground">Nothing on this shelf yet — open a book to add it.</p>
        )}
        <div className="mt-3 grid grid-cols-3 gap-3">
          {books.map((book) => {
            const entry = shelfMap.get(book.id);
            return (
              <Link key={book.id} to="/books/$id" params={{ id: book.id }} className="group">
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-parchment shadow-sm">
                  {book.cover_url && (
                    <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  )}
                  {entry?.status === "reading" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                      <div className="h-full bg-forest" style={{ width: `${entry.progress}%` }} />
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-1 text-xs font-medium text-ink">{book.title}</p>
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-4 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reading Goal</p>
        <div className="mt-3 rounded-2xl border border-border bg-parchment p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">{finished} of {goal} books</p>
            <p className="text-xs text-muted-foreground">{pct}%</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>
    </div>
  );
}
