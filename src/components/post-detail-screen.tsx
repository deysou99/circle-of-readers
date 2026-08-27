import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Heart, MessageCircle, Bookmark, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPost, getBook, getClub } from "@/lib/seed";

const COMMENTS = [
  { id: "c1", author: "Maya Okonkwo", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", text: "Yes! That post office scene made me put the book down too.", time: "45m ago" },
  { id: "c2", author: "Daniel Rivera", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop", text: "I love how understated the tension is in this novel.", time: "1h ago" },
];

export function PostDetailScreen() {
  const { id } = useParams({ from: "/_authenticated/posts/$id" });
  const post = getPost(id);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comment, setComment] = useState("");

  if (!post) {
    return (
      <div className="phone-shell flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-muted-foreground">Post not found.</p>
      </div>
    );
  }

  const book = post.bookId ? getBook(post.bookId) : null;
  const club = post.clubId ? getClub(post.clubId) : null;

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/home">
          <ArrowLeft size={22} className="text-ink" />
        </Link>
        <h1 className="flex-1 text-sm font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Post</h1>
      </header>

      <article className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.authorAvatar} />
            <AvatarFallback>{post.authorName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <Link to="/readers/$id" params={{ id: post.authorId }} className="text-sm font-semibold text-ink hover:text-primary">
              {post.authorName}
            </Link>
            <p className="text-xs text-muted-foreground">@{post.authorHandle} • {post.createdAt}</p>
          </div>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-ink">{post.content}</p>
        {club && <p className="mt-2 text-xs text-primary">Posted in {club.name}</p>}
        {book && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-parchment p-2">
            <img src={book.cover} alt={book.title} className="h-14 w-10 rounded object-cover" />
            <div>
              <p className="text-sm font-medium text-ink">{book.title}</p>
              <p className="text-xs text-muted-foreground">{book.author}</p>
            </div>
            {post.rating && <span className="ml-auto pr-2 text-sm font-semibold text-primary">{post.rating}★</span>}
          </div>
        )}
        {post.image && <img src={post.image} alt="Post" className="mt-3 w-full rounded-xl" />}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setLiked((v) => !v)} className={`flex items-center gap-1 text-sm ${liked ? "text-secondary" : "text-muted-foreground"}`}>
              <Heart size={18} fill={liked ? "currentColor" : "none"} /> {post.likes + (liked ? 1 : 0)}
            </button>
            <span className="flex items-center gap-1 text-sm text-muted-foreground"><MessageCircle size={18} /> {post.comments + COMMENTS.length}</span>
          </div>
          <button onClick={() => setSaved((v) => !v)} className={`${saved ? "text-primary" : "text-muted-foreground"}`}>
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </article>

      <section className="px-4 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comments</p>
        <div className="mt-3 space-y-4">
          {COMMENTS.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.avatar} />
                <AvatarFallback>{c.author.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{c.author} <span className="text-xs font-normal text-muted-foreground">• {c.time}</span></p>
                <p className="text-sm text-ink">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 mt-4 border-t border-border bg-paper p-3 safe-bottom">
        <div className="flex items-center gap-2">
          <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" className="h-11 flex-1 rounded-full border-input bg-parchment px-4" />
          <Button size="icon" className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
