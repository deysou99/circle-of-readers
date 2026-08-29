import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { getRecommendations } from "@/lib/social.functions";

export function RecommendationsRail() {
  const fetchRecs = useServerFn(getRecommendations);
  const { data, isLoading } = useQuery({ queryKey: ["recommendations"], queryFn: () => fetchRecs() });

  if (isLoading || !(data ?? []).length) return null;

  return (
    <section className="border-b border-border px-4 py-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Sparkles size={14} className="text-primary" /> Picked for you
      </p>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {(data ?? []).map((book) => (
          <Link
            key={book.id}
            to="/books/$id"
            params={{ id: book.id }}
            className="w-40 shrink-0 rounded-2xl border border-border bg-parchment p-3"
          >
            {book.cover_url && (
              <img src={book.cover_url} alt={`${book.title} cover`} loading="lazy" className="h-40 w-full rounded-lg object-cover" />
            )}
            <p className="mt-2 line-clamp-2 text-sm font-medium text-ink">{book.title}</p>
            <p className="text-xs text-muted-foreground">{book.author}</p>
            {book.reasons[0] && <p className="mt-1 line-clamp-2 text-[11px] text-primary">{book.reasons[0]}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}
