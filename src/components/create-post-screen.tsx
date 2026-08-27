import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Image as ImageIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BOOKS } from "@/lib/seed";
import { toast } from "sonner";

export function CreatePostScreen() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [rating, setRating] = useState(0);

  function submit() {
    toast.success("Post shared to your circles");
    navigate({ to: "/home" });
  }

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate({ to: "/home" })}>
          <ArrowLeft size={22} className="text-ink" />
        </button>
        <h1 className="text-sm font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>New Post</h1>
        <Button onClick={submit} size="sm" className="h-8 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90">
          Share
        </Button>
      </header>

      <section className="px-4 pt-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What are you reading? Share a thought, quote, or question..."
          className="min-h-[140px] resize-none rounded-2xl border-border bg-parchment p-4 text-base"
        />
      </section>

      <section className="px-4 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tag a Book</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {BOOKS.map((book) => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(selectedBook === book.id ? null : book.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border p-2 transition-colors ${
                selectedBook === book.id ? "border-primary bg-primary/5" : "border-border bg-paper"
              }`}
            >
              <img src={book.cover} alt={book.title} className="h-12 w-8 rounded object-cover" />
              <div className="text-left">
                <p className="max-w-[120px] truncate text-xs font-medium text-ink">{book.title}</p>
                <p className="text-[10px] text-muted-foreground">{book.author}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedBook && (
        <section className="px-4 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rate it</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star size={24} className={s <= rating ? "fill-primary text-primary" : "text-border"} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="px-4 pt-6">
        <button className="flex items-center gap-2 rounded-xl border border-border bg-paper px-4 py-3 text-sm text-ink hover:bg-muted">
          <ImageIcon size={18} /> Add a photo
        </button>
      </section>
    </div>
  );
}
