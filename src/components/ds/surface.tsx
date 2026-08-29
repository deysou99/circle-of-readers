import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const surfaceVariants = cva("relative", {
  variants: {
    variant: {
      standard: "bg-[var(--surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]",
      elevated: "bg-[var(--surface-elevated)] border border-[var(--border-subtle)] shadow-[var(--shadow-m)]",
      sunken: "bg-[var(--surface-sunken)]",
      interactive:
        "bg-[var(--surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-m)] cursor-pointer",
      highlight: "bg-gradient-subtle border border-[var(--border-brand)]",
      gradient: "bg-gradient-feature text-white border-0 shadow-[var(--shadow-l)]",
      outline: "bg-transparent border border-[var(--border-default)]",
    },
    radius: {
      s: "rounded-[var(--radius-s)]",
      m: "rounded-[var(--radius-m)]",
      l: "rounded-[var(--radius-l)]",
      xl: "rounded-[var(--radius-xl)]",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-8",
    },
  },
  defaultVariants: { variant: "standard", radius: "l", padding: "md" },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  as?: "div" | "section" | "article" | "li";
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { className, variant, radius, padding, as: Tag = "div", ...props },
  ref,
) {
  return <Tag ref={ref as never} className={cn(surfaceVariants({ variant, radius, padding }), className)} {...props} />;
});

export function CardHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="type-caption text-[var(--text-muted)]">{eyebrow}</p>}
        <h3 className="type-h4 mt-1 text-[var(--text-primary)]">{title}</h3>
        {description && <p className="type-body-sm mt-1.5 text-[var(--text-secondary)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="type-caption text-[var(--brand-primary)]">{eyebrow}</p>}
        <h2 className="type-h2 mt-2 text-[var(--text-primary)]">{title}</h2>
        {description && <p className="type-body mt-2 max-w-2xl text-[var(--text-secondary)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  trend = "up",
  icon,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: React.ReactNode;
  className?: string;
}) {
  const trendColor =
    trend === "up"
      ? "text-[var(--success-text)] bg-[var(--success-surface)]"
      : trend === "down"
        ? "text-[var(--error-text)] bg-[var(--error-surface)]"
        : "text-[var(--text-secondary)] bg-[var(--surface-sunken)]";
  return (
    <Surface variant="standard" radius="l" padding="md" className={className}>
      <div className="flex items-center justify-between">
        <p className="type-caption text-[var(--text-muted)]">{label}</p>
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
      </div>
      <p className="type-h2 mt-3 text-[var(--text-primary)]">{value}</p>
      {delta && (
        <span className={cn("type-label mt-3 inline-flex rounded-[var(--radius-pill)] px-2.5 py-1", trendColor)}>
          {delta}
        </span>
      )}
    </Surface>
  );
}

export function GradientHighlightCard({
  eyebrow,
  title,
  description,
  action,
  gradient = "feature",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  gradient?: "feature" | "warm" | "cool" | "ink";
}) {
  const map = {
    feature: "bg-gradient-feature",
    warm: "bg-gradient-warm",
    cool: "bg-gradient-cool",
    ink: "bg-gradient-ink",
  } as const;
  const dark = gradient === "warm" || gradient === "cool";
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-l)]",
        map[gradient],
        dark ? "text-[var(--ink-900)]" : "text-white",
      )}
    >
      {eyebrow && <p className="type-caption opacity-80">{eyebrow}</p>}
      <h3 className="type-h2 mt-2 max-w-md text-balance">{title}</h3>
      {description && <p className="type-body mt-3 max-w-md opacity-85">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Surface variant="outline" radius="l" padding="lg" className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-subtle text-[var(--brand-primary)]">
        {icon}
      </div>
      <h3 className="type-h4 mt-4 text-[var(--text-primary)]">{title}</h3>
      {description && <p className="type-body-sm mx-auto mt-2 max-w-sm text-[var(--text-secondary)]">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Surface>
  );
}
