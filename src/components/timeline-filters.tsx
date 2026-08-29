import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { getMyClubsForFilter } from "@/lib/social.functions";

export type TimelineType = "all" | "posts" | "books" | "progress";
export type TimelineRange = "all" | "today" | "week" | "month";

const TYPES: { value: TimelineType; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "posts", label: "Posts" },
  { value: "books", label: "Books" },
  { value: "progress", label: "Progress" },
];

const RANGES: { value: TimelineRange; label: string }[] = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

export function TimelineFilters({
  type,
  range,
  clubId,
  onChange,
}: {
  type: TimelineType;
  range: TimelineRange;
  clubId: string | null;
  onChange: (next: { type?: TimelineType; range?: TimelineRange; clubId?: string | null }) => void;
}) {
  const fetchClubs = useServerFn(getMyClubsForFilter);
  const { data: clubs } = useQuery({ queryKey: ["my-clubs-filter"], queryFn: () => fetchClubs() });

  const dirty = type !== "all" || range !== "all" || clubId !== null;

  return (
    <div className="space-y-2 border-b border-border px-4 py-3">
      <div className="flex gap-2 overflow-x-auto">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange({ type: t.value })}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              type === t.value ? "bg-primary text-primary-foreground" : "border border-border bg-paper text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => onChange({ range: r.value })}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors ${
              range === r.value ? "bg-forest text-paper" : "border border-border bg-paper text-muted-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
        {(clubs ?? []).length > 0 && (
          <select
            value={clubId ?? ""}
            onChange={(e) => onChange({ clubId: e.target.value || null })}
            aria-label="Filter timeline by circle"
            className="h-8 shrink-0 rounded-full border border-border bg-paper px-3 text-xs text-ink"
          >
            <option value="">All circles</option>
            {(clubs ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        {dirty && (
          <button
            onClick={() => onChange({ type: "all", range: "all", clubId: null })}
            className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-secondary"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
