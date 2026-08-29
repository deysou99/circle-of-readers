import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyCircle } from "@/lib/profile-tabs.functions";
import { toggleFollow } from "@/lib/circle.functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ProfileCircleScreen() {
  const fetchCircle = useServerFn(getMyCircle);
  const follow = useServerFn(toggleFollow);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"followers" | "following">("followers");

  const { data, isLoading } = useQuery({ queryKey: ["my-circle"], queryFn: () => fetchCircle() });

  const followMutation = useMutation({
    mutationFn: (userId: string) => follow({ data: { userId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-circle"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const list = tab === "followers" ? data?.followers ?? [] : data?.following ?? [];

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/profile" aria-label="Back to profile"><ArrowLeft size={22} className="text-ink" /></Link>
          <h1 className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>My circle</h1>
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
              {t} · {t === "followers" ? data?.followers.length ?? 0 : data?.following.length ?? 0}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-3 px-4 pt-4">
        {isLoading && <p className="pt-6 text-center text-sm text-muted-foreground">Loading your circle…</p>}
        {!isLoading && list.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            {tab === "followers" ? "No one follows you yet. Share your profile to grow your circle." : "You're not following anyone yet."}
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
                <p className="truncate text-sm font-medium text-ink">{p.display_name ?? p.username}</p>
                <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
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
      </main>
    </div>
  );
}
