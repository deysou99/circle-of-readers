import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Circle button. Gradient is reserved for the single most important
 * action on a surface — everything else uses solid, outline or ghost.
 */
export const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 type-button whitespace-nowrap select-none " +
    "transition-[background,box-shadow,transform,color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--state-focus-ring)] " +
    "disabled:pointer-events-none disabled:bg-none disabled:bg-[var(--state-disabled-surface)] disabled:text-[var(--state-disabled-text)] disabled:shadow-none " +
    "active:scale-[0.98] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-primary text-[var(--text-on-brand)] shadow-[var(--shadow-brand)] bg-[length:160%_160%] bg-[position:0%_50%] hover:bg-[position:100%_50%] hover:shadow-[var(--shadow-l)]",
        secondary:
          "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-[var(--shadow-xs)] hover:bg-[var(--surface-interactive)]",
        outline:
          "bg-transparent text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--state-hover)]",
        ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--state-hover)] hover:text-[var(--text-primary)]",
        destructive:
          "bg-[var(--error)] text-white shadow-[var(--shadow-s)] hover:bg-[var(--brand-primary-hover)]",
        success: "bg-gradient-success text-[var(--ink-900)] shadow-[var(--shadow-s)]",
      },
      size: {
        sm: "h-9 rounded-[var(--radius-xs)] px-3 text-[0.8125rem]",
        md: "h-11 rounded-[var(--radius-s)] px-5",
        lg: "h-13 rounded-[var(--radius-m)] px-7 text-base",
        icon: "h-11 w-11 rounded-[var(--radius-s)] p-0",
        "icon-round": "h-11 w-11 rounded-full p-0",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface DSButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, DSButtonProps>(function Button(
  { className, variant, size, block, loading, leadingIcon, trailingIcon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});

export interface IconButtonProps extends Omit<DSButtonProps, "children" | "size"> {
  label: string;
  icon: React.ReactNode;
  shape?: "round" | "square";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, shape = "round", variant = "secondary", ...props },
  ref,
) {
  return (
    <Button ref={ref} aria-label={label} title={label} variant={variant} size={shape === "round" ? "icon-round" : "icon"} {...props}>
      {icon}
    </Button>
  );
});
