# Design Tokens

Token reference for **Circle: Your Reading Community**. Use utility classes and CSS variables — never raw values.

## Colors

Apply with any color utility: `bg-<name>`, `text-<name>`, `border-<name>`, `ring-<name>`, `divide-<name>`, etc.

| Name | CSS variable |
|---|---|
| `ink-900` | `--ink-900` |
| `ink-800` | `--ink-800` |
| `ink-700` | `--ink-700` |
| `ink-600` | `--ink-600` |
| `ink-500` | `--ink-500` |
| `ink-400` | `--ink-400` |
| `ink-300` | `--ink-300` |
| `ink-200` | `--ink-200` |
| `ink-100` | `--ink-100` |
| `ink-50` | `--ink-50` |
| `off-white` | `--off-white` |
| `white` | `--white` |
| `border-subtle` | `--border-subtle` |
| `border-default` | `--border-default` |
| `border-strong` | `--border-strong` |
| `border-brand` | `--border-brand` |
| `gradient-primary` | `--gradient-primary` |
| `gradient-background` | `--gradient-background` |

Standard Tailwind color ramps (blue, green, red, yellow) are available at steps 50–950 — apply with `bg-<hue>-<step>`, `text-<hue>-<step>`, etc.

## Typography

Typography classes (`font-*` for families, `text-*` for sizes):

| Class | CSS variable |
|---|---|
| — | `--gradient-text` |
| `font-heading` | `--font-heading` |
| `font-body` | `--font-body` |
| `font-sans` | `--font-sans` |

## Spacing

Apply with any spacing utility: `p-<name>`, `m-<name>`, `gap-<name>`, `space-<name>`, `w-<name>`, `h-<name>`, etc.

| Name | CSS variable |
|---|---|
| `1` | `--space-1` |
| `2` | `--space-2` |
| `3` | `--space-3` |
| `4` | `--space-4` |
| `5` | `--space-5` |
| `6` | `--space-6` |
| `8` | `--space-8` |
| `10` | `--space-10` |
| `12` | `--space-12` |
| `16` | `--space-16` |
| `20` | `--space-20` |

## Border Radius

Border-radius classes:

| Class | CSS variable |
|---|---|
| `rounded-xs` | `--radius-xs` |
| `rounded-s` | `--radius-s` |
| `rounded-m` | `--radius-m` |
| `rounded-l` | `--radius-l` |
| `rounded-xl` | `--radius-xl` |
| `rounded-pill` | `--radius-pill` |
| `rounded-3xl` | `--radius-3xl` |
| `rounded-4xl` | `--radius-4xl` |

## Shadows

Box-shadow classes:

| Class | CSS variable |
|---|---|
| `shadow-xs` | `--shadow-xs` |
| `shadow-s` | `--shadow-s` |
| `shadow-m` | `--shadow-m` |
| `shadow-l` | `--shadow-l` |
| `shadow-brand` | `--shadow-brand` |
| `shadow-focus` | `--shadow-focus` |

## Other

Reference via `var(--name)` in inline styles or CSS.

| CSS variable |
|---|
| `--surface-highlight` |
| `--state-hover` |
| `--state-active` |
| `--state-selected` |
| `--data-grid` |
| `--gradient-warm` |
| `--gradient-cool` |
| `--gradient-success` |
| `--gradient-feature` |
| `--gradient-dusk` |
| `--gradient-surface-subtle` |
| `--gradient-hover` |
| `--gradient-ink` |
| `--duration-fast` |
| `--duration-base` |
| `--duration-slow` |
| `--ease-standard` |
| `--ease-emphasis` |
| `--transition-base` |
| `--z-base` |
| `--z-sticky` |
| `--z-nav` |
| `--z-dropdown` |
| `--z-overlay` |
| `--z-modal` |
| `--z-toast` |

