import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Settings, Share2, Users, Pencil, BarChart3, Star, MessageSquareText, Heart, BookOpen, Link2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBooks, getClubs, getMyProfile } from "@/lib/circle.functions";
import { getMyLikes, getMyPosts, getMyReviews } from "@/lib/profile-tabs.functions";
import { GoodreadsPanel, type GoodreadsState } from "@/components/goodreads-panel";
import { ResumeOnboardingBanner } from "@/components/resume-onboarding-banner";
import { ProfileStatsTab } from "@/components/profile-stats-tab";
import { toast } from "sonner";

const TABS = [
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "clubs", label: "Clubs", icon: Users },
  { id: "posts", label: "Posts", icon: MessageSquareText },
  { id: "likes", label: "Likes", icon: Heart },
  { id: "goodreads", label: "Goodreads", icon: Link2 },
] as const;

export type ProfileTabId = (typeof TABS)[number]["id"];
export const PROFILE_TAB_IDS: ProfileTabId[] = TABS.map((t) => t.id);

type TabId = ProfileTabId;

export function ProfileScreen({
  initialTab,
  initialScroll,
}: { initialTab?: ProfileTabId | undefined; initialScroll?: number | undefined } = {}) {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchBooks = useServerFn(getBooks);
  const fetchClubs = useServerFn(getClubs);
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabId>(initialTab ?? "stats");

  useEffect(() => {
    if (initialTab && initialTab !== tab) setTab(initialTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollPositions = useRef<Partial<Record<TabId, number>>>(
    initialScroll && initialTab ? ({ [initialTab]: initialScroll } as Partial<Record<TabId, number>>) : {},
  );

  // Restore the scroll offset remembered for the tab we're switching into.
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = scrollPositions.current[tab] ?? 0;
  }, [tab]);

  // A shared link can carry an exact offset — settle on it once content lands.
  const restoredShared = useRef(false);
  useEffect(() => {
    if (restoredShared.current || !initialScroll) return;
    const t = setTimeout(() => {
      const node = scrollRef.current;
      if (node) node.scrollTop = initialScroll;
      restoredShared.current = true;
    }, 250);
    return () => clearTimeout(t);
  }, [initialScroll]);

  function rememberScroll() {
    const node = scrollRef.current;
    if (node) scrollPositions.current[tab] = node.scrollTop;
  }

  function selectTab(next: TabId) {
    rememberScroll();
    setTab(next);
    void navigate({ to: "/profile", search: { tab: next }, replace: true });
  }


  const { data, isError: profileError, refetch: refetchProfile } = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });
  const { data: booksData } = useQuery({ queryKey: ["books"], queryFn: () => fetchBooks() });
  const { data: clubsData, isLoading: clubsLoading, isError: clubsError, refetch: refetchClubs } = useQuery({ queryKey: ["clubs"], queryFn: () => fetchClubs() });


  const profile = data?.profile;
  const stats = data?.stats;
  const myClubs = clubsData?.myClubs ?? [];

  const shelfMap = new Map((booksData?.shelf ?? []).map((s) => [s.book_id, s]));
  const currentlyReading = (booksData?.books ?? []).filter((b) => shelfMap.get(b.id)?.status === "reading");

  const goodreadsState: GoodreadsState = {
    connected: profile?.goodreads_connected ?? false,
    profileUrl: profile?.goodreads_profile ?? "",
    verifiedAt: profile?.goodreads_verified_at ?? null,
    lastSyncAt: profile?.goodreads_last_sync_at ?? null,
    stats: (profile?.goodreads_stats as GoodreadsState["stats"]) ?? null,
  };

  async function shareProfile() {
    const url = `${window.location.origin}/readers/${profile?.user_id ?? ""}?tab=${tab}`;
    const shareData = {
      title: `${profile?.display_name ?? profile?.username ?? "My"} on Circle`,
      text: "Follow my reading on Circle by MyFlip",
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      toast.error("Couldn't share your profile link");
    }
  }

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Profile</h1>
        <div className="flex items-center gap-1">
          <Button
            onClick={shareProfile}
            variant="ghost"
            size="icon"
            aria-label="Share profile"
            className="h-9 w-9 rounded-full text-ink hover:bg-muted"
          >
            <Share2 size={20} />
          </Button>
          <Link to="/profile/settings" aria-label="Settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-ink hover:bg-muted">
              <Settings size={20} />
            </Button>
          </Link>
        </div>
      </header>

      <ResumeOnboardingBanner />

      {/* identity */}
      <section className="px-4 pt-6 text-center">
        <Avatar className="mx-auto h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-paper">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback>{(profile?.display_name ?? profile?.username ?? "YO").slice(0, 2)}</AvatarFallback>
        </Avatar>
        <h2 className="mt-3 text-xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
          {profile?.display_name ?? profile?.username ?? "Your profile"}
        </h2>
        {profile?.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
        {profile?.bio && <p className="mx-auto mt-2 max-w-xs text-sm text-ink">{profile.bio}</p>}

        <div className="mx-auto mt-4 grid max-w-xs grid-cols-4 gap-1 rounded-2xl border border-border bg-parchment py-3">
          <Metric value={currentlyReading.length} label="Reading" />
          <Metric value={stats?.booksRead ?? 0} label="Read" />
          <Metric value={stats?.followers ?? 0} label="Followers" />
          <Metric value={stats?.following ?? 0} label="Following" />
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Link to="/profile/circle" className="flex-1">
            <Button className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Users size={18} className="mr-2" /> View my circle
            </Button>
          </Link>
        </div>
        <div className="mt-2">
          <Link to="/profile/edit">
            <Button variant="outline" className="h-11 w-full rounded-xl border-border bg-paper text-ink hover:bg-muted">
              <Pencil size={16} className="mr-2" /> Edit profile
            </Button>
          </Link>
        </div>
      </section>

      {/* tabs */}
      <section className="pt-6">
        <div className="sticky top-[57px] z-30 border-y border-border bg-paper/95 backdrop-blur-md">
          <div className="flex items-center gap-1 overflow-x-auto px-3 py-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => selectTab(t.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-ink"
                  }`}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={rememberScroll}
          className="max-h-[calc(100dvh-14rem)] overflow-y-auto overscroll-contain px-4 pb-8 pt-4"
        >
          {tab === "stats" && <ProfileStatsTab />}
          {tab === "reviews" && <ReviewsTab />}
          {tab === "clubs" && (
            <ClubsTab clubs={myClubs} isLoading={clubsLoading} isError={clubsError} onRetry={() => void refetchClubs()} />
          )}
          {tab === "posts" && <PostsTab />}
          {tab === "likes" && <LikesTab />}
          {tab === "goodreads" && (
            profileError ? (
              <ErrorState message="We couldn't load your Goodreads connection." onRetry={() => void refetchProfile()} />
            ) : (
              <GoodreadsPanel
                value={goodreadsState}
                invalidateKeys={[["my-profile"]]}
                title="Goodreads connection"
                subtitle="Keep your Circle reader profile in step with your Goodreads shelves."
              />
            )
          )}
        </div>

      </section>

    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-base font-semibold text-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

function LoadingList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, n) => (
        <div key={n} className="flex animate-pulse gap-3 rounded-2xl border border-border bg-parchment p-3">
          <div className="h-16 w-12 shrink-0 rounded-md bg-muted" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-parchment p-6 text-center">
      <p className="text-sm text-ink">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
      <Button size="sm" className="mt-3 rounded-full" onClick={onRetry}>Retry</Button>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={12} className={n <= rating ? "fill-secondary text-secondary" : "text-muted-foreground"} />
      ))}
    </span>
  );
}

function ReviewsTab() {
  const fetchReviews = useServerFn(getMyReviews);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["my-reviews"], queryFn: () => fetchReviews() });
  const reviews = data?.reviews ?? [];

  if (isLoading) return <LoadingList />;
  if (isError) return <ErrorState message="We couldn't load your reviews." onRetry={() => void refetch()} />;
  if (!reviews.length) return <Empty>No reviews yet. Rate a book from your shelf to start.</Empty>;

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="flex gap-3 rounded-2xl border border-border bg-parchment p-3">
          {r.book?.cover_url && <img src={r.book.cover_url} alt={r.book.title} className="h-20 w-14 shrink-0 rounded-md object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{r.book?.title ?? "Untitled"}</p>
            <p className="truncate text-xs text-muted-foreground">{r.book?.author}</p>
            <div className="mt-1"><Stars rating={r.rating} /></div>
            {r.text && <p className="mt-2 line-clamp-3 text-sm text-ink">{r.text}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClubsTab({
  clubs,
  isLoading,
  isError,
  onRetry,
}: {
  clubs: Array<{ id: string; name: string; avatar_url: string | null; member_count: number | null }>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) return <LoadingList rows={3} />;
  if (isError) return <ErrorState message="We couldn't load your circles." onRetry={onRetry} />;
  if (!clubs.length) return <Empty>You haven't joined a circle yet. Discover one from the Discover tab.</Empty>;
  return (
    <div className="space-y-2">
      {clubs.map((club) => (
        <Link key={club.id} to="/clubs/$id" params={{ id: club.id }} className="flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3">
          <Avatar className="h-11 w-11 rounded-xl">
            <AvatarImage src={club.avatar_url ?? undefined} />
            <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{club.name}</p>
            <p className="text-xs text-muted-foreground">{(club.member_count ?? 0).toLocaleString()} members</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function PostsTab() {
  const fetchPosts = useServerFn(getMyPosts);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["my-posts"], queryFn: () => fetchPosts() });
  const posts = data?.posts ?? [];

  if (isLoading) return <LoadingList rows={3} />;
  if (isError) return <ErrorState message="We couldn't load your posts." onRetry={() => void refetch()} />;
  if (!posts.length) return <Empty>You haven't posted yet. Tap the + button on Home to share a thought.</Empty>;

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <Link key={p.id} to="/posts/$id" params={{ id: p.id }} className="block rounded-2xl border border-border bg-parchment p-3">
          <p className="text-sm text-ink">{p.content}</p>
          {p.books && <p className="mt-2 text-xs text-primary">on {p.books.title}</p>}
          {p.clubs && <p className="text-xs text-forest">in {p.clubs.name}</p>}
          <p className="mt-2 text-xs text-muted-foreground">{p.likes_count ?? 0} likes • {p.comments_count ?? 0} comments</p>
        </Link>
      ))}
    </div>
  );
}

function LikesTab() {
  const fetchLikes = useServerFn(getMyLikes);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["my-likes"], queryFn: () => fetchLikes() });

  if (isLoading) return <LoadingList rows={3} />;
  if (isError) return <ErrorState message="We couldn't load your likes." onRetry={() => void refetch()} />;
  const posts = data?.posts ?? [];
  const books = data?.books ?? [];
  if (!posts.length && !books.length) return <Empty>Nothing liked yet. Tap the heart on posts you enjoy.</Empty>;

  return (
    <div className="space-y-6">
      {books.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <BookOpen size={12} /> Books you loved
          </p>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {books.map((b) => (
              <Link key={b.id} to="/books/$id" params={{ id: b.book.id }} className="w-20 shrink-0">
                {b.book.cover_url && <img src={b.book.cover_url} alt={b.book.title} className="h-28 w-20 rounded-lg object-cover shadow-sm" />}
                <p className="mt-1 truncate text-xs font-medium text-ink">{b.book.title}</p>
                <Stars rating={b.rating} />
              </Link>
            ))}
          </div>
        </div>
      )}
      {posts.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Heart size={12} /> Liked posts
          </p>
          <div className="mt-3 space-y-3">
            {posts.map((l) => (
              <Link key={l.id} to="/posts/$id" params={{ id: l.post.id }} className="block rounded-2xl border border-border bg-parchment p-3">
                <p className="line-clamp-3 text-sm text-ink">{l.post.content}</p>
                {l.post.books && <p className="mt-2 text-xs text-primary">on {l.post.books.title}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{l.post.likes_count ?? 0} likes</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
