import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, X, Clock, Users, User, BookOpen, MessageSquareText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  searchCircle,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  toggleFollow,
  toggleClubMembership,
  logSearchClick,
} from "@/lib/circle.functions";
import { PostImage } from "@/components/post-image";
import type { SearchNavState } from "@/lib/search-nav";
import "@/lib/search-nav";
import { toast } from "sonner";

const FILTERS = ["All", "People", "Circles", "Books", "Posts"] as const;
type Filter = (typeof FILTERS)[number];

type SearchPage = Awaited<ReturnType<typeof searchCircle>>;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Highlights every occurrence of the active query inside a text snippet. */
function Highlight({ text, query }: { text: string; query: string }) {
  const term = query.trim();
  if (!term || term.length < 2 || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "ig"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={i} className="rounded bg-primary/20 px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function SearchScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const sentinel = useRef<HTMLDivElement | null>(null);

  const search = useServerFn(searchCircle);
  const fetchRecents = useServerFn(getRecentSearches);
  const storeRecent = useServerFn(saveRecentSearch);
  const wipeRecents = useServerFn(clearRecentSearches);
  const follow = useServerFn(toggleFollow);
  const joinClub = useServerFn(toggleClubMembership);
  const trackClick = useServerFn(logSearchClick);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: recents = [] } = useQuery({ queryKey: ["search-recents"], queryFn: () => fetchRecents() });

  const searchKey = useMemo(() => ["circle-search", debounced, filter] as const, [debounced, filter]);

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: searchKey,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => search({ data: { query: debounced, type: filter, page: pageParam as number } }),
    getNextPageParam: (lastPage: SearchPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });

  const pages = useMemo(() => data?.pages ?? [], [data]);
  const people = useMemo(() => pages.flatMap((p) => p.people), [pages]);
  const clubs = useMemo(() => pages.flatMap((p) => p.clubs), [pages]);
  const books = useMemo(() => pages.flatMap((p) => p.books), [pages]);
  const posts = useMemo(() => pages.flatMap((p) => p.posts), [pages]);

  // Infinite scroll: load the next page when the sentinel enters the viewport.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  const patchPages = useCallback(
    (fn: (page: SearchPage) => SearchPage) => {
      queryClient.setQueriesData<{ pages: SearchPage[]; pageParams: unknown[] }>(
        { queryKey: ["circle-search"] },
        (old) => (old ? { ...old, pages: old.pages.map(fn) } : old),
      );
    },
    [queryClient],
  );

  const followMutation = useMutation({
    mutationFn: (userId: string) => follow({ data: { userId } }),
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["circle-search"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["circle-search"] });
      patchPages((page) => ({
        ...page,
        people: page.people.map((p) => (p.user_id === userId ? { ...p, isFollowing: !p.isFollowing } : p)),
      }));
      return { snapshot };
    },
    onError: (e: Error, _userId, ctx) => {
      ctx?.snapshot.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error(e.message);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["circle-search"] }),
  });

  const joinMutation = useMutation({
    mutationFn: (clubId: string) => joinClub({ data: { clubId } }),
    onMutate: async (clubId: string) => {
      await queryClient.cancelQueries({ queryKey: ["circle-search"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["circle-search"] });
      patchPages((page) => ({
        ...page,
        clubs: page.clubs.map((c) =>
          c.id === clubId
            ? { ...c, isMember: !c.isMember, member_count: (c.member_count ?? 0) + (c.isMember ? -1 : 1) }
            : c,
        ),
      }));
      return { snapshot };
    },
    onError: (e: Error, _clubId, ctx) => {
      ctx?.snapshot.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error(e.message);
    },
    onSuccess: (r) => toast.success(r.member ? "Joined circle" : "Left circle"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["circle-search"] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });

  const navState: SearchNavState = { searchQuery: debounced, searchFilter: filter };

  const onResultClick = (resultType: string, resultId: string, position: number) => {
    void trackClick({ data: { query: debounced, filter, resultType, resultId, position } }).catch(() => {
      /* telemetry is best-effort */
    });
  };

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

        {isFetching && !isFetchingNextPage && (
          <p className="pt-6 text-center text-sm text-muted-foreground">Searching…</p>
        )}

        {people.length > 0 && (
          <section>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <User size={12} /> Readers
            </p>
            <div className="mt-3 space-y-3">
              {people.map((r, i) => (
                <div key={r.user_id} className="flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3">
                  <Link
                    to="/readers/$id"
                    params={{ id: r.user_id }}
                    state={navState}
                    onClick={() => onResultClick("person", r.user_id, i)}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={r.avatar_url ?? undefined} />
                      <AvatarFallback>{(r.display_name ?? r.username).slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        <Highlight text={r.display_name ?? r.username} query={debounced} />
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @<Highlight text={r.username} query={debounced} />
                      </p>
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant={r.isFollowing ? "outline" : "default"}
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
              {clubs.map((club, i) => (
                <div key={club.id} className="flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3">
                  <Link
                    to="/clubs/$id"
                    params={{ id: club.id }}
                    state={navState}
                    onClick={() => onResultClick("club", club.id, i)}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <Avatar className="h-11 w-11 rounded-xl">
                      <AvatarImage src={club.avatar_url ?? undefined} />
                      <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        <Highlight text={club.name} query={debounced} />
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {(club.member_count ?? 0).toLocaleString()} members • <Highlight text={club.category ?? ""} query={debounced} />
                      </p>
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant={club.isMember ? "outline" : "default"}
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
              {books.map((book, i) => (
                <Link
                  key={book.id}
                  to="/books/$id"
                  params={{ id: book.id }}
                  state={navState}
                  onClick={() => onResultClick("book", book.id, i)}
                  className="rounded-2xl border border-border bg-parchment p-3 transition-colors hover:border-primary/30"
                >
                  {book.cover_url && (
                    <img src={book.cover_url} alt={book.title} className="mx-auto h-32 w-22 rounded-lg object-cover" />
                  )}
                  <p className="mt-2 line-clamp-1 text-xs font-medium text-ink">
                    <Highlight text={book.title} query={debounced} />
                  </p>
                  <p className="line-clamp-1 text-[11px] text-muted-foreground">
                    <Highlight text={book.author} query={debounced} />
                  </p>
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
              {posts.map((p, i) => (
                <Link
                  key={p.id}
                  to="/posts/$id"
                  params={{ id: p.id }}
                  state={navState}
                  onClick={() => onResultClick("post", p.id, i)}
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
                  <p className="mt-2 line-clamp-3 text-sm text-ink">
                    <Highlight text={p.content} query={debounced} />
                  </p>
                  {p.image_url && <PostImage path={p.image_url} className="mt-2 h-36 w-full rounded-xl object-cover" />}
                  {p.books && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      📖 <Highlight text={p.books.title} query={debounced} />
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div ref={sentinel} aria-hidden className="h-1" />

        {isFetchingNextPage && (
          <p className="flex items-center justify-center gap-2 pb-4 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Loading more…
          </p>
        )}

        {!isFetchingNextPage && hasNextPage && total > 0 && (
          <Button
            variant="outline"
            onClick={() => void fetchNextPage()}
            className="mb-4 h-10 w-full rounded-full border-border text-xs"
          >
            Load more results
          </Button>
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
