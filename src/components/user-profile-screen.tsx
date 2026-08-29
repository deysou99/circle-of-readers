import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReader, toggleFollow } from "@/lib/circle.functions";
import { startDirectConversation } from "@/lib/social.functions";
import { toast } from "sonner";

export function UserProfileScreen() {
  const { id } = useParams({ from: "/_authenticated/readers/$id" });
  const fetchReader = useServerFn(getReader);
  const follow = useServerFn(toggleFollow);
  const startDm = useServerFn(startDirectConversation);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reader", id],
    queryFn: () => fetchReader({ data: { userId: id } }),
  });

  const followMutation = useMutation({
    mutationFn: () => follow({ data: { userId: id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reader", id] }),
  });

  const dmMutation = useMutation({
    mutationFn: () => startDm({ data: { userId: id } }),
    onSuccess: (res) => navigate({ to: "/messages/$id", params: { id: res.conversationId } }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-paper"><p className="text-sm text-muted-foreground">Loading…</p></div>;
  }

  if (!data?.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-muted-foreground">Reader not found.</p>
      </div>
    );
  }

  const { profile, followers, following, isFollowing, posts } = data;

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/home"><ArrowLeft size={22} className="text-ink" /></Link>
        <h1 className="flex-1 truncate text-sm font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
          {profile.display_name ?? profile.username}
        </h1>
      </header>

      <section className="px-4 pt-6 text-center">
        <Avatar className="mx-auto h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-paper">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback>{(profile.display_name ?? profile.username).slice(0, 2)}</AvatarFallback>
        </Avatar>
        <h2 className="mt-3 text-xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>
          {profile.display_name ?? profile.username}
        </h2>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.bio && <p className="mx-auto mt-2 max-w-xs text-sm text-ink">{profile.bio}</p>}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div><span className="font-semibold text-ink">{followers}</span> <span className="text-muted-foreground">followers</span></div>
          <div><span className="font-semibold text-ink">{following}</span> <span className="text-muted-foreground">following</span></div>
        </div>
        <Button
          onClick={() => followMutation.mutate()}
          disabled={followMutation.isPending}
          variant={isFollowing ? "outline" : "default"}
          className={`mt-4 h-11 w-40 rounded-xl ${isFollowing ? "border-border bg-paper text-ink hover:bg-muted" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
        <Button
          onClick={() => dmMutation.mutate()}
          disabled={dmMutation.isPending}
          variant="outline"
          className="ml-2 mt-4 h-11 w-40 rounded-xl border-border bg-paper text-ink hover:bg-muted"
        >
          <MessageSquare size={18} className="mr-2" /> Message
        </Button>
      </section>

      <section className="px-4 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent Posts</p>
        {posts.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No posts yet.</p>}
        <div className="mt-3 space-y-3">
          {posts.map((p) => (
            <Link key={p.id} to="/posts/$id" params={{ id: p.id }} className="block rounded-2xl border border-border bg-parchment p-3">
              <p className="text-sm text-ink">{p.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">{p.likes_count ?? 0} likes • {p.comments_count ?? 0} comments</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
