import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- shared bits ---------------- */

const overlayClass =
  "fixed inset-0 z-[var(--z-overlay,50)] bg-[color-mix(in_oklab,var(--ink-900)_55%,transparent)] " +
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0";

const panelClass =
  "bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-l)]";

const menuClass =
  "z-[var(--z-popover,60)] min-w-48 overflow-hidden rounded-[var(--radius-m)] p-1.5 " +
  panelClass +
  " data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 " +
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95";

const itemClass =
  "flex cursor-pointer select-none items-center gap-2.5 rounded-[var(--radius-xs)] px-2.5 py-2 type-body-sm " +
  "text-[var(--text-secondary)] outline-none transition-colors " +
  "focus:bg-[var(--state-hover)] focus:text-[var(--text-primary)] " +
  "data-[highlighted]:bg-[var(--state-hover)] data-[highlighted]:text-[var(--text-primary)] " +
  "data-[disabled]:pointer-events-none data-[disabled]:text-[var(--state-disabled-text)]";

/* ---------------- Modal ---------------- */

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onOpenChange, trigger, title, description, children, footer, size = "md" }: ModalProps) {
  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size];
  return (
    <DialogPrimitive.Root {...(open === undefined ? {} : { open })} {...(onOpenChange ? { onOpenChange } : {})}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayClass} />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[var(--z-modal,55)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-[var(--radius-xl)] p-6",
            panelClass,
            width,
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <DialogPrimitive.Title className="type-h4">{title}</DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="type-body-sm mt-1.5 text-[var(--text-secondary)]">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="rounded-[var(--radius-xs)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--state-focus-ring)]"
            >
              <X className="h-4 w-4" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          {children && <div className="mt-5">{children}</div>}
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const ModalClose = DialogPrimitive.Close;

/* ---------------- Confirm dialog ---------------- */

export function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  tone = "default",
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  tone?: "default" | "destructive";
}) {
  return (
    <Modal
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
      {...(trigger ? { trigger } : {})}
      title={title}
      {...(description ? { description } : {})}
      size="sm"
      footer={
        <>
          <DialogPrimitive.Close className="h-11 rounded-[var(--radius-s)] border border-[var(--border-strong)] px-5 type-button text-[var(--text-primary)] transition-colors hover:bg-[var(--state-hover)]">
            {cancelLabel}
          </DialogPrimitive.Close>
          <DialogPrimitive.Close
            onClick={onConfirm}
            className={cn(
              "h-11 rounded-[var(--radius-s)] px-5 type-button text-white shadow-[var(--shadow-s)]",
              tone === "destructive" ? "bg-[var(--error)]" : "bg-gradient-primary",
            )}
          >
            {confirmLabel}
          </DialogPrimitive.Close>
        </>
      }
    />
  );
}

/* ---------------- Drawer / side panel ---------------- */

export interface DrawerProps extends Omit<ModalProps, "size"> {
  side?: "right" | "left" | "bottom";
}

export function Drawer({ open, onOpenChange, trigger, title, description, children, footer, side = "right" }: DrawerProps) {
  const position = {
    right: "inset-y-0 right-0 h-full w-[min(26rem,100vw-2rem)] rounded-l-[var(--radius-xl)] data-[state=open]:slide-in-from-right",
    left: "inset-y-0 left-0 h-full w-[min(26rem,100vw-2rem)] rounded-r-[var(--radius-xl)] data-[state=open]:slide-in-from-left",
    bottom: "inset-x-0 bottom-0 max-h-[85vh] rounded-t-[var(--radius-xl)] data-[state=open]:slide-in-from-bottom",
  }[side];
  return (
    <DialogPrimitive.Root {...(open === undefined ? {} : { open })} {...(onOpenChange ? { onOpenChange } : {})}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayClass} />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-[var(--z-modal,55)] flex flex-col p-6",
            panelClass,
            position,
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        >
          {side === "bottom" && (
            <span className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--border-strong)]" aria-hidden />
          )}
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <DialogPrimitive.Title className="type-h4">{title}</DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="type-body-sm mt-1.5 text-[var(--text-secondary)]">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="rounded-[var(--radius-xs)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <div className="mt-5 flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ---------------- Popover ---------------- */

export function Popover({
  trigger,
  children,
  align = "center",
  className,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={8}
          className={cn(
            "z-[var(--z-popover,60)] w-72 rounded-[var(--radius-m)] p-4",
            panelClass,
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            className,
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* ---------------- Dropdown menu ---------------- */

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  tone?: "default" | "destructive";
  separatorBefore?: boolean;
}

function renderItems(
  items: MenuItem[],
  Item: typeof DropdownPrimitive.Item | typeof ContextMenuPrimitive.Item,
  Separator: typeof DropdownPrimitive.Separator | typeof ContextMenuPrimitive.Separator,
) {
  return items.map((item) => (
    <React.Fragment key={item.id}>
      {item.separatorBefore && <Separator className="my-1.5 h-px bg-[var(--border-subtle)]" />}
      <Item
        {...(item.disabled === undefined ? {} : { disabled: item.disabled })}
        {...(item.onSelect ? { onSelect: () => item.onSelect?.() } : {})}
        className={cn(itemClass, item.tone === "destructive" && "text-[var(--error-text)]")}
      >
        {item.icon}
        {item.label}
      </Item>
    </React.Fragment>
  ));
}

export function DropdownMenu({
  trigger,
  items,
  label,
  align = "end",
}: {
  trigger: React.ReactNode;
  items: MenuItem[];
  label?: string;
  align?: "start" | "center" | "end";
}) {
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild>{trigger}</DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content align={align} sideOffset={8} className={menuClass}>
          {label && (
            <DropdownPrimitive.Label className="px-2.5 py-1.5 type-caption text-[var(--text-muted)]">
              {label}
            </DropdownPrimitive.Label>
          )}
          {renderItems(items, DropdownPrimitive.Item, DropdownPrimitive.Separator)}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

/* ---------------- Context menu ---------------- */

export function ContextMenu({ children, items }: { children: React.ReactNode; items: MenuItem[] }) {
  return (
    <ContextMenuPrimitive.Root>
      <ContextMenuPrimitive.Trigger asChild>{children}</ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content className={menuClass}>
          {renderItems(items, ContextMenuPrimitive.Item, ContextMenuPrimitive.Separator)}
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
}

/* ---------------- Tooltip-ish inline hint ---------------- */

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-xs)] bg-[var(--ink-900)] px-2.5 py-1.5 type-caption text-white opacity-0 shadow-[var(--shadow-m)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
