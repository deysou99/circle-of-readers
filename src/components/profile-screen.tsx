import { Link } from "@tanstack/react-router";
import { Settings, Users, BookOpen, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBooks, getClubs, getMyProfile } from "@/lib/circle.functions";
import { GoodreadsPanel, type GoodreadsState } from "@/components/goodreads-panel";

export function ProfileScreen() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchBooks = useServerFn(getBooks);
  const fetchClubs = useServerFn(getClubs);

  const { data } = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });
  const { data: booksData } = useQuery({ queryKey: ["books"], queryFn: () => fetchBooks() });
  const { data: clubsData } = useQuery({ queryKey: ["clubs"], queryFn: () => fetchClubs() });

  const profile = data?.profile;
  const stats = data?.stats;
  const goal = booksData?.readingGoal ?? 30;
  const pct = Math.min(100, Math.round(((stats?.booksRead ?? 0) / Math.max(goal, 1)) * 100));

  const shelfMap = new Map((booksData?.shelf ?? []).map((s) => [s.book_id, s]));
  const currentlyReading = (booksData?.books ?? []).filter((b) => shelfMap.get(b.id)?.status === "reading");
  const myClubs = clubsData?.myClubs ?? [];

  const goodreadsState: GoodreadsState = {
    connected: profile?.goodreads_connected ?? false,
    profileUrl: profile?.goodreads_profile ?? "",
    verifiedAt: profile?.goodreads_verified_at ?? null,
    lastSyncAt: profile?.goodreads_last_sync_at ?? null,
    stats: (profile?.goodreads_stats as GoodreadsState["stats"]) ?? null,
  };

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Profile</h1>
        <Link to="/profile/settings">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-ink hover:bg-muted">
            <Settings size={20} />
          </Button>
        </Link>
      </header>

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
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div><span className="font-semibold text-ink">{stats?.booksRead ?? 0}</span> <span className="text-muted-foreground">books</span></div>
          <div><span className="font-semibold text-ink">{stats?.followers ?? 0}</span> <span className="text-muted-foreground">followers</span></div>
          <div><span className="font-semibold text-ink">{stats?.following ?? 0}</span> <span className="text-muted-foreground">following</span></div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border bg-parchment p-3 text-center">
            <BookOpen size={18} className="mx-auto text-primary" />
            <p className="mt-1 text-lg font-semibold text-ink">{stats?.booksRead ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Read</p>
          </div>
          <div className="rounded-2xl border border-border bg-parchment p-3 text-center">
            <Users size={18} className="mx-auto text-forest" />
            <p className="mt-1 text-lg font-semibold text-ink">{myClubs.length}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Clubs</p>
          </div>
          <div className="rounded-2xl border border-border bg-parchment p-3 text-center">
            <BarChart3 size={18} className="mx-auto text-secondary" />
            <p className="mt-1 text-lg font-semibold text-ink">{pct}%</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Goal</p>
          </div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currently Reading</p>
          <Link to="/books" className="text-xs text-primary hover:underline">See all</Link>
        </div>
        {currentlyReading.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">No books in progress. Start one from your shelf.</p>
        )}
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {currentlyReading.map((book) => (
            <Link key={book.id} to="/books/$id" params={{ id: book.id }} className="shrink-0">
              {book.cover_url && <img src={book.cover_url} alt={book.title} className="h-28 w-20 rounded-lg object-cover shadow-sm" />}
              <p className="mt-2 max-w-[80px] truncate text-xs font-medium text-ink">{book.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Goodreads</p>
        <div className="mt-3">
          <GoodreadsPanel
            value={goodreadsState}
            invalidateKeys={[["my-profile"]]}
            title="Goodreads connection"
            subtitle="Keep your Circle reader profile in step with your Goodreads shelves."
          />
        </div>
      </section>

      <section className="px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">My Clubs</p>
        {myClubs.length === 0 && <p className="mt-2 text-sm text-muted-foreground">You haven't joined a circle yet.</p>}
        <div className="mt-3 space-y-2">
          {myClubs.map((club) => (
            <Link key={club.id} to="/clubs/$id" params={{ id: club.id }} className="flex items-center gap-3 rounded-xl border border-border bg-parchment p-3">
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarImage src={club.avatar_url ?? undefined} />
                <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-ink">{club.name}</p>
                <p className="text-xs text-muted-foreground">{(club.member_count ?? 0).toLocaleString()} members</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
