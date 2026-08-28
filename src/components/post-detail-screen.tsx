import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Heart, MessageCircle, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { addComment, getPostDetail, toggleLike } from "@/lib/circle.functions";
import { toast } from "sonner";

function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

export function PostDetailScreen() {
  const { id } = useParams({ from: "/_authenticated/posts/$id" });
  const [comment, setComment] = useState("");

  const fetchPost = useServerFn(getPostDetail);
  const like = useServerFn(toggleLike);
  const comm = useServerFn(addComment);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => fetchPost({ data: { postId: id } }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["post", id] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  };

  const likeMutation = useMutation({ mutationFn: () => like({ data: { postId: id } }), onSuccess: invalidate });
  const commentMutation = useMutation({
    mutationFn: () => comm({ data: { postId: id, content: comment } }),
    onSuccess: () => {
      setComment("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-paper"><p className="text-sm text-muted-foreground">Loading…</p></div>;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-muted-foreground">Post not found.</p>
      </div>
    );
  }

  const { post, comments } = data;

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/home"><ArrowLeft size={22} className="text-ink" /></Link>
        <h1 className="flex-1 text-sm font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Post</h1>
      </header>

      <article className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author?.avatar_url ?? undefined} />
            <AvatarFallback>{(post.author?.display_name ?? post.author?.username ?? "R").slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <Link to="/readers/$id" params={{ id: post.user_id }} className="text-sm font-semibold text-ink hover:text-primary">
              {post.author?.display_name ?? post.author?.username ?? "Reader"}
            </Link>
            <p className="text-xs text-muted-foreground">@{post.author?.username ?? "reader"} • {timeAgo(post.created_at)}</p>
          </div>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-ink">{post.content}</p>
        {post.clubs && <p className="mt-2 text-xs text-primary">Posted in {post.clubs.name}</p>}
        {post.books && (
          <Link to="/books/$id" params={{ id: post.books.id }} className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-parchment p-2">
            {post.books.cover_url && <img src={post.books.cover_url} alt={post.books.title} className="h-14 w-10 rounded object-cover" />}
            <div>
              <p className="text-sm font-medium text-ink">{post.books.title}</p>
              <p className="text-xs text-muted-foreground">{post.books.author}</p>
            </div>
            {post.rating ? <span className="ml-auto pr-2 text-sm font-semibold text-primary">{post.rating}★</span> : null}
          </Link>
        )}

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => likeMutation.mutate()}
            className={`flex items-center gap-1 text-sm ${post.liked ? "text-secondary" : "text-muted-foreground"}`}
          >
            <Heart size={18} fill={post.liked ? "currentColor" : "none"} /> {post.likes_count ?? 0}
          </button>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageCircle size={18} /> {comments.length}
          </span>
        </div>
      </article>

      <section className="px-4 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comments</p>
        {comments.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No comments yet.</p>}
        <div className="mt-3 space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.author?.avatar_url ?? undefined} />
                <AvatarFallback>{(c.author?.display_name ?? c.author?.username ?? "R").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{c.author?.display_name ?? c.author?.username ?? "Reader"}</p>
                <p className="text-sm text-ink">{c.content}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(c.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sticky bottom-0 mt-6 flex items-center gap-2 border-t border-border bg-paper/95 p-4 backdrop-blur-md safe-bottom">
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment…"
          className="h-11 rounded-full border-border bg-parchment text-sm"
        />
        <Button
          onClick={() => commentMutation.mutate()}
          disabled={!comment.trim() || commentMutation.isPending}
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send size={18} />
        </Button>
      </section>
    </div>
  );
}
