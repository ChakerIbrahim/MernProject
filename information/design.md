# design.md — Visual System (Procurement & Auction Platform)

> This file governs **how the UI looks and feels**. It does not govern stack,
> data, or routes — see `skills.md` and `procurement-platform-srs.md` for
> that. This project has **no existing frontend prototype**, unlike
> PalTenders — this file adapts PalTenders' *visual language only* (colors,
> type, spacing, motifs) to a fresh MERN build with plain
> React + Tailwind + react-router-dom. Do not carry over PalTenders'
> tech stack, route map, page inventory, asset files, or copy — only the
> look.

---

## 1. Design Intent

This is an Arabic-first civic/procurement product: tenders, proposals, and
auctions between organizations and individuals, moderated by an admin. The
UI should feel like a calm, official public-record system — precise,
legible, low on decoration — not a generic SaaS dashboard or a flashy
auction site.

| Principle | What it means in practice |
|---|---|
| **Public trust is visible** | Status, dates, and ownership are always shown as explicit labels, in predictable positions — never implied by color alone. |
| **Identity is embedded, not decorative** | Use the green/red accent palette below sparingly and structurally (rules, badges, active states) — never a full Palestinian flag graphic. |
| **One system everywhere** | Public browse pages, the organization dashboard, the admin panel, and auth screens all share the same type scale, spacing, and status-badge pattern. |
| **Quiet confidence** | Prefer whitespace, thin borders, and structured sections over shadows, gradients, or heavy cards. |

---

## 2. Color Tokens

Add these as CSS variables (e.g. in `client/src/index.css`) and reference
them from `tailwind.config.js` under `theme.extend.colors`, rather than
hard-coding hex values in components.

| Token | Hex | Usage |
|---|---|---|
| `registry-green` | `#007A3D` | Primary buttons, active nav, "approved"/"open" status, links |
| `green-dark` | `#005D2F` | Hover/active state of the above |

| `ink` | `#17202A` | Headings, primary text, footer/nav dark surface |
| `paper` | `#F7F8FA` | Page background |
| `surface` | `#FFFFFF` | Cards, forms, tables, modals |
| `border` | `#E5E7EB` | All hairline borders/dividers |
| `text-secondary` | `#667085` | Metadata, helper text, timestamps |
| `success` | `#16803C` | Completed / approved / won |
| `info` | `#60A5FA` | Valid form-field state and neutral confirmation |
| `warning` | `#D97706` | Pending / expiring soon |
| `error` | `#C62828` | Validation errors, rejected, cancelled |

Never use color alone to communicate status (NFR-U style requirement) — pair
every status color with a text label (e.g. "قيد المراجعة", "مقبول",
"مرفوض").

---

## 3. Typography

- UI and body text: **IBM Plex Sans Arabic** (falls back to system sans).
- Large numeric/display moments only (hero stat, big price on an auction,
  page-top headline): **Noto Kufi Arabic**.
- Scale: display `36–48px`, H1 `28–36px`, H2 `22–28px`, H3 `18–22px`,
  body `16px`, metadata `12–14px`.
- Use tabular numerals for prices, reference numbers, and countdowns so
  digits don't jitter as they update (relevant for auction polling).
- Default document direction is `dir="rtl"`, `lang="ar"`. If an English
  toggle is ever added, it must not break layout in `dir="ltr"` — but do not
  build this unless asked; Arabic-only is a safe default for the MVP.

---

## 4. Spacing, Radius, Motion

- Border radius: `10–14px` on cards and inputs, `8px` on buttons/badges.
- Borders: use `1px solid var(--border)` for standard hairline dividers. For
  high-interaction form surfaces that require stronger affordance, use the
  existing `ink` token at controlled opacity with a `2px` border (for example,
  `border-2 border-ink/15` on cards and `border-2 border-ink/20` on inputs).
  Invalid fields use `error`; valid fields may use the light `info` token;
  keyboard focus uses a thin `registry-green` outline.
  This project relies on borders, not heavy shadows, to separate sections.
- Shadow: reserve a single soft shadow (`0 4px 16px rgba(0,0,0,0.06)`) for
  modals/dropdowns only — cards and page sections stay flat.
- Motion: transitions `150–200ms`, ease-out. Respect
  `prefers-reduced-motion`. Every button click, filter change, or bookmark
  toggle should show an immediate visual response (disabled state, spinner,
  or optimistic update) — never a silent wait, per NFR-U3.

---

## 5. Recurring Motifs (adapted, not copied, from PalTenders)

- **Registry rule** — a 3px `registry-green` top or side rule on the page's
  primary heading and on the "featured" tender/auction card in a list. Use
  once per section, not on every card.
- **Status stamp** — a small outlined, rounded-rectangle badge with an icon
  + label for entity status: `قيد المراجعة` (warning), `مفتوح`/`نشط`
  (success/green), `مغلق`/`منتهي` (secondary/gray), `مرفوض` (error). Used
  consistently for organization approval state, tender status, proposal
  status, and auction status — same component, four different label sets.
- **Data rail** — a left-bordered (in RTL: right-bordered) block of
  key-value metadata (deadline, reference number, budget, current bid) used
  on tender/auction detail pages instead of a decorative info card.

**Visual Assets & Imagery**: The project uses original, photorealistic editorial photography generated for the Palestinian market (e.g., `palestine-urban-horizon-hero.jpg`, `palestine-stone-laptop.jpg`, `palestine-arch-opportunity.jpg`) rather than generic SaaS illustrations. It also uses a custom `Icon` component with local motifs (olive branch, shield, gavel) and CSS-based patterns (`palestine-pattern`, `palestine-dots`) inspired by traditional tatreez geometry.

---

## 6. Core Screens & Components

Map the motifs above onto this project's actual entities — do not invent
extra screens beyond what the SRS's functional requirements require.

| Screen | Key components |
|---|---|
| Login / Register | Centered card, `registry-green` primary button, inline field-level errors (NFR-U1/U2) |
| Admin: pending organizations | List of cards with org name, submitted docs link, Approve (green) / Reject (red, with optional reason field) |
| Tender list (public) | Filter bar (category, value) + grid of tender cards, each with status stamp and deadline data rail |
| Tender detail | Header with registry rule, data rail (budget/deadline/category), document list, "submit proposal" action gated by role/ownership |
| Proposal submission | File upload with progress indicator (NFR-U3), AI-extracted price/summary shown with a visible confidence score, editable before final submit |
| Proposal review (tender owner) | Table/list of proposals per tender, each showing extracted data + confidence + Accept/Reject |
| Auction list (public) | Card grid, current price shown with tabular numerals, status stamp (`pending_approval` never shown publicly) |
| Auction detail | Current price prominent (Noto Kufi Arabic numerals), bid form, live-updating price via polling with a subtle "updated" pulse, bid history list |
| Individual: "my auctions" | Simple table — auction name, your bid, status (winning/outbid/won/lost) |
| Notifications | Simple list, unread items marked with `registry-green` dot, not a full color-inverted row |

---

## 7. Accessibility & Responsiveness (NFR-U6, §10 accessibility)

- No horizontal scrolling on mobile viewports (360px+).
- All interactive elements reachable by keyboard, with a visible focus ring
  using `registry-green`.
- Sufficient contrast: body text on `paper`/`surface` must meet WCAG AA.
- Empty states (no tenders, no auctions, no proposals yet) show a short
  explanatory sentence, not a blank area (NFR-U5).
- Destructive actions (delete tender, reject organization/proposal) use
  `error` and require a confirm step — visually distinct from
  non-destructive actions (NFR-U4).

---

## 8. Tailwind Setup Note

This project uses **Tailwind CSS v4** via the `@tailwindcss/vite` plugin. Design tokens are defined CSS-first in `client/src/index.css` using the `@theme` directive, not in a `tailwind.config.js` file.

```css
/* client/src/index.css */
@import "tailwindcss";

@theme {
  --color-registry-green: #007A3D;
  --color-green-dark: #005D2F;

  --color-ink: #17202A;
  --color-paper: #F7F8FA;
  --color-surface: #FFFFFF;
  --color-border: #E5E7EB;
  --color-text-secondary: #667085;
  --color-success: #16803C;
  --color-warning: #D97706;
  --color-error: #C62828;
  --font-sans: "IBM Plex Sans Arabic", sans-serif;
  --font-display: "Noto Kufi Arabic", sans-serif;
}
```
