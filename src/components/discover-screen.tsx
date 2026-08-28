import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Users, BookOpen, User, Newspaper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchCircle } from "@/lib/circle.functions";
import { ARTICLES } from "@/lib/seed";

const CATEGORIES = [
  { label: "Books", icon: BookOpen },
  { label: "Clubs", icon: Users },
  { label: "People", icon: User },
  { label: "Journal", icon: Newspaper },
];

export function DiscoverScreen() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("Books");
  const search = useServerFn(searchCircle);

  const { data } = useQuery({
    queryKey: ["discover", query],
    queryFn: () => search({ data: { query } }),
  });

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 space-y-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Discover</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Books, clubs, readers, articles…" className="h-10 rounded-full border-border bg-parchment pl-9 text-sm" />
        </div>
      </header>

      <section className="flex gap-2 overflow-x-auto px-4 py-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const selected = active === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setActive(cat.label)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                selected ? "bg-primary text-primary-foreground" : "border border-border bg-paper text-ink hover:bg-muted"
              }`}
            >
              <Icon size={14} /> {cat.label}
            </button>
          );
        })}
      </section>

      <main className="px-4">
        {active === "Books" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Books</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(data?.books ?? []).map((book) => (
                <Link key={book.id} to="/books/$id" params={{ id: book.id }} className="rounded-2xl border border-border bg-parchment p-3 transition-colors hover:border-primary/30">
                  {book.cover_url && <img src={book.cover_url} alt={book.title} className="mx-auto h-32 w-22 rounded-lg object-cover" />}
                  <p className="mt-2 line-clamp-1 text-xs font-medium text-ink">{book.title}</p>
                  <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
                </Link>
              ))}
            </div>
          </>
        )}

        {active === "Clubs" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Circles</p>
            <div className="mt-3 space-y-3">
              {(data?.clubs ?? []).map((club) => (
                <Link key={club.id} to="/clubs/$id" params={{ id: club.id }} className="flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3">
                  <Avatar className="h-12 w-12 rounded-xl">
                    <AvatarImage src={club.avatar_url ?? undefined} />
                    <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{club.name}</p>
                    <p className="text-xs text-muted-foreground">{(club.member_count ?? 0).toLocaleString()} members • {club.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {active === "People" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Readers</p>
            <div className="mt-3 space-y-3">
              {(data?.people ?? []).map((r) => (
                <Link key={r.user_id} to="/readers/$id" params={{ id: r.user_id }} className="flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={r.avatar_url ?? undefined} />
                    <AvatarFallback>{(r.display_name ?? r.username).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{r.display_name ?? r.username}</p>
                    <p className="truncate text-xs text-muted-foreground">@{r.username}</p>
                  </div>
                </Link>
              ))}
              {(data?.people ?? []).length === 0 && <p className="text-sm text-muted-foreground">No readers found.</p>}
            </div>
          </>
        )}

        {active === "Journal" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Circle Journal</p>
            <div className="mt-3 space-y-3">
              {ARTICLES.map((a) => (
                <Link key={a.slug} to="/journal/$slug" params={{ slug: a.slug }} className="block rounded-2xl border border-border bg-parchment p-3">
                  <p className="text-sm font-medium text-ink">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.excerpt}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
