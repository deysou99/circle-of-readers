import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createPost, getBooks, getClubs } from "@/lib/circle.functions";
import { toast } from "sonner";

export function CreatePostSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [content, setContent] = useState("");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [rating, setRating] = useState(0);

  const fetchBooks = useServerFn(getBooks);
  const fetchClubs = useServerFn(getClubs);
  const post = useServerFn(createPost);
  const queryClient = useQueryClient();

  const { data: booksData } = useQuery({ queryKey: ["books"], queryFn: () => fetchBooks(), enabled: open });
  const { data: clubsData } = useQuery({ queryKey: ["clubs"], queryFn: () => fetchClubs(), enabled: open });

  const reset = () => {
    setContent("");
    setSelectedBook(null);
    setSelectedClub(null);
    setRating(0);
  };

  const submit = useMutation({
    mutationFn: () =>
      post({
        data: {
          content,
          bookId: selectedBook,
          clubId: selectedClub,
          rating: selectedBook && rating ? rating : null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post shared to your circles");
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-border bg-paper px-4 pb-8">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base text-ink" style={{ fontFamily: "var(--font-heading)" }}>
            New Post
          </SheetTitle>
        </SheetHeader>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What are you reading? Share a thought, quote, or question..."
          className="mt-3 min-h-[120px] resize-none rounded-2xl border-border bg-parchment p-4 text-base"
        />

        <div className="pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attach a Book</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {(booksData?.books ?? []).map((book) => (
              <button
                key={book.id}
                onClick={() => setSelectedBook(selectedBook === book.id ? null : book.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border p-2 transition-colors ${
                  selectedBook === book.id ? "border-primary bg-primary/5" : "border-border bg-paper"
                }`}
              >
                {book.cover_url && <img src={book.cover_url} alt={book.title} className="h-12 w-8 rounded object-cover" />}
                <div className="text-left">
                  <p className="max-w-[120px] truncate text-xs font-medium text-ink">{book.title}</p>
                  <p className="text-[10px] text-muted-foreground">{book.author}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {(clubsData?.myClubs ?? []).length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Post to a Circle</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(clubsData?.myClubs ?? []).map((club) => (
                <button
                  key={club.id}
                  onClick={() => setSelectedClub(selectedClub === club.id ? null : club.id)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    selectedClub === club.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-paper text-ink hover:bg-muted"
                  }`}
                >
                  {club.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedBook && (
          <div className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rate it</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} aria-label={`Rate ${s} stars`}>
                  <Star size={24} className={s <= rating ? "fill-primary text-primary" : "text-border"} />
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => submit.mutate()}
          disabled={submit.isPending || !content.trim()}
          className="mt-6 h-11 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submit.isPending ? "Sharing…" : "Share post"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
