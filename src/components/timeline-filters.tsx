import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X, Bookmark, BookmarkPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTimelinePreset, getMyClubsForFilter, getTimelinePresets, saveTimelinePreset } from "@/lib/social.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const fetchPresets = useServerFn(getTimelinePresets);
  const savePreset = useServerFn(saveTimelinePreset);
  const removePreset = useServerFn(deleteTimelinePreset);
  const queryClient = useQueryClient();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  const { data: clubs } = useQuery({ queryKey: ["my-clubs-filter"], queryFn: () => fetchClubs() });
  const { data: presets } = useQuery({ queryKey: ["timeline-presets"], queryFn: () => fetchPresets() });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["timeline-presets"] });

  const create = useMutation({
    mutationFn: () => savePreset({ data: { name, type, range, clubId } }),
    onSuccess: () => {
      setNaming(false);
      setName("");
      void invalidate();
      toast.success("View saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const destroy = useMutation({
    mutationFn: (id: string) => removePreset({ data: { id } }),
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const dirty = type !== "all" || range !== "all" || clubId !== null;
  const activePreset = (presets ?? []).find(
    (p) => p.type === type && p.range === range && (p.club_id ?? null) === clubId,
  );

  return (
    <div className="space-y-2 border-b border-border px-4 py-3">
      {(presets ?? []).length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto">
          <Bookmark size={13} className="shrink-0 text-muted-foreground" />
          {(presets ?? []).map((p) => (
            <span
              key={p.id}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                activePreset?.id === p.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-paper text-ink"
              }`}
            >
              <button
                onClick={() =>
                  onChange({ type: p.type as TimelineType, range: p.range as TimelineRange, clubId: p.club_id ?? null })
                }
              >
                {p.name}
              </button>
              <button onClick={() => destroy.mutate(p.id)} aria-label={`Delete ${p.name} view`}>
                <Trash2 size={11} className="text-muted-foreground" />
              </button>
            </span>
          ))}
        </div>
      )}

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
        {dirty && !activePreset && (
          <button
            onClick={() => setNaming((v) => !v)}
            className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-3 py-1.5 text-xs text-primary"
          >
            <BookmarkPlus size={12} /> Save view
          </button>
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

      {naming && (
        <div className="flex items-center gap-2 pt-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this view (e.g. Club progress)"
            className="h-9 rounded-xl border-border bg-paper text-sm"
          />
          <Button
            onClick={() => create.mutate()}
            disabled={!name.trim() || create.isPending}
            className="h-9 shrink-0 rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/90"
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
