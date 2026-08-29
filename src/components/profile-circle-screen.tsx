import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, RefreshCw, Search, Share2, X } from "lucide-react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCirclePage } from "@/lib/profile-tabs.functions";
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
};
type CirclePage = { items: CircleItem[]; hasMore: boolean; page: number; counts: { followers: number; following: number } };

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
}: { initialTab?: CircleTab | undefined; initialQuery?: string | undefined } = {}) {
  const fetchPage = useServerFn(getCirclePage);
  const follow = useServerFn(toggleFollow);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<CircleTab>(initialTab ?? "followers");
  const [query, setQuery] = useState(initialQuery ?? "");
  const [debounced, setDebounced] = useState(initialQuery ?? "");
  const [pullOffset, setPullOffset] = useState(0);
  const pullStart = useRef<number | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Keep the URL in sync so the view is shareable/restorable.
  useEffect(() => {
    void navigate({
      to: "/profile/circle",
      search: { tab, ...(debounced ? { q: debounced } : {}) },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, debounced]);

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
    queryKey: ["circle-page", tab, debounced],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPage({ data: { tab, page: pageParam as number, query: debounced } }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => follow({ data: { userId } }),
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["circle-page"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["circle-page"] });
      queryClient.setQueriesData<{ pages: CirclePage[]; pageParams: unknown[] }>(
        { queryKey: ["circle-page"] },
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((p) => ({
                  ...p,
                  items: p.items.map((it) =>
                    it.user_id === userId ? { ...it, isFollowing: !it.isFollowing } : it,
                  ),
                })),
              }
            : old,
      );
      return { snapshot };
    },
    onError: (e: Error, _userId, ctx) => {
      ctx?.snapshot.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error(e.message || "Couldn't update that follow. Reverted.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["circle-page"] }),
  });

  async function shareCircle() {
    const params = new URLSearchParams({ tab, ...(debounced ? { q: debounced } : {}) });
    const url = `${window.location.origin}/profile/circle?${params.toString()}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "My circle on Circle", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      toast.error("Couldn't share this link");
    }
  }


  const pages = data?.pages ?? [];
  const list = pages.flatMap((p) => p.items);
  const counts = pages[0]?.counts ?? { followers: 0, following: 0 };

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
      </header>

      <main
        ref={scrollRef}
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
              : tab === "followers"
                ? "No one follows you yet. Share your profile to grow your circle."
                : "You're not following anyone yet."}
          </p>
        )}

        {list.map((p) => (
          <div key={p.user_id} className="flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3">
            <Link to="/readers/$id" params={{ id: p.user_id }} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage src={p.avatar_url ?? undefined} />
                <AvatarFallback>{(p.display_name ?? p.username).slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  <Highlight text={p.display_name ?? p.username} query={debounced} />
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
