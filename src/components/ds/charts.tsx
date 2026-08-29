import { cn } from "@/lib/utils";

/** Lightweight, dependency-free chart primitives styled with Circle data tokens. */

export function AreaSpark({
  points,
  height = 120,
  label,
}: {
  points: number[];
  height?: number;
  label: string;
}) {
  const max = Math.max(...points, 1);
  const step = 100 / (points.length - 1);
  const line = points.map((p, i) => `${i * step},${100 - (p / max) * 92}`).join(" ");
  return (
    <figure>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }} className="w-full" role="img" aria-label={label}>
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--red-500)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--yellow-400)" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--data-grid)" strokeWidth="0.4" />
        ))}
        <polygon points={`0,100 ${line} 100,100`} fill="url(#area-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--data-primary)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption className="type-body-sm mt-2 text-[var(--text-muted)]">{label}</figcaption>
    </figure>
  );
}

export function BarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <figure>
      <div className="flex h-36 items-end gap-2" role="img" aria-label={label}>
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-[var(--radius-xs)] bg-gradient-warm transition-[height] duration-500"
              style={{ height: `${(d.value / max) * 100}%` }}
            />
            <span className="type-caption text-[var(--text-muted)]">{d.label}</span>
          </div>
        ))}
      </div>
      <figcaption className="type-body-sm mt-3 text-[var(--text-muted)]">{label}</figcaption>
    </figure>
  );
}

export function DonutChart({
  segments,
  label,
}: {
  segments: { label: string; value: number; color: string }[];
  label: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <figure className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 100 100" role="img" aria-label={label}>
        {segments.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="12"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <figcaption className="space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 type-body-sm text-[var(--text-secondary)]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.label}
            <span className="type-label text-[var(--text-primary)]">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}

export function ActivityGrid({ weeks = 16, label }: { weeks?: number; label: string }) {
  const cells = Array.from({ length: weeks * 7 }, (_, i) => (i * 37) % 5);
  const tone = [
    "bg-[var(--surface-sunken)]",
    "bg-[color-mix(in_oklab,var(--red-500)_18%,transparent)]",
    "bg-[color-mix(in_oklab,var(--red-500)_40%,transparent)]",
    "bg-[color-mix(in_oklab,var(--red-500)_68%,transparent)]",
    "bg-[var(--red-500)]",
  ];
  return (
    <figure>
      <div className="grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label={label}>
        {cells.map((v, i) => (
          <span key={i} className={cn("h-3 w-3 rounded-[3px]", tone[v])} />
        ))}
      </div>
      <figcaption className="type-body-sm mt-3 text-[var(--text-muted)]">{label}</figcaption>
    </figure>
  );
}
