import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, RefreshCw, Search, Share2, X } from "lucide-react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCirclePage, type CircleFilter, type CircleSort } from "@/lib/profile-tabs.functions";
import { toggleFollow } from "@/lib/circle.functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type CircleTab = "followers" | "following";
type CircleItem = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  isFollowing: boolean;
  isMutual: boolean;
  connectedAt: string | null;
};
type CirclePage = {
  items: CircleItem[];
  hasMore: boolean;
  page: number;
  counts: { followers: number; following: number };
  matchCount: number;
};

const SORTS: Array<{ id: CircleSort; label: string }> = [
  { id: "alphabetical", label: "A–Z" },
  { id: "newest", label: "Newest" },
  { id: "mutual", label: "Mutuals first" },
];

const FILTERS: Array<{ id: CircleFilter; label: string }> = [
  { id: "all", label: "Everyone" },
  { id: "mutual", label: "Mutual" },
  { id: "not_mutual", label: "Not mutual" },
];

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="rounded bg-primary/20 px-0.5 text-ink">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function ProfileCircleScreen({
  initialTab,
  initialQuery,
  initialSort,
  initialFilter,
  initialScroll,
}: {
  initialTab?: CircleTab | undefined;
  initialQuery?: string | undefined;
  initialSort?: CircleSort | undefined;
  initialFilter?: CircleFilter | undefined;
  initialScroll?: number | undefined;
} = {}) {
  const fetchPage = useServerFn(getCirclePage);
  const follow = useServerFn(toggleFollow);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<CircleTab>(initialTab ?? "followers");
  const [query, setQuery] = useState(initialQuery ?? "");
  const [debounced, setDebounced] = useState(initialQuery ?? "");
  const [sort, setSort] = useState<CircleSort>(initialSort ?? "alphabetical");
  const [filter, setFilter] = useState<CircleFilter>(initialFilter ?? "all");
  const [pullOffset, setPullOffset] = useState(0);
  const pullStart = useRef<number | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const firstMatchRef = useRef<HTMLDivElement | null>(null);
  const scrollOffset = useRef(0);
  const restored = useRef(false);
  const lastAutoScrolled = useRef("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Keep the URL in sync so the view is shareable/restorable.
  useEffect(() => {
    void navigate({
      to: "/profile/circle",
      search: {
        tab,
        ...(debounced ? { q: debounced } : {}),
        ...(sort !== "alphabetical" ? { sort } : {}),
        ...(filter !== "all" ? { filter } : {}),
        ...(scrollOffset.current > 0 ? { s: Math.round(scrollOffset.current) } : {}),
      },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, debounced, sort, filter]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["circle-page", tab, debounced, sort, filter],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchPage({ data: { tab, page: pageParam as number, query: debounced, sort, filter } }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => follow({ data: { userId } }),
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["circle-page"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["circle-page"] });
      let nowFollowing = false;
      queryClient.setQueriesData<{ pages: CirclePage[]; pageParams: unknown[] }>(
        { queryKey: ["circle-page"] },
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((p) => ({
                  ...p,
                  items: p.items.map((it) => {
                    if (it.user_id !== userId) return it;
                    nowFollowing = !it.isFollowing;
                    return { ...it, isFollowing: !it.isFollowing };
                  }),
                })),
              }
            : old,
      );
      return { snapshot, nowFollowing };
    },
    onSuccess: (_res, _userId, ctx) => {
      toast.success(ctx?.nowFollowing ? "Following this reader" : "Unfollowed");
    },
    onError: (e: Error, _userId, ctx) => {
      ctx?.snapshot.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error(e.message || "Couldn't update that follow — we put it back.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["circle-page"] }),
  });

  async function shareCircle() {
    const params = new URLSearchParams({
      tab,
      ...(debounced ? { q: debounced } : {}),
      ...(sort !== "alphabetical" ? { sort } : {}),
      ...(filter !== "all" ? { filter } : {}),
      ...(scrollOffset.current > 0 ? { s: String(Math.round(scrollOffset.current)) } : {}),
    });
    const url = `${window.location.origin}/profile/circle?${params.toString()}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "My circle on Circle", url });
        toast.success("Link shared");
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — it opens right where you left off");
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      toast.error("Couldn't share this link");
    }
  }

  const pages = data?.pages ?? [];
  const list = pages.flatMap((p) => p.items);
  const counts = pages[0]?.counts ?? { followers: 0, following: 0 };
  const matchCount = pages[0]?.matchCount ?? 0;
  const firstMatchId = debounced ? list[0]?.user_id ?? null : null;

  // Restore an exact scroll offset shared through the link.
  useLayoutEffect(() => {
    if (restored.current || isLoading || !list.length) return;
    const node = scrollRef.current;
    if (!node) return;
    if (initialScroll && initialScroll > 0) node.scrollTop = initialScroll;
    restored.current = true;
  }, [isLoading, list.length, initialScroll]);

  // Bring the first highlighted match into view when the search changes.
  useEffect(() => {
    if (!debounced || !firstMatchId) return;
    const key = `${tab}:${debounced}:${firstMatchId}`;
    if (lastAutoScrolled.current === key) return;
    lastAutoScrolled.current = key;
    firstMatchRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [debounced, firstMatchId, tab]);

  // infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) void fetchNextPage();
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, list.length]);

  // pull to refresh
  function onTouchStart(e: React.TouchEvent) {
    const node = scrollRef.current;
    if (node && node.scrollTop <= 0) pullStart.current = e.touches[0]?.clientY ?? null;
    else pullStart.current = null;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (pullStart.current === null) return;
    const delta = (e.touches[0]?.clientY ?? 0) - pullStart.current;
    if (delta > 0) setPullOffset(Math.min(80, delta * 0.5));
  }
  function onTouchEnd() {
    if (pullOffset > 50) void refetch();
    pullStart.current = null;
    setPullOffset(0);
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper pt-safe-top">
      <header className="sticky top-0 z-40 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/profile" aria-label="Back to profile"><ArrowLeft size={22} className="text-ink" /></Link>
          <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>My circle</h1>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Share this list"
            onClick={() => void shareCircle()}
            className="ml-auto h-9 w-9 rounded-full text-ink hover:bg-muted"
          >
            <Share2 size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh list"
            onClick={() => void refetch()}
            className="h-9 w-9 rounded-full text-ink hover:bg-muted"
          >
            <RefreshCw size={18} className={isRefetching ? "animate-spin" : ""} />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 rounded-full bg-muted p-1">
          {(["followers", "following"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full py-1.5 text-xs font-medium capitalize transition-colors ${
                tab === t ? "bg-paper text-ink shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t} · {t === "followers" ? counts.followers : counts.following}
            </button>
          ))}
        </div>
        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tab}…`}
            aria-label={`Search ${tab}`}
            className="h-10 w-full rounded-xl border border-border bg-parchment pl-9 pr-9 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors ${
                filter === f.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="mx-1 h-4 w-px shrink-0 bg-border" />
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              aria-pressed={sort === s.id}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors ${
                sort === s.id ? "border-ink bg-ink text-paper" : "border-border text-muted-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {!isLoading && !isError && (debounced || filter !== "all") && (
          <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
            {matchCount} {matchCount === 1 ? "match" : "matches"}
            {debounced ? ` for “${debounced}”` : ""}
          </p>
        )}
      </header>

      <main
        ref={scrollRef}
        onScroll={(e) => {
          scrollOffset.current = (e.target as HTMLElement).scrollTop;
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-10 pt-4"
        style={{ transform: pullOffset ? `translateY(${pullOffset}px)` : undefined }}
      >
        {(pullOffset > 0 || isRefetching) && (
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className={isRefetching ? "animate-spin" : ""} />
            {isRefetching ? "Refreshing…" : pullOffset > 50 ? "Release to refresh" : "Pull to refresh"}
          </p>
        )}

        {isLoading &&
          Array.from({ length: 6 }).map((_, n) => (
            <div key={n} className="flex animate-pulse items-center gap-3 rounded-2xl border border-border bg-parchment p-3">
              <div className="h-11 w-11 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="h-3 w-1/4 rounded bg-muted" />
              </div>
            </div>
          ))}

        {isError && !isLoading && (
          <div className="rounded-2xl border border-border bg-parchment p-5 text-center">
            <p className="text-sm text-ink">We couldn't load your circle.</p>
            <p className="mt-1 text-xs text-muted-foreground">{(error as Error)?.message ?? "Please try again."}</p>
            <Button size="sm" className="mt-3 rounded-full" onClick={() => void refetch()}>Retry</Button>
          </div>
        )}

        {!isLoading && !isError && list.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            {debounced
              ? `No ${tab} match "${debounced}".`
              : filter !== "all"
                ? `No ${tab} in this filter yet.`
                : tab === "followers"
                  ? "No one follows you yet. Share your profile to grow your circle."
                  : "You're not following anyone yet."}
          </p>
        )}

        {list.map((p) => (
          <div
            key={p.user_id}
            ref={p.user_id === firstMatchId ? firstMatchRef : undefined}
            className="flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3"
          >
            <Link to="/readers/$id" params={{ id: p.user_id }} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage src={p.avatar_url ?? undefined} />
                <AvatarFallback>{(p.display_name ?? p.username).slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  <Highlight text={p.display_name ?? p.username} query={debounced} />
                  {p.isMutual && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Mutual
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @<Highlight text={p.username} query={debounced} />
                </p>
              </div>
            </Link>
            <Button
              size="sm"
              variant={p.isFollowing ? "outline" : "default"}
              onClick={() => followMutation.mutate(p.user_id)}
              className="h-8 shrink-0 rounded-full text-xs"
            >
              {p.isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        ))}

        <div ref={sentinelRef} />
        {isFetchingNextPage && (
          <p className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Loading more…
          </p>
        )}
        {!isLoading && !isError && hasNextPage && !isFetchingNextPage && (
          <Button variant="outline" className="w-full rounded-xl" onClick={() => void fetchNextPage()}>
            Load more
          </Button>
        )}
      </main>
    </div>
  );
}
