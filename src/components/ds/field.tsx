import * as React from "react";
import { cn } from "@/lib/utils";

type FieldState = "default" | "error" | "success";

const controlBase =
  "w-full bg-[var(--surface)] text-[var(--text-primary)] type-body placeholder:text-[var(--text-muted)] " +
  "rounded-[var(--radius-s)] border px-3.5 transition-[border-color,box-shadow,background] duration-200 " +
  "focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] " +
  "disabled:bg-[var(--state-disabled-surface)] disabled:text-[var(--state-disabled-text)] disabled:cursor-not-allowed";

function stateBorder(state: FieldState) {
  return state === "error"
    ? "border-[var(--error)]"
    : state === "success"
      ? "border-[var(--success)]"
      : "border-[var(--border-default)] hover:border-[var(--border-strong)]";
}

export function Field({
  label,
  hint,
  error,
  success,
  required,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  success?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="type-label block text-[var(--text-primary)]">
        {label}
        {required && <span className="ml-1 text-[var(--error)]">*</span>}
      </label>
      {children}
      {error ? (
        <p className="type-body-sm text-[var(--error-text)]">{error}</p>
      ) : success ? (
        <p className="type-body-sm text-[var(--success-text)]">{success}</p>
      ) : hint ? (
        <p className="type-body-sm text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  state?: FieldState;
  leadingIcon?: React.ReactNode;
  trailingSlot?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, state = "default", leadingIcon, trailingSlot, ...props },
  ref,
) {
  return (
    <div className="relative">
      {leadingIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          {leadingIcon}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={state === "error" || undefined}
        className={cn(
          controlBase,
          stateBorder(state),
          "h-11",
          leadingIcon && "pl-10",
          trailingSlot && "pr-11",
          className,
        )}
        {...props}
      />
      {trailingSlot && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailingSlot}</span>}
    </div>
  );
});

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { state?: FieldState }
>(function TextArea({ className, state = "default", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={state === "error" || undefined}
      className={cn(controlBase, stateBorder(state), "min-h-28 resize-y py-3", className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { state?: FieldState }
>(function Select({ className, state = "default", ...props }, ref) {
  return (
    <select ref={ref} className={cn(controlBase, stateBorder(state), "h-11 appearance-none pr-9", className)} {...props} />
  );
});

export function Checkbox({
  label,
  description,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  const id = React.useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] checked:border-transparent checked:bg-[var(--brand-primary)] checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%2220 6 9 17 4 12%22/></svg>')] bg-[length:14px] bg-center bg-no-repeat disabled:bg-[var(--state-disabled-surface)]"
        {...props}
      />
      <span className="min-w-0">
        <span className="type-body block text-[var(--text-primary)]">{label}</span>
        {description && <span className="type-body-sm block text-[var(--text-muted)]">{description}</span>}
      </span>
    </label>
  );
}

export function Radio({
  label,
  name,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const id = React.useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
      <input
        id={id}
        type="radio"
        name={name}
        className="h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-full border border-[var(--border-strong)] bg-[var(--surface)] checked:border-[6px] checked:border-[var(--brand-primary)]"
        {...props}
      />
      <span className="type-body text-[var(--text-primary)]">{label}</span>
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-7 w-12 shrink-0 items-center rounded-[var(--radius-pill)] p-0.5 transition-colors duration-200 disabled:opacity-50",
        checked ? "bg-gradient-primary" : "bg-[var(--border-strong)]",
      )}
    >
      <span
        className={cn(
          "h-6 w-6 rounded-full bg-white shadow-[var(--shadow-s)] transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function Slider({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
}: {
  label: string;
  value: number;
  onValueChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between type-body-sm text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="type-label text-[var(--text-primary)]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-[var(--radius-pill)] outline-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[var(--brand-primary)] [&::-webkit-slider-thumb]:shadow-[var(--shadow-s)]"
        style={{
          background: `linear-gradient(90deg, var(--red-500) 0%, var(--yellow-400) ${pct}%, var(--surface-sunken) ${pct}%, var(--surface-sunken) 100%)`,
        }}
      />
    </div>
  );
}

export function FileUpload({ hint = "PNG or JPG up to 5 MB" }: { hint?: string }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-m)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-sunken)] px-6 py-8 text-center transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--state-selected)]">
      <span className="type-label text-[var(--text-primary)]">Drop a cover image here</span>
      <span className="type-body-sm text-[var(--text-muted)]">{hint}</span>
      <input type="file" className="sr-only" />
    </label>
  );
}
