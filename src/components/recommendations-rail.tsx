import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, X, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { dismissRecommendation, getRecommendations, undoRecommendationDismissal } from "@/lib/social.functions";
import { RailSkeleton } from "@/components/home-skeleton";

export function RecommendationsRail() {
  const fetchRecs = useServerFn(getRecommendations);
  const dismissFn = useServerFn(dismissRecommendation);
  const undoFn = useServerFn(undoRecommendationDismissal);
  const queryClient = useQueryClient();
  const [hidden, setHidden] = useState<string[]>([]);

  const { data, isLoading } = useQuery({ queryKey: ["recommendations"], queryFn: () => fetchRecs() });

  const dismiss = useMutation({
    mutationFn: (bookId: string) => dismissFn({ data: { bookId } }),
    onMutate: (bookId) => setHidden((prev) => [...prev, bookId]),
    onError: (e: Error, bookId) => {
      setHidden((prev) => prev.filter((id) => id !== bookId));
      toast.error(e.message);
    },
    onSuccess: (_res, bookId) => {
      toast("Removed from your picks", {
        description: "We'll use this to refine future recommendations.",
        action: {
          label: "Undo",
          onClick: () => {
            void undoFn({ data: { bookId } }).then(() => {
              setHidden((prev) => prev.filter((id) => id !== bookId));
              void queryClient.invalidateQueries({ queryKey: ["recommendations"] });
            });
          },
        },
        icon: <Undo2 size={14} />,
      });
    },
  });

  if (isLoading) {
    return (
      <section className="border-b border-border px-4 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Picked for you</p>
        <RailSkeleton />
      </section>
    );
  }

  const books = (data ?? []).filter((b) => !hidden.includes(b.id));
  if (!books.length) return null;

  return (
    <section className="border-b border-border px-4 py-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Sparkles size={14} className="text-primary" /> Picked for you
      </p>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {books.map((book) => (
          <div key={book.id} className="relative w-44 shrink-0 rounded-2xl border border-border bg-parchment p-3">
            <button
              onClick={() => dismiss.mutate(book.id)}
              aria-label={`Dismiss ${book.title}`}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-paper/90 text-muted-foreground shadow-sm"
            >
              <X size={14} />
            </button>
            <Link to="/books/$id" params={{ id: book.id }}>
              {book.cover_url && (
                <img src={book.cover_url} alt={`${book.title} cover`} loading="lazy" className="h-40 w-full rounded-lg object-cover" />
              )}
              <p className="mt-2 line-clamp-2 text-sm font-medium text-ink">{book.title}</p>
              <p className="text-xs text-muted-foreground">{book.author}</p>
            </Link>
            <ul className="mt-2 space-y-1">
              {(book.reasons.length ? book.reasons : ["Highly rated across Circle"]).slice(0, 2).map((reason) => (
                <li key={reason} className="flex items-start gap-1 text-[11px] leading-snug text-primary">
                  <Sparkles size={10} className="mt-[3px] shrink-0" />
                  <span className="line-clamp-2">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
