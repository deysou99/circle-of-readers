import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  value,
  onValueChange,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onValueChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)]">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(t.id)}
            className={cn(
              "relative whitespace-nowrap px-4 py-3 type-label transition-colors",
              active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            )}
          >
            {t.label}
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-primary" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onValueChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex gap-1 rounded-[var(--radius-pill)] bg-[var(--surface-sunken)] p-1">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onValueChange(o.id)}
            aria-pressed={active}
            className={cn(
              "rounded-[var(--radius-pill)] px-4 py-2 type-label transition-all duration-200",
              active
                ? "bg-gradient-primary text-white shadow-[var(--shadow-s)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 type-body-sm text-[var(--text-muted)]">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            {item.href && i < items.length - 1 ? (
              <a href={item.href} className="hover:text-[var(--text-primary)]">
                {item.label}
              </a>
            ) : (
              <span className="type-label text-[var(--text-primary)]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SideNav({
  items,
  value,
  onValueChange,
  collapsed,
}: {
  items: { id: string; label: string; icon: React.ReactNode; badge?: string }[];
  value: string;
  onValueChange: (id: string) => void;
  collapsed?: boolean;
}) {
  return (
    <nav className={cn("flex flex-col gap-1", collapsed ? "w-16" : "w-60")}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            onClick={() => onValueChange(item.id)}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-[var(--radius-s)] px-3 py-2.5 type-label transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-[var(--state-selected)] text-[var(--brand-primary-active)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--state-hover)] hover:text-[var(--text-primary)]",
            )}
          >
            {active && !collapsed && (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-primary" aria-hidden />
            )}
            <span className={cn(active && "text-[var(--brand-primary)]")}>{item.icon}</span>
            {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
            {!collapsed && item.badge && (
              <span className="rounded-[var(--radius-pill)] bg-gradient-primary px-2 py-0.5 text-[11px] font-semibold text-white">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "h-9 min-w-9 rounded-[var(--radius-xs)] px-2 type-label transition-colors",
            p === page
              ? "bg-gradient-primary text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--state-hover)]",
          )}
        >
          {p}
        </button>
      ))}
    </nav>
  );
}
