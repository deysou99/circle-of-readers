import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, X, Clock, Users, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchCircle } from "@/lib/circle.functions";

const RECENTS_KEY = "circle.search.recents";
const FILTERS = ["All", "People", "Circles"] as const;
type Filter = (typeof FILTERS)[number];

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function SearchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [recents, setRecents] = useState<string[]>([]);
  const search = useServerFn(searchCircle);

  useEffect(() => setRecents(readRecents()), []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 2) return;
    setRecents((prev) => {
      const next = [debounced, ...prev.filter((r) => r.toLowerCase() !== debounced.toLowerCase())].slice(0, 8);
      try {
        window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [debounced]);

  const { data, isFetching } = useQuery({
    queryKey: ["people-search", debounced],
    queryFn: () => search({ data: { query: debounced } }),
  });

  const people = useMemo(() => data?.people ?? [], [data]);
  const clubs = useMemo(() => data?.clubs ?? [], [data]);

  const showPeople = filter === "All" || filter === "People";
  const showClubs = filter === "All" || filter === "Circles";
  const noResults = !isFetching && (showPeople ? people.length : 0) + (showClubs ? clubs.length : 0) === 0;

  const clearRecents = () => {
    setRecents([]);
    try {
      window.localStorage.removeItem(RECENTS_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-24 pt-safe-top">
      <header className="sticky top-0 z-40 space-y-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate({ to: "/home" })} aria-label="Back">
            <ArrowLeft size={22} className="text-ink" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search readers and circles…"
              aria-label="Search readers and circles"
              className="h-10 rounded-full border-border bg-parchment pl-9 pr-9 text-sm"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-paper text-ink hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-6 px-4 pt-4">
        {!debounced && recents.length > 0 && (
          <section>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent searches</p>
              <button onClick={clearRecents} className="text-xs text-muted-foreground hover:text-ink">Clear</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {recents.map((r) => (
                <button
                  key={r}
                  onClick={() => setQuery(r)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-parchment px-3 py-1.5 text-xs text-ink"
                >
                  <Clock size={12} className="text-muted-foreground" /> {r}
                </button>
              ))}
            </div>
          </section>
        )}

        {isFetching && <p className="pt-6 text-center text-sm text-muted-foreground">Searching…</p>}

        {showPeople && people.length > 0 && (
          <section>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <User size={12} /> Readers
            </p>
            <div className="mt-3 space-y-3">
              {people.map((r) => (
                <Link
                  key={r.user_id}
                  to="/readers/$id"
                  params={{ id: r.user_id }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3"
                >
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={r.avatar_url ?? undefined} />
                    <AvatarFallback>{(r.display_name ?? r.username).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{r.display_name ?? r.username}</p>
                    <p className="truncate text-xs text-muted-foreground">@{r.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {showClubs && clubs.length > 0 && (
          <section>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Users size={12} /> Circles
            </p>
            <div className="mt-3 space-y-3">
              {clubs.map((club) => (
                <Link
                  key={club.id}
                  to="/clubs/$id"
                  params={{ id: club.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3"
                >
                  <Avatar className="h-11 w-11 rounded-xl">
                    <AvatarImage src={club.avatar_url ?? undefined} />
                    <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{club.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(club.member_count ?? 0).toLocaleString()} members • {club.category}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {noResults && (
          <div className="rounded-2xl border border-dashed border-border bg-parchment p-8 text-center">
            <p className="text-sm font-medium text-ink">
              {debounced ? `No matches for “${debounced}”` : "Nothing to show yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different name, username, or circle topic.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
