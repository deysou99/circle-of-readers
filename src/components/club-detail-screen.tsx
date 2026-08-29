import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare, Users, Lock, Globe, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getClubDetail, toggleClubMembership } from "@/lib/circle.functions";
import { toast } from "sonner";
import { ClubEvents } from "@/components/club-events";

export function ClubDetailScreen() {
  const { id } = useParams({ from: "/_authenticated/clubs/$id" });
  const fetchClub = useServerFn(getClubDetail);
  const toggle = useServerFn(toggleClubMembership);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["club", id],
    queryFn: () => fetchClub({ data: { clubId: id } }),
  });

  const membership = useMutation({
    mutationFn: () => toggle({ data: { clubId: id } }),
    onSuccess: (res) => {
      toast.success(res.member ? "Joined the circle" : "Left the circle");
      queryClient.invalidateQueries({ queryKey: ["club", id] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-paper"><p className="text-sm text-muted-foreground">Loading…</p></div>;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-muted-foreground">Circle not found.</p>
      </div>
    );
  }

  const { club, isMember, posts } = data;

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/clubs"><ArrowLeft size={22} className="text-ink" /></Link>
        <h1 className="flex-1 truncate text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{club.name}</h1>
      </header>

      <section className="px-4 pt-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 rounded-2xl">
            <AvatarImage src={club.avatar_url ?? undefined} />
            <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{club.name}</p>
              {club.is_private ? <Lock size={14} className="text-muted-foreground" /> : <Globe size={14} className="text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground">@{club.handle}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users size={14} /> {(club.member_count ?? 0).toLocaleString()}</span>
              <span>{club.category}</span>
            </div>
          </div>
        </div>
        {club.description && <p className="mt-4 text-sm leading-relaxed text-ink">{club.description}</p>}

        <Link
          to="/search"
          search={{ club: club.id, clubName: club.name }}
          className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-parchment px-3 py-2.5 text-sm text-muted-foreground"
        >
          <Search size={16} /> Search in this circle — members, books, posts
        </Link>

        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => membership.mutate()}
            disabled={membership.isPending}
            className="h-11 flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isMember ? "Joined" : "Join circle"}
          </Button>
          <Link to="/clubs/$id/chat" params={{ id: club.id }} className="flex-1">
            <Button variant="outline" className="h-11 w-full rounded-xl border-border bg-paper text-ink hover:bg-muted">
              <MessageSquare size={18} className="mr-2" /> Chat
            </Button>
          </Link>
        </div>
      </section>

      <ClubEvents clubId={club.id} canCreate={isMember} />

      {club.books && (
        <section className="px-4 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currently Reading</p>
          <Link to="/books/$id" params={{ id: club.books.id }} className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-parchment p-3">
            {club.books.cover_url && <img src={club.books.cover_url} alt={club.books.title} className="h-20 w-14 rounded-lg object-cover" />}
            <div>
              <p className="text-sm font-medium text-ink">{club.books.title}</p>
              <p className="text-xs text-muted-foreground">{club.books.author}</p>
            </div>
          </Link>
        </section>
      )}

      <section className="px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Circle Activity</p>
        {posts.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No posts in this circle yet.</p>}
        <div className="mt-3 space-y-3">
          {posts.map((p) => (
            <Link key={p.id} to="/posts/$id" params={{ id: p.id }} className="flex gap-3 rounded-2xl border border-border bg-parchment p-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={p.author?.avatar_url ?? undefined} />
                <AvatarFallback>{(p.author?.display_name ?? p.author?.username ?? "R").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{p.author?.display_name ?? p.author?.username ?? "Reader"}</p>
                <p className="mt-1 text-sm text-ink">{p.content}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
