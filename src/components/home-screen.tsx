import { Link } from "@tanstack/react-router";
import { Bell, Plus, Heart, MessageCircle, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { POSTS, READERS, getBook, getClub } from "@/lib/seed";
import { useState } from "react";

export function HomeScreen() {
  const stories = READERS.slice(1, 6);

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Circle</span>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/create-post">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-ink hover:bg-muted">
              <Plus size={20} />
            </Button>
          </Link>
          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-ink hover:bg-muted">
              <Bell size={20} />
            </Button>
          </Link>
        </div>
      </header>

      <section className="flex gap-4 overflow-x-auto border-b border-border px-4 py-4">
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-primary ring-offset-2 ring-offset-paper">
              <AvatarImage src={READERS[0]?.avatar} />
              <AvatarFallback>YO</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">+</div>
          </div>
          <span className="text-[11px] text-ink">Your story</span>
        </div>
        {stories.map((r) => (
          <div key={r.id} className="flex flex-col items-center gap-1.5">
            <Avatar className="h-16 w-16 ring-2 ring-border ring-offset-2 ring-offset-paper">
              <AvatarImage src={r.avatar} />
              <AvatarFallback>{r.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="max-w-[64px] truncate text-[11px] text-ink">{r.handle}</span>
          </div>
        ))}
      </section>

      <main className="space-y-4 px-4 pt-4">
        {POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </main>
    </div>
  );
}

function PostCard({ post }: { post: typeof POSTS[0] }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const book = post.bookId ? getBook(post.bookId) : null;
  const club = post.clubId ? getClub(post.clubId) : null;

  return (
    <article className="rounded-2xl border border-border bg-parchment p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.authorAvatar} />
          <AvatarFallback>{post.authorName.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Link to="/readers/$id" params={{ id: post.authorId }} className="text-sm font-semibold text-ink hover:text-primary">
            {post.authorName}
          </Link>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>@{post.authorHandle}</span>
            <span>•</span>
            <span>{post.createdAt}</span>
            {club && (
              <>
                <span>•</span>
                <Link to="/clubs/$id" params={{ id: club.id }} className="hover:text-primary">
                  {club.name}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <Link to="/posts/$id" params={{ id: post.id }}>
        <p className="mt-3 text-[15px] leading-relaxed text-ink">{post.content}</p>
      </Link>

      {book && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-paper p-2">
          <img src={book.cover} alt={book.title} className="h-14 w-10 rounded object-cover" />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">{book.title}</p>
            <p className="text-xs text-muted-foreground">{book.author}</p>
          </div>
          {post.rating && (
            <div className="pr-2 text-sm font-semibold text-primary">{post.rating}★</div>
          )}
        </div>
      )}

      {post.image && (
        <img src={post.image} alt="Post" className="mt-3 w-full rounded-xl object-cover" />
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setLiked((v) => !v)} className={`flex items-center gap-1 text-sm ${liked ? "text-secondary" : "text-muted-foreground"}`}>
            <Heart size={18} fill={liked ? "currentColor" : "none"} />
            <span>{post.likes + (liked ? 1 : 0)}</span>
          </button>
          <Link to="/posts/$id" params={{ id: post.id }} className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageCircle size={18} />
            <span>{post.comments}</span>
          </Link>
        </div>
        <button onClick={() => setSaved((v) => !v)} className={`${saved ? "text-primary" : "text-muted-foreground"}`}>
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}
