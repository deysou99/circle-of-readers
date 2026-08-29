import { useEffect, useRef, useState } from "react";
import { Star, ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createPost, getBooks, getClubs } from "@/lib/circle.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

const DRAFT_KEY = "circle.post.draft";
const MAX_CHARS = 2000;
const MAX_BYTES = 10 * 1024 * 1024;

type Draft = { content: string; bookId: string | null; clubId: string | null; rating: number };

function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function CreatePostSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "publishing">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const fetchBooks = useServerFn(getBooks);
  const fetchClubs = useServerFn(getClubs);
  const post = useServerFn(createPost);
  const queryClient = useQueryClient();

  const { data: booksData } = useQuery({ queryKey: ["books"], queryFn: () => fetchBooks(), enabled: open });
  const { data: clubsData } = useQuery({ queryKey: ["clubs"], queryFn: () => fetchClubs(), enabled: open });

  // Restore draft when the sheet opens.
  useEffect(() => {
    if (!open) return;
    const d = readDraft();
    if (d) {
      setContent(d.content ?? "");
      setSelectedBook(d.bookId ?? null);
      setSelectedClub(d.clubId ?? null);
      setRating(d.rating ?? 0);
      if (d.content) toast("Draft restored");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Autosave draft.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      try {
        const draft: Draft = { content, bookId: selectedBook, clubId: selectedClub, rating };
        if (content.trim() || selectedBook || selectedClub) {
          window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } else {
          window.localStorage.removeItem(DRAFT_KEY);
        }
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [open, content, selectedBook, selectedClub, rating]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const reset = () => {
    setContent("");
    setSelectedBook(null);
    setSelectedClub(null);
    setRating(0);
    setImageFile(null);
    setError(null);
    setPhase("idle");
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Attachments must be image files.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Images must be smaller than 10MB.");
      return;
    }
    setError(null);
    setImageFile(file);
  };

  const validate = () => {
    if (!content.trim()) return "Write something before publishing.";
    if (content.length > MAX_CHARS) return `Posts are limited to ${MAX_CHARS} characters.`;
    if (rating > 0 && !selectedBook) return "Attach a book to rate it.";
    return null;
  };

  const submit = useMutation({
    mutationFn: async () => {
      const problem = validate();
      if (problem) throw new Error(problem);

      let imagePath: string | null = null;
      if (imageFile) {
        if (!user?.id) throw new Error("You need to be signed in to attach an image.");
        setPhase("uploading");
        const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
        imagePath = path;
      }

      setPhase("publishing");
      return post({
        data: {
          content: content.trim(),
          bookId: selectedBook,
          clubId: selectedClub,
          rating: selectedBook && rating ? rating : null,
          imagePath,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["circle-search"] });
      queryClient.invalidateQueries({ queryKey: ["club-detail"] });
      toast.success("Post shared to your circles");
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => {
      setPhase("idle");
      setError(e.message);
      toast.error(e.message);
    },
  });

  const busy = submit.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => (busy ? null : onOpenChange(v))}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-border bg-paper px-4 pb-8">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base text-ink" style={{ fontFamily: "var(--font-heading)" }}>
            New Post
          </SheetTitle>
        </SheetHeader>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_CHARS}
          placeholder="What are you reading? Share a thought, quote, or question..."
          className="mt-3 min-h-[120px] resize-none rounded-2xl border-border bg-parchment p-4 text-base"
        />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          {content.length}/{MAX_CHARS}
        </p>

        <div className="pt-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickImage(e.target.files?.[0])}
          />
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Attachment preview" className="h-44 w-full rounded-2xl object-cover" />
              <button
                onClick={() => setImageFile(null)}
                aria-label="Remove image"
                className="absolute right-2 top-2 rounded-full bg-ink/70 p-1.5 text-paper"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-2 rounded-full border border-border bg-parchment px-4 py-2 text-xs font-medium text-ink"
            >
              <ImagePlus size={14} /> Add a photo
            </button>
          )}
        </div>

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

        {error && (
          <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-3">
            <p className="text-xs text-secondary">{error}</p>
            <button onClick={() => submit.mutate()} className="shrink-0 text-xs font-semibold text-ink underline">
              Retry
            </button>
          </div>
        )}

        <Button
          onClick={() => submit.mutate()}
          disabled={busy || !content.trim()}
          className="mt-6 h-11 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {busy && <Loader2 size={16} className="mr-2 animate-spin" />}
          {phase === "uploading" ? "Uploading photo…" : phase === "publishing" ? "Publishing…" : "Share post"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
