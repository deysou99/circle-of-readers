import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Star, Plus, Check, Heart, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBook, POSTS } from "@/lib/seed";

export function BookDetailScreen() {
  const { id } = useParams({ from: "/_authenticated/books/$id" });
  const book = getBook(id);
  const [status, setStatus] = useState<"none" | "reading" | "want" | "finished">("none");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!book) {
    return (
      <div className="phone-shell flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-muted-foreground">Book not found.</p>
      </div>
    );
  }

  const posts = POSTS.filter((p) => p.bookId === book.id);

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/books">
          <ArrowLeft size={22} className="text-ink" />
        </Link>
        <h1 className="flex-1 text-center text-sm font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>Book Detail</h1>
        <button onClick={() => setSaved((v) => !v)} className={`${saved ? "text-primary" : "text-ink"}`}>
          <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
        </button>
      </header>

      <section className="flex gap-5 px-5 pt-6">
        <img src={book.cover} alt={book.title} className="h-48 w-32 rounded-lg object-cover shadow-md" />
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{book.title}</p>
          <p className="text-sm text-muted-foreground">{book.author}</p>
          <div className="mt-2 flex items-center gap-1 text-sm font-medium text-primary">
            <Star size={16} fill="currentColor" /> {book.rating}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{book.publishedYear} • {book.pages} pages • {book.genre}</p>
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="grid grid-cols-3 gap-2">
          <Button variant={status === "want" ? "default" : "outline"} onClick={() => setStatus("want")} className={`h-10 rounded-xl text-xs ${status === "want" ? "bg-primary text-primary-foreground" : "border-border bg-paper text-ink"}`}>
            <Plus size={14} className="mr-1" /> Want
          </Button>
          <Button variant={status === "reading" ? "default" : "outline"} onClick={() => setStatus("reading")} className={`h-10 rounded-xl text-xs ${status === "reading" ? "bg-forest text-white" : "border-border bg-paper text-ink"}`}>
            <Check size={14} className="mr-1" /> Reading
          </Button>
          <Button variant={status === "finished" ? "default" : "outline"} onClick={() => setStatus("finished")} className={`h-10 rounded-xl text-xs ${status === "finished" ? "bg-secondary text-secondary-foreground" : "border-border bg-paper text-ink"}`}>
            <Check size={14} className="mr-1" /> Done
          </Button>
        </div>
      </section>

      <section className="px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</p>
        <p className="mt-2 text-sm leading-relaxed text-ink">{book.summary}</p>
      </section>

      <section className="px-4 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Community Posts</p>
          <button className="text-xs text-primary hover:underline">Write a review</button>
        </div>
        <div className="mt-3 space-y-3">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet. Be the first to share your thoughts.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="rounded-2xl border border-border bg-parchment p-4">
                <div className="flex items-center gap-2">
                  <img src={post.authorAvatar} alt={post.authorName} className="h-8 w-8 rounded-full object-cover" />
                  <p className="text-sm font-medium text-ink">{post.authorName}</p>
                </div>
                <p className="mt-2 text-sm text-ink">{post.content}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <button onClick={() => setLiked((v) => !v)} className={`flex items-center gap-1 ${liked ? "text-secondary" : ""}`}>
                    <Heart size={14} fill={liked ? "currentColor" : "none"} /> {post.likes + (liked ? 1 : 0)}
                  </button>
                  <span>{post.comments} comments</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
