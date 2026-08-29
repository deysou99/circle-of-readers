import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Plus, Heart, MessageCircle, BookOpen, UserSearch } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toggleLike } from "@/lib/circle.functions";
import { getTimeline } from "@/lib/social.functions";
import { TimelineFilters, type TimelineType, type TimelineRange } from "@/components/timeline-filters";
import { RecommendationsRail } from "@/components/recommendations-rail";
import { ResumeOnboardingBanner } from "@/components/resume-onboarding-banner";
import { CreatePostSheet } from "@/components/create-post-sheet";
import { PostImage } from "@/components/post-image";


function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function HomeScreen() {
  const fetchFeed = useServerFn(getTimeline);
  const like = useServerFn(toggleLike);
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);
  const [type, setType] = useState<TimelineType>("all");
  const [range, setRange] = useState<TimelineRange>("all");
  const [clubId, setClubId] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed", type, range, clubId],
    queryFn: () => fetchFeed({ data: { type, range, clubId } }),
  });

  const likeMutation = useMutation({
    mutationFn: (postId: string) => like({ data: { postId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const readers = (posts ?? [])
    .map((p) => p.author)
    .filter((a): a is NonNullable<typeof a> => !!a)
    .filter((a, i, arr) => arr.findIndex((x) => x.user_id === a.user_id) === i)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen size={18} />
          </div>
          <span className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Circle</span>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/search" aria-label="Search readers and circles">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-ink hover:bg-muted">
              <UserSearch size={20} />
            </Button>
          </Link>
          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-ink hover:bg-muted">
              <Bell size={20} />
            </Button>
          </Link>
        </div>
      </header>

      <ResumeOnboardingBanner />

      <TimelineFilters
        type={type}
        range={range}
        clubId={clubId}
        onChange={(next) => {
          if (next.type !== undefined) setType(next.type);
          if (next.range !== undefined) setRange(next.range);
          if (next.clubId !== undefined) setClubId(next.clubId);
        }}
      />

      <RecommendationsRail />

      {readers.length > 0 && (
        <section className="flex gap-4 overflow-x-auto border-b border-border px-4 py-4">
          {readers.map((r) => (
            <Link key={r.user_id} to="/readers/$id" params={{ id: r.user_id }} className="flex flex-col items-center gap-1.5">
              <Avatar className="h-16 w-16 ring-2 ring-border ring-offset-2 ring-offset-paper">
                <AvatarImage src={r.avatar_url ?? undefined} />
                <AvatarFallback>{(r.display_name ?? r.username).slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="max-w-[64px] truncate text-[11px] text-ink">{r.username}</span>
            </Link>
          ))}
        </section>
      )}

      <main className="space-y-4 px-4 pt-4">
        {isLoading && <p className="pt-8 text-center text-sm text-muted-foreground">Loading your feed…</p>}
        {!isLoading && (posts ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-parchment p-8 text-center">
            <p className="text-sm font-medium text-ink">Nothing here yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Share your first reading update to get the conversation going.</p>
            <Button onClick={() => setComposerOpen(true)} className="mt-4 h-10 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">Write a post</Button>
          </div>
        )}
        {(posts ?? []).map((post) => (
          <article key={post.id} className="rounded-2xl border border-border bg-parchment p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author?.avatar_url ?? undefined} />
                <AvatarFallback>{(post.author?.display_name ?? post.author?.username ?? "R").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Link to="/readers/$id" params={{ id: post.user_id }} className="text-sm font-semibold text-ink hover:text-primary">
                  {post.author?.display_name ?? post.author?.username ?? "Reader"}
                </Link>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>@{post.author?.username ?? "reader"}</span>
                  <span>•</span>
                  <span>{timeAgo(post.created_at)}</span>
                  {post.clubs && (
                    <>
                      <span>•</span>
                      <Link to="/clubs/$id" params={{ id: post.clubs.id }} className="hover:text-primary">{post.clubs.name}</Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Link to="/posts/$id" params={{ id: post.id }}>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">{post.content}</p>
            </Link>

            {post.image_url && <PostImage path={post.image_url} className="mt-3 h-56 w-full rounded-xl object-cover" />}


            {post.books && (
              <Link to="/books/$id" params={{ id: post.books.id }} className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-paper p-2">
                {post.books.cover_url && <img src={post.books.cover_url} alt={post.books.title} className="h-14 w-10 rounded object-cover" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{post.books.title}</p>
                  <p className="text-xs text-muted-foreground">{post.books.author}</p>
                </div>
                {post.rating ? <div className="pr-2 text-sm font-semibold text-primary">{post.rating}★</div> : null}
              </Link>
            )}

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => likeMutation.mutate(post.id)}
                className={`flex items-center gap-1 text-sm ${post.liked ? "text-secondary" : "text-muted-foreground"}`}
              >
                <Heart size={18} fill={post.liked ? "currentColor" : "none"} />
                <span>{post.likes_count ?? 0}</span>
              </button>
              <Link to="/posts/$id" params={{ id: post.id }} className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageCircle size={18} />
                <span>{post.comments_count ?? 0}</span>
              </Link>
            </div>
          </article>
        ))}
      </main>

      <button
        onClick={() => setComposerOpen(true)}
        aria-label="Create a new post"
        className="fixed bottom-[88px] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <CreatePostSheet open={composerOpen} onOpenChange={setComposerOpen} />
    </div>
  );
}
