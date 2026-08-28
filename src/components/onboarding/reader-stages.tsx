import type { Option } from "@/lib/reader-onboarding";
import { Check } from "lucide-react";

export function StageHeader({
  eyebrow,
  title,
  copy,
  question,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  question?: string;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
      )}
      <h1
        className="mt-3 text-[30px] leading-[1.15] font-semibold text-ink"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h1>
      {copy && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy}</p>}
      {question && <p className="mt-5 text-base font-medium leading-snug text-ink">{question}</p>}
    </div>
  );
}

function stagger(i: number) {
  return { animationDelay: `${Math.min(i * 35, 350)}ms` } as const;
}

export function ChipGroup({
  options,
  value,
  max,
  onChange,
}: {
  options: Option[];
  value: string[];
  max: number;
  onChange: (next: string[]) => void;
}) {
  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (value.length < max) onChange([...value, id]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o, i) => {
        const selected = value.includes(o.id);
        const disabled = !selected && value.length >= max;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            style={stagger(i)}
            className={`animate-in fade-in slide-in-from-bottom-1 rounded-full border px-4 py-2.5 text-sm font-medium duration-300 fill-mode-both transition-[background-color,color,border-color,transform] active:scale-[0.97] ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : disabled
                  ? "border-border bg-paper text-muted-foreground/60"
                  : "border-border bg-paper text-ink hover:bg-muted"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function CardGroup({
  options,
  value,
  max,
  onChange,
  compact,
}: {
  options: Option[];
  value: string[];
  max: number;
  onChange: (next: string[]) => void;
  compact?: boolean;
}) {
  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (max === 1) onChange([id]);
    else if (value.length < max) onChange([...value, id]);
  }
  return (
    <div className="space-y-2.5">
      {options.map((o, i) => {
        const selected = value.includes(o.id);
        const disabled = !selected && max > 1 && value.length >= max;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            style={stagger(i)}
            className={`animate-in fade-in slide-in-from-bottom-1 flex w-full items-start gap-3 rounded-2xl border text-left duration-300 fill-mode-both transition-[background-color,border-color,transform] active:scale-[0.99] ${
              compact ? "px-4 py-3.5" : "px-5 py-4"
            } ${
              selected
                ? "border-primary bg-primary/[0.07]"
                : disabled
                  ? "border-border bg-paper opacity-55"
                  : "border-border bg-paper hover:bg-muted/60"
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium leading-snug text-ink">{o.label}</span>
              {o.detail && (
                <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">{o.detail}</span>
              )}
            </span>
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-paper"
              }`}
            >
              {selected && <Check size={12} strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function StageProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === step ? "w-7 bg-primary" : i < step ? "w-3 bg-primary/40" : "w-3 bg-border"
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground">
        {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}

export function SelectionHint({ count, max }: { count: number; max: number }) {
  return (
    <p className="text-xs text-muted-foreground">
      {count === 0 ? `Pick up to ${max}` : `${count} of ${max} selected`}
    </p>
  );
}
