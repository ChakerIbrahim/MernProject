# اعتماد — Theme Colors

## Overview

This document is the official quick reference for the **اعتماد (Itimad)** visual color system. Components should use the Tailwind design-token names below instead of raw hexadecimal values.

The source of truth is the `@theme` block in [`client/src/index.css`](../client/src/index.css). The usage guidance is defined in [`information/design.md`](./design.md).

## Core Palette

| Token | Hex value | Tailwind utility examples | Primary usage |
|---|---:|---|---|
| `registry-green` | `#007A3D` | `bg-registry-green`, `text-registry-green`, `border-registry-green` | Primary actions, active navigation, links, approved/open states, brand accent |
| `green-dark` | `#005D2F` | `bg-green-dark`, `hover:bg-green-dark` | Hover and active states for green actions |
| `ink` | `#17202A` | `bg-ink`, `text-ink`, `border-ink` | Headings, primary text, dark surfaces, strong borders |
| `paper` | `#F7F8FA` | `bg-paper`, `text-paper` | Page backgrounds, soft dark-surface text |
| `surface` | `#FFFFFF` | `bg-surface`, `text-surface`, `border-surface` | Cards, forms, tables, modals, white text on dark surfaces |
| `border` | `#E5E7EB` | `border-border` | Standard hairline dividers and low-emphasis borders |
| `text-secondary` | `#667085` | `text-text-secondary`, `placeholder:text-text-secondary` | Helper text, metadata, timestamps, secondary copy |

## Semantic States

| Token | Hex value | Tailwind utility examples | Usage |
|---|---:|---|---|
| `success` | `#16803C` | `text-success`, `bg-success` | Completed, approved, or won states |
| `info` | `#60A5FA` | `border-info`, `text-info`, `focus:ring-info` | Valid form-field state and neutral confirmation |
| `warning` | `#D97706` | `text-warning`, `bg-warning` | Pending, expiring soon, or attention-required states |
| `error` | `#C62828` | `text-error`, `border-error`, `bg-error` | Validation errors, rejected, cancelled, and destructive feedback |

## Recommended Form States

| State | Border treatment | Message treatment |
|---|---|---|
| Default | `border-2 border-ink/20` | No validation message |
| Focus | `focus-visible:outline-1 focus-visible:outline-registry-green` and `focus:ring-1 focus:ring-registry-green` | No validation message |
| Valid after interaction | `border-info focus:border-info focus:ring-1 focus:ring-info` | Optional positive state; do not rely on color alone |
| Invalid | `border-error focus:ring-1 focus:ring-error` | `text-error` message directly below the field |

## Strong Form-Surface Borders

The project uses standard `border-border` for ordinary hairline dividers. High-interaction form surfaces may use the existing `ink` token with a 2px border for clearer affordance:

```jsx
<Card className="border-2 border-ink/15">
  <FormField className="border-2 border-ink/20" />
</Card>
```

Use `border-error` for invalid fields and `border-info` for valid fields. Avoid adding one-off colors or raw hexadecimal values inside components.

## Accessibility and Usage Rules

Color must not be the only signal for a status or validation state. Pair colored borders with a text message, an `aria-invalid` state where applicable, and an accessible description tied through `aria-describedby`.

Use the solid `text-secondary` token for placeholders rather than opacity-reduced variants such as `placeholder:text-text-secondary/70`, because reduced opacity weakens readability.

For keyboard interaction, every interactive control must retain a visible `focus-visible` treatment. Custom file-upload wrappers should expose focus through a parent `focus-within` ring.

The current landing-page palette intentionally contains **no `flag-red` token**. Error red remains available only through the semantic `error` token for validation and destructive feedback.

## Typography Tokens

| Token | Font |
|---|---|
| `font-sans` | IBM Plex Sans Arabic |
| `font-display` | Noto Kufi Arabic |

## Source References

1. [`client/src/index.css`](../client/src/index.css) — active Tailwind theme tokens.
2. [`information/design.md`](./design.md) — project visual-system rules and usage guidance.
