import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Badge / Tag ---------------- */

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 type-label whitespace-nowrap rounded-[var(--radius-pill)] px-2.5 py-1",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--surface-sunken)] text-[var(--text-secondary)]",
        brand: "bg-[var(--state-selected)] text-[var(--brand-primary-active)]",
        gradient: "bg-gradient-primary text-white",
        success: "bg-[var(--success-surface)] text-[var(--success-text)]",
        warning: "bg-[var(--warning-surface)] text-[var(--warning-text)]",
        error: "bg-[var(--error-surface)] text-[var(--error-text)]",
        info: "bg-[var(--info-surface)] text-[var(--info-text)]",
        outline: "border border-[var(--border-default)] text-[var(--text-secondary)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusDot({ status, label }: { status: "online" | "away" | "offline" | "error"; label: string }) {
  const color = {
    online: "bg-[var(--success)]",
    away: "bg-[var(--warning)]",
    offline: "bg-[var(--data-neutral)]",
    error: "bg-[var(--error)]",
  }[status];
  return (
    <span className="inline-flex items-center gap-2 type-body-sm text-[var(--text-secondary)]">
      <span className={cn("h-2 w-2 rounded-full", color)} aria-hidden />
      {label}
    </span>
  );
}

/* ---------------- Alert ---------------- */

const alertTone = {
  info: {
    surface: "bg-[var(--info-surface)] text-[var(--info-text)]",
    bar: "bg-[var(--info)]",
    Icon: Info,
  },
  success: {
    surface: "bg-[var(--success-surface)] text-[var(--success-text)]",
    bar: "bg-[var(--success)]",
    Icon: CheckCircle2,
  },
  warning: {
    surface: "bg-[var(--warning-surface)] text-[var(--warning-text)]",
    bar: "bg-[var(--warning)]",
    Icon: AlertTriangle,
  },
  error: {
    surface: "bg-[var(--error-surface)] text-[var(--error-text)]",
    bar: "bg-[var(--error)]",
    Icon: XCircle,
  },
} as const;

export type AlertTone = keyof typeof alertTone;

export function Alert({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: AlertTone;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { surface, bar, Icon } = alertTone[tone];
  return (
    <div role="status" className={cn("flex gap-3 overflow-hidden rounded-[var(--radius-m)] p-4", surface)}>
      <span className={cn("-my-4 -ml-4 w-1 shrink-0", bar)} aria-hidden />
      <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="type-label">{title}</p>
        {children && <div className="type-body-sm mt-1 opacity-90">{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

/* ---------------- Progress ---------------- */

export function ProgressBar({
  value,
  label,
  tone = "primary",
}: {
  value: number;
  label?: string;
  tone?: "primary" | "cool" | "success";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const fill = { primary: "bg-gradient-primary", cool: "bg-gradient-cool", success: "bg-gradient-success" }[tone];
  return (
    <div>
      {label && (
        <div className="mb-2 flex items-center justify-between type-body-sm text-[var(--text-secondary)]">
          <span>{label}</span>
          <span className="type-label text-[var(--text-primary)]">{clamped}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className="h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-sunken)]"
      >
        <div className={cn("h-full rounded-[var(--radius-pill)] transition-[width] duration-500", fill)} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function ProgressRing({ value, size = 96, label }: { value: number; size?: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <svg width={size} height={size} role="img" aria-label={`${label ?? "Progress"}: ${clamped}%`}>
        <defs>
          <linearGradient id="circle-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--red-500)" />
            <stop offset="100%" stopColor="var(--yellow-400)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#circle-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * clamped) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="52%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="type-h4"
          fill="var(--text-primary)"
        >
          {clamped}%
        </text>
      </svg>
      {label && <span className="type-body-sm text-[var(--text-secondary)]">{label}</span>}
    </div>
  );
}

/* ---------------- Skeleton ---------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[var(--radius-s)] bg-[var(--surface-sunken)]", className)} />;
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 type-body-sm text-[var(--text-secondary)]">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--brand-primary)]"
        aria-hidden
      />
      {label}
    </span>
  );
}
