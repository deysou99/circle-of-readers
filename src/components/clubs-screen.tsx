import { Link } from "@tanstack/react-router";
import { Lock, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getClubs, toggleClubMembership } from "@/lib/circle.functions";
import { toast } from "sonner";

export function ClubsScreen() {
  const fetchClubs = useServerFn(getClubs);
  const toggle = useServerFn(toggleClubMembership);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["clubs"], queryFn: () => fetchClubs() });

  const join = useMutation({
    mutationFn: (clubId: string) => toggle({ data: { clubId } }),
    onSuccess: (res) => {
      toast.success(res.member ? "Joined the circle" : "Left the circle");
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>My Clubs</h1>
      </header>

      <section className="px-4 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Circles</p>
        {isLoading && <p className="pt-4 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (data?.myClubs ?? []).length === 0 && (
          <p className="pt-3 text-sm text-muted-foreground">You haven't joined a circle yet — pick one below.</p>
        )}
        <div className="mt-3 space-y-3">
          {(data?.myClubs ?? []).map((club) => (
            <Link
              key={club.id}
              to="/clubs/$id"
              params={{ id: club.id }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-parchment p-3 transition-colors hover:border-primary/30"
            >
              <Avatar className="h-14 w-14 rounded-xl">
                <AvatarImage src={club.avatar_url ?? undefined} />
                <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-ink">{club.name}</p>
                  {club.is_private && <Lock size={12} className="text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">{(club.member_count ?? 0).toLocaleString()} members</p>
                {club.books && <p className="mt-1 truncate text-xs text-primary">Reading {club.books.title}</p>}
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested for You</p>
        <div className="mt-3 space-y-3">
          {(data?.suggested ?? []).map((club) => (
            <div key={club.id} className="flex items-center gap-4 rounded-2xl border border-border bg-paper p-3">
              <Link to="/clubs/$id" params={{ id: club.id }}>
                <Avatar className="h-12 w-12 rounded-xl">
                  <AvatarImage src={club.avatar_url ?? undefined} />
                  <AvatarFallback>{club.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1">
                <Link to="/clubs/$id" params={{ id: club.id }} className="truncate text-sm font-semibold text-ink hover:text-primary">
                  {club.name}
                </Link>
                <p className="text-xs text-muted-foreground">{club.category}</p>
                {club.books && <p className="truncate text-xs text-muted-foreground">Current book: {club.books.title}</p>}
              </div>
              <Button
                onClick={() => join.mutate(club.id)}
                disabled={join.isPending}
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Join
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
