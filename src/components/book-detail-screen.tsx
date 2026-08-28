import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBookDetail, setShelfStatus } from "@/lib/circle.functions";
import { toast } from "sonner";

const STATUSES = [
  { label: "Want to Read", value: "want" as const },
  { label: "Reading", value: "reading" as const },
  { label: "Finished", value: "finished" as const },
];

export function BookDetailScreen() {
  const { id } = useParams({ from: "/_authenticated/books/$id" });
  const fetchDetail = useServerFn(getBookDetail);
  const setStatus = useServerFn(setShelfStatus);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["book", id],
    queryFn: () => fetchDetail({ data: { bookId: id } }),
  });

  const mutation = useMutation({
    mutationFn: (status: "want" | "reading" | "finished" | null) =>
      setStatus({ data: { bookId: id, status } }),
    onSuccess: (res) => {
      toast.success(res.status ? "Shelf updated" : "Removed from your shelf");
      queryClient.invalidateQueries({ queryKey: ["book", id] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-paper"><p className="text-sm text-muted-foreground">Loading…</p></div>;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-muted-foreground">Book not found.</p>
      </div>
    );
  }

  const { book, shelfEntry, reviews } = data;

  return (
    <div className="min-h-screen bg-paper pb-6 pt-safe-top">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md">
        <Link to="/books"><ArrowLeft size={22} className="text-ink" /></Link>
        <h1 className="flex-1 truncate text-sm font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{book.title}</h1>
      </header>

      <section className="flex gap-4 px-4 pt-5">
        {book.cover_url && <img src={book.cover_url} alt={book.title} className="h-44 w-28 rounded-xl object-cover shadow-md" />}
        <div className="flex-1">
          <h2 className="text-xl font-semibold leading-tight text-ink" style={{ fontFamily: "var(--font-heading)" }}>{book.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
          <div className="mt-2 flex items-center gap-1 text-sm text-primary">
            <Star size={14} className="fill-primary text-primary" /> {Number(book.rating ?? 0).toFixed(1)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {book.genre} {book.pages ? `• ${book.pages} pages` : ""} {book.published_year ? `• ${book.published_year}` : ""}
          </p>
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="flex gap-2">
          {STATUSES.map((s) => {
            const activeStatus = shelfEntry?.status === s.value;
            return (
              <Button
                key={s.value}
                onClick={() => mutation.mutate(activeStatus ? null : s.value)}
                disabled={mutation.isPending}
                variant={activeStatus ? "default" : "outline"}
                className={`h-10 flex-1 rounded-xl text-xs ${activeStatus ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border-border bg-paper text-ink hover:bg-muted"}`}
              >
                {s.label}
              </Button>
            );
          })}
        </div>
      </section>

      {book.summary && (
        <section className="px-4 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</p>
          <p className="mt-2 text-sm leading-relaxed text-ink">{book.summary}</p>
        </section>
      )}

      <section className="px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reader Notes</p>
        {reviews.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No notes yet. Be the first to post about this book.</p>}
        <div className="mt-3 space-y-3">
          {reviews.map((r) => (
            <Link key={r.id} to="/posts/$id" params={{ id: r.id }} className="flex gap-3 rounded-2xl border border-border bg-parchment p-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={r.author?.avatar_url ?? undefined} />
                <AvatarFallback>{(r.author?.display_name ?? r.author?.username ?? "R").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{r.author?.display_name ?? r.author?.username ?? "Reader"}</p>
                <p className="mt-1 text-sm text-ink">{r.content}</p>
              </div>
              {r.rating ? <span className="text-sm font-semibold text-primary">{r.rating}★</span> : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
