import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, X, Clock, Users, User, BookOpen, MessageSquareText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  searchCircle,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  toggleFollow,
  toggleClubMembership,
} from "@/lib/circle.functions";
import { PostImage } from "@/components/post-image";
import { toast } from "sonner";

const FILTERS = ["All", "People", "Circles", "Books", "Posts"] as const;
type Filter = (typeof FILTERS)[number];

export function SearchScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const search = useServerFn(searchCircle);
  const fetchRecents = useServerFn(getRecentSearches);
  const storeRecent = useServerFn(saveRecentSearch);
  const wipeRecents = useServerFn(clearRecentSearches);
  const follow = useServerFn(toggleFollow);
  const joinClub = useServerFn(toggleClubMembership);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: recents = [] } = useQuery({ queryKey: ["search-recents"], queryFn: () => fetchRecents() });

  const { data, isFetching } = useQuery({
    queryKey: ["circle-search", debounced, filter],
    queryFn: () => search({ data: { query: debounced, type: filter } }),
  });

  const saveRecent = useMutation({
    mutationFn: (vars: { query: string; filter: Filter }) => storeRecent({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["search-recents"] }),
  });

  useEffect(() => {
    if (debounced.length < 2) return;
    saveRecent.mutate({ query: debounced, filter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, filter]);

  const clear = useMutation({
    mutationFn: () => wipeRecents(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["search-recents"] }),
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => follow({ data: { userId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["circle-search"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const joinMutation = useMutation({
    mutationFn: (clubId: string) => joinClub({ data: { clubId } }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["circle-search"] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      toast.success(r.member ? "Joined circle" : "Left circle");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const people = useMemo(() => data?.people ?? [], [data]);
  const clubs = useMemo(() => data?.clubs ?? [], [data]);
  const books = useMemo(() => data?.books ?? [], [data]);
  const posts = useMemo(() => data?.posts ?? [], [data]);

  const total = people.length + clubs.length + books.length + posts.length;
  const noResults = !isFetching && total === 0;

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
              placeholder="Search readers, circles, books, posts…"
              aria-label="Search Circle"
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
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
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
              <button onClick={() => clear.mutate()} className="text-xs text-muted-foreground hover:text-ink">Clear</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {recents.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setFilter((FILTERS as readonly string[]).includes(r.filter) ? (r.filter as Filter) : "All");
                    setQuery(r.query);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-parchment px-3 py-1.5 text-xs text-ink"
                >
                  <Clock size={12} className="text-muted-foreground" />
                  {r.query}
                  {r.filter !== "All" && <span className="text-muted-foreground">· {r.filter}</span>}
                </button>
              ))}
            </div>
          </section>
        )}

        {isFetching && <p className="pt-6 text-center text-sm text-muted-foreground">Searching…</p>}

        {people.length > 0 && (
          <section>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <User size={12} /> Readers
            </p>
            <div className="mt-3 space-y-3">
              {people.map((r) => (
                <div key={r.user_id} className="flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3">
                  <Link to="/readers/$id" params={{ id: r.user_id }} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={r.avatar_url ?? undefined} />
                      <AvatarFallback>{(r.display_name ?? r.username).slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{r.display_name ?? r.username}</p>
                      <p className="truncate text-xs text-muted-foreground">@{r.username}</p>
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant={r.isFollowing ? "outline" : "default"}
                    disabled={followMutation.isPending}
                    onClick={() => followMutation.mutate(r.user_id)}
                    className="h-8 shrink-0 rounded-full text-xs"
                  >
                    {r.isFollowing ? "Following" : "Follow"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {clubs.length > 0 && (
          <section>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Users size={12} /> Circles
            </p>
            <div className="mt-3 space-y-3">
              {clubs.map((club) => (
                <div key={club.id} className="flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3">
                  <Link to="/clubs/$id" params={{ id: club.id }} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-11 w-11 rounded-xl">
                      <AvatarImage src={club.avatar_url ?? undefined} />
                      <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{club.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {(club.member_count ?? 0).toLocaleString()} members • {club.category}
                      </p>
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant={club.isMember ? "outline" : "default"}
                    disabled={joinMutation.isPending}
                    onClick={() => joinMutation.mutate(club.id)}
                    className="h-8 shrink-0 rounded-full text-xs"
                  >
                    {club.isMember ? "Joined" : "Join"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {books.length > 0 && (
          <section>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <BookOpen size={12} /> Books
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {books.map((book) => (
                <Link
                  key={book.id}
                  to="/books/$id"
                  params={{ id: book.id }}
                  className="rounded-2xl border border-border bg-parchment p-3 transition-colors hover:border-primary/30"
                >
                  {book.cover_url && (
                    <img src={book.cover_url} alt={book.title} className="mx-auto h-32 w-22 rounded-lg object-cover" />
                  )}
                  <p className="mt-2 line-clamp-1 text-xs font-medium text-ink">{book.title}</p>
                  <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {posts.length > 0 && (
          <section>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MessageSquareText size={12} /> Posts & circle activity
            </p>
            <div className="mt-3 space-y-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to="/posts/$id"
                  params={{ id: p.id }}
                  className="block rounded-2xl border border-border bg-parchment p-3"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={p.author?.avatar_url ?? undefined} />
                      <AvatarFallback>{(p.author?.display_name ?? p.author?.username ?? "R").slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.author?.display_name ?? p.author?.username ?? "Reader"}
                      {p.clubs ? ` • ${p.clubs.name}` : ""}
                    </p>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-ink">{p.content}</p>
                  {p.image_url && <PostImage path={p.image_url} className="mt-2 h-36 w-full rounded-xl object-cover" />}
                  {p.books && <p className="mt-2 text-xs text-muted-foreground">📖 {p.books.title}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {noResults && (
          <div className="rounded-2xl border border-dashed border-border bg-parchment p-8 text-center">
            <p className="text-sm font-medium text-ink">
              {debounced ? `No ${filter === "All" ? "results" : filter.toLowerCase()} for “${debounced}”` : "Nothing to show yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filter === "All"
                ? "Try a different name, username, book title, or circle topic."
                : `Try another word, or switch the filter away from ${filter}.`}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
