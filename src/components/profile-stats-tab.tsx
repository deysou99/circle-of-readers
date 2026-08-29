import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReadingInsights } from "@/lib/profile-tabs.functions";
import {
  BookOpen, BookMarked, Bookmark, Star, PenLine, MessageSquareText, Heart,
  Users, Target, Flame, CalendarRange, Layers, FileText, TrendingUp,
} from "lucide-react";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export function ProfileStatsTab() {
  const fetchInsights = useServerFn(getReadingInsights);
  const [year, setYear] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reading-insights", year],
    queryFn: () => fetchInsights({ data: { year } }),
  });

  const i = data?.insights;
  const years = data?.years ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Chip active={year === null} onClick={() => setYear(null)}>All time</Chip>
        {years.map((y) => (
          <Chip key={y} active={year === y} onClick={() => setYear(y)}>{y}</Chip>
        ))}
      </div>

      {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Crunching your reading data…</p>}

      {i && (
        <>
          {/* headline */}
          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-parchment to-parchment p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {year ? `${year} reading` : "Lifetime reading"}
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-semibold text-ink" style={{ fontFamily: "var(--font-heading)" }}>{i.booksRead}</span>
              <span className="pb-1 text-sm text-muted-foreground">books finished</span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Goal · {i.goal} books</span>
                <span className="font-medium text-ink">{i.goalPercent}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${i.goalPercent}%` }} />
              </div>
            </div>
          </div>

          {/* 12 insight tiles */}
          <div className="grid grid-cols-2 gap-2">
            <Stat icon={FileText} label="Pages read" value={i.pagesRead.toLocaleString()} tone="text-primary" />
            <Stat icon={Layers} label="Avg. book length" value={`${i.avgPages} p`} tone="text-forest" />
            <Stat icon={BookOpen} label="Currently reading" value={i.currentlyReading} tone="text-primary" />
            <Stat icon={Bookmark} label="Want to read" value={i.wantToRead} tone="text-secondary" />
            <Stat icon={Star} label="Avg. rating" value={i.avgRating || "—"} tone="text-secondary" />
            <Stat icon={BookMarked} label="Books rated" value={i.ratedBooks} tone="text-forest" />
            <Stat icon={PenLine} label="Reviews written" value={i.reviewsWritten} tone="text-primary" />
            <Stat icon={MessageSquareText} label="Posts published" value={i.postsPublished} tone="text-forest" />
            <Stat icon={Heart} label="Likes received" value={i.likesReceived} tone="text-secondary" />
            <Stat icon={Users} label="Circles joined" value={i.clubsJoined} tone="text-forest" />
            <Stat icon={Flame} label="Best monthly streak" value={`${i.bestStreak} mo`} tone="text-secondary" />
            <Stat icon={TrendingUp} label="Books / month" value={i.avgPerMonth} tone="text-primary" />
          </div>

          {/* rhythm */}
          <div className="rounded-3xl border border-border bg-parchment p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarRange size={12} /> Reading rhythm
            </p>
            <div className="mt-4 flex h-28 items-end gap-1.5">
              {i.monthly.map((m, idx) => {
                const max = Math.max(1, ...i.monthly.map((x) => x.count));
                return (
                  <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-primary/80 transition-all"
                      style={{ height: `${Math.max(4, (m.count / max) * 88)}px` }}
                      title={`${m.count} books`}
                    />
                    <span className="text-[9px] text-muted-foreground">{MONTHS[idx]}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{i.activeMonths} active reading months</p>
          </div>

          {/* genres */}
          <div className="rounded-3xl border border-border bg-parchment p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top genres</p>
            {i.topGenres.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Finish a few books to see your genre mix.</p>}
            <div className="mt-3 space-y-2">
              {i.topGenres.map((g) => {
                const max = i.topGenres[0]?.count ?? 1;
                return (
                  <div key={g.genre}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink">{g.genre}</span>
                      <span className="text-muted-foreground">{g.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-forest" style={{ width: `${(g.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {i.longestBook && (
            <div className="rounded-3xl border border-border bg-parchment p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Longest read</p>
              <p className="mt-1 text-sm font-medium text-ink">{i.longestBook.title}</p>
              <p className="text-xs text-muted-foreground">{i.longestBook.pages} pages</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "border border-border bg-paper text-ink hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-parchment p-3">
      <Icon size={16} className={tone} />
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
