---
name: react-component
description: Best practices for writing React components in this project — file placement, props, state, data fetching, forms with server-driven validation errors, Tailwind design tokens, accessibility, and RTL/Arabic correctness. Use this skill whenever creating, editing, refactoring, or reviewing ANY React component, page, form, table, card, modal, or hook — including when the user just says "build the tender list page", "add a bid form", "make this look right in Arabic", or asks why a layout is mirrored wrong. Also use it when reviewing existing JSX for RTL bugs or accessibility gaps, even if the user does not mention React by name.
---

# Writing React Components

This project is an **Arabic-first, RTL-by-default** procurement and auction platform. Plain React (Vite) + Tailwind + react-router-dom + axios. No component library, no TypeScript, no state-management library.

Two consequences shape everything below:

1. **RTL is not a feature flag.** The words `left` and `right` in a class name are bugs until proven otherwise. Retrofitting RTL costs more than building it in.
2. **The server is the source of truth for validation.** Client-side checks are advisory (AGENTS.md). Components render errors the API returns; they do not invent their own rules.

---

## 1. Before writing anything

Answer these three questions. They determine where the file goes and what it may contain.

| Question | If yes |
|---|---|
| Does it own a route? | `src/pages/` — fetches data, owns page state, composes components |
| Is it reused across pages? | `src/components/` — receives everything via props, fetches nothing |
| Is it non-visual logic? | `src/functions/` — plain function, no JSX |

**Pages fetch. Components render.** A component in `src/components/` that calls axios is a design error — it can't be reused, tested, or reasoned about, and it will fetch twice when rendered twice. Push the call up to the page and pass data down.

The one exception: a genuinely self-contained widget with its own lifecycle (a live-updating auction price that polls on its own). Even then, prefer passing data down until the prop-drilling actually hurts.

---

## 2. Component anatomy

Keep a consistent order. Reviewers should find things in the same place every time.

```jsx
import { useEffect, useState } from "react";
import axios from "axios";
import StatusStamp from "../components/StatusStamp";

/**
 * @param {object} tender
 * @param {(id: string) => void} onSelect
 */
const TenderCard = ({ tender, onSelect }) => {
  // 1. hooks — always first, never conditional
  const [isSaving, setIsSaving] = useState(false);

  // 2. derived values — computed, not stored
  const isClosed = new Date(tender.deadline) < new Date();

  // 3. handlers
  const handleSelect = () => onSelect(tender._id);

  // 4. early returns for edge states
  if (!tender) return null;

  // 5. render
  return ( /* ... */ );
};

export default TenderCard;
```

**Rules that matter:**

- One component per file. The file is named after it: `TenderCard.jsx`.
- Hooks run unconditionally at the top. A hook inside an `if` or after an early return breaks React's ordering assumption and produces bugs that look random.
- Destructure props in the signature. It documents the interface at a glance.
- Under ~150 lines. Past that, look for a sub-component wanting to exist — usually the thing inside `.map()`.

---

## 3. Props

**Name for meaning, not mechanism.** `isOwner` beats `showEditButton` — the first survives a design change, the second doesn't.

**Handlers are `onSomething`, receiving the payload not the event:**

```jsx
// good — parent doesn't care that a click caused it
<TenderCard onSelect={(id) => navigate(`/tenders/${id}`)} />

// avoid — leaks the DOM event upward
<TenderCard onClick={(e) => ...} />
```

**Booleans default to `false`, and read positively.** `disabled` not `notEnabled`; `isApproved` not `isNotApproved`. Double negatives in JSX conditionals are where bugs hide.

**Never spread unknown props onto DOM elements** (`<div {...props}>`). It silently passes React-only props to the DOM and produces console warnings that train people to ignore console warnings.

**Document props with a JSDoc block.** There's no TypeScript here, so this comment is the only interface contract a future reader gets.

---

## 4. State

**Derive, don't duplicate.** If a value can be computed from existing state or props, compute it during render.

```jsx
// good
const highestBid = bids.length ? Math.max(...bids.map((b) => b.amount)) : auction.startingPrice;

// bad — now there are two sources of truth and one will drift
const [highestBid, setHighestBid] = useState(0);
useEffect(() => { setHighestBid(...); }, [bids]);
```

**`useEffect` is for synchronising with something outside React** — the network, a timer, the document. It is not for reacting to your own state changes. An effect whose only job is calling `setState` in response to other state is almost always a derived value in disguise.

**Group state that changes together, split state that doesn't.** Four separate `useState` calls for four independent form fields is correct and readable. One object holding `{ data, isLoading, error }` is correct because those three change as a unit.

**Never mutate.** `setItems([...items, next])`, `setItems(items.filter(...))`, `setItems(items.map(...))`. React compares by reference — mutating an array in place changes nothing on screen.

---

## 5. Data fetching, and the four states

Every fetch has **four** possible renders, and NFR-U3/U5 require three of them explicitly. Handling only "loading" and "data" is the most common failure in this codebase.

```jsx
const TenderListPage = () => {
  const [tenders, setTenders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTenders = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/tenders", { withCredentials: true });
      setTenders(res.data.tenders);
    } catch (err) {
      setError(err.response?.data?.message ?? "تعذّر تحميل العطاءات. حاول مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  if (isLoading) return <Spinner label="جاري التحميل…" />;
  if (error) return <ErrorState message={error} onRetry={fetchTenders} />;
  if (!tenders.length) return <EmptyState message="لا توجد عطاءات منشورة حالياً." />;

  return ( /* the list */ );
};
```

**Error messages shown to users are Arabic and human** (NFR-U). Never render a raw exception or a status code. Fall back to a written sentence when the server sends nothing usable.

**Polling must clean up.** Auction pages poll every 3–5s (NFR-P2). An interval that outlives its component keeps firing against a torn-down state setter:

```jsx
useEffect(() => {
  const id = setInterval(fetchAuction, 4000);
  return () => clearInterval(id);
}, [auctionId]);
```

The returned function is the cleanup. Forgetting it is why "the app gets slower the longer you use it".

---

## 6. Forms and server-driven errors

The server returns a per-field error map (AGENTS.md, HTTP 400). Components display it; they do not duplicate the rules.

```jsx
const [errors, setErrors] = useState({});

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await axios.post("/api/tenders", form, { withCredentials: true });
    navigate("/tenders");
  } catch (err) {
    setErrors(err.response?.data?.errors ?? {});
  }
};
```

**On failure, keep the user's input** (NFR-U2). Never reset form state in a `catch`.

**Every field ties its message to its input.** A red border alone is invisible to a screen reader:

```jsx
const FormField = ({ id, label, value, onChange, error, dir }) => {
  const errorId = `${id}-error`;
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block mb-1 text-ink">{label}</label>
      <input
        id={id}
        dir={dir}
        value={value}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-[10px] border px-3 py-2 ${
          error ? "border-error" : "border-border"
        }`}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
};
```

`aria-invalid` should be `undefined` when valid, not `false` — `false` makes some screen readers announce "invalid: false". `role="alert"` is what causes the message to be spoken when it appears.

**Disable the submit button while the request is in flight** and say so. A second click that fires a second POST is a real bug in a bidding system.

---

## 7. RTL — the part that gets skipped

The document is `dir="rtl" lang="ar"`. Everything below assumes that and must survive it.

### 7.1 Use logical utilities, never physical ones

| Never | Always | Meaning |
|---|---|---|
| `ml-4` | `ms-4` | margin-inline-start |
| `mr-4` | `me-4` | margin-inline-end |
| `pl-4` | `ps-4` | padding-inline-start |
| `pr-4` | `pe-4` | padding-inline-end |
| `left-0` | `start-0` | inset-inline-start |
| `right-0` | `end-0` | inset-inline-end |
| `text-left` | `text-start` | |
| `text-right` | `text-end` | |
| `border-l` | `border-s` | |
| `border-r` | `border-e` | |
| `rounded-l-lg` | `rounded-s-lg` | |
| `float-left` | `float-end`* | *think about which you mean |

Symmetrical utilities (`px-4`, `mx-2`, `p-6`) are already direction-neutral — use them freely.

**Treat `left`/`right` in a diff as a review blocker.** If a physical property is genuinely intended (a logo that must always sit on the same side), leave a comment saying why.

### 7.2 Gaps, not space-between-children

Prefer `flex gap-4` over `space-x-4`. `gap` is direction-agnostic by construction and sidesteps the whole question.

`flex-row` already follows the writing direction — it lays out right-to-left under `dir="rtl"` with no help. Don't "fix" it with `flex-row-reverse`; that double-flips and breaks in LTR.

### 7.3 Flip directional icons — and only those

```jsx
// back/next arrows, chevrons, send icons, progress carets
<ArrowIcon className="w-5 h-5 rtl:-scale-x-100" />
```

Do **not** flip: checkmarks, hearts, play buttons, avatars, close (×), external-link arrows, brand marks. Over-flipping looks as broken as under-flipping. Keep the directional set small and explicit — a `<DirectionalIcon>` wrapper is worth it once you have more than three.

### 7.4 Force LTR on inherently-LTR content

Email addresses, URLs, phone numbers, reference numbers, and passwords are LTR regardless of page direction. Set it on the element:

```jsx
<input type="email" dir="ltr" className="text-start" />
<span dir="ltr">+970 59 123 4567</span>
```

Getting this wrong renders `+970` as `970+` — visibly broken to every Arabic reader.

### 7.5 Isolate mixed content with `<bdi>`

Arabic prose containing a Latin term or a number can reorder unpredictably around punctuation:

```jsx
<p>تم رفع الملف <bdi>{fileName}</bdi> بنجاح.</p>
<p>السعر الحالي: <bdi>{price}</bdi> شيكل</p>
```

`<bdi>` tells the browser's bidi algorithm to treat the contents as one isolated run. Use it for any interpolated value you don't control — filenames, usernames, org names.

### 7.6 Numbers

Prices, bids, countdowns, and reference numbers use **tabular numerals** so digits don't jitter as they update during polling (design.md §3):

```jsx
<span className="tabular-nums" dir="ltr">{currentPrice}</span>
```

Use Western digits (0123) throughout — the convention for technical and financial content in Arabic UIs.

### 7.7 Test with real Arabic

Mirrored Latin placeholder text exposes none of these bugs. Test with actual Arabic strings, including one long word in a narrow container and one sentence with an embedded Latin term.

---

## 8. Styling

**Use the design tokens, never raw hex.** Tailwind 4 (this project uses `@tailwindcss/vite`) defines them CSS-first in `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --color-registry-green: #007A3D;
  --color-green-dark: #005D2F;
  --color-flag-red: #CE1126;
  --color-ink: #17202A;
  --color-paper: #F7F8FA;
  --color-surface: #FFFFFF;
  --color-border: #E5E7EB;
  --color-text-secondary: #667085;
}
```

> Note: `design.md` shows a `tailwind.config.js` with `theme.extend.colors`. That's the Tailwind 3 form. On Tailwind 4 the `@theme` block above is the current equivalent — pick one and be consistent, don't maintain both.

**Borders, not shadows.** This project separates sections with `border border-border`. One soft shadow exists, reserved for modals and dropdowns.

**Status is never colour alone** (design.md §2, accessibility). Every status renders as a `StatusStamp` with both a colour and an Arabic label — `مفتوح`, `قيد المراجعة`, `مرفوض`, `مغلق`. A colour-blind user and a screen-reader user must both get the status.

**Destructive actions are visually distinct** (NFR-U4): `flag-red`, and a confirm step before the action fires.

---

## 9. Accessibility baseline

- Use the semantic element. A clickable `<div>` isn't focusable and isn't announced — use `<button>`. Navigation uses `<Link>`, not a `<div onClick={navigate}>`.
- Every input has a `<label htmlFor>`. Placeholder text is not a label; it disappears on focus.
- Visible focus ring, in `registry-green`: `focus-visible:outline-2 focus-visible:outline-registry-green`.
- Lists that update live (bid history, notifications) get `aria-live="polite"` so additions are announced.
- Every `<img>` has `alt`. Decorative images get `alt=""`, not a description.
- Nothing horizontally scrolls at 360px (NFR-U6).

---

## 10. Anti-patterns

| Pattern | Why it's wrong |
|---|---|
| `ml-4`, `text-right`, `left-0` | Breaks in RTL — the whole app's default direction |
| axios inside `src/components/` | Not reusable; double-fetches when rendered twice |
| Client-side validation as the only check | Server is authoritative (AGENTS.md); trivially bypassed |
| `catch` that resets form state | Violates NFR-U2 — destroys the user's typing |
| Missing empty state | Violates NFR-U5 — a blank region reads as a broken page |
| `setInterval` without cleanup | Leaks; keeps polling after unmount |
| `key={index}` in a list | Wrong row updates after a delete or reorder — use `_id` |
| Raw error text from the API | Violates the "clear, non-technical messages" requirement |
| `aria-invalid={false}` | Announces "invalid: false" — use `undefined` |
| Hard-coded `#007A3D` | Bypasses the token; diverges when the palette changes |
| Colour-only status | Fails accessibility and design.md §2 |
| Reading `role` from a response body | Trust only the verified JWT payload (AGENTS.md) |

---

## 11. Review checklist

Before considering a component done:

- [ ] Correct folder — page fetches, component receives props
- [ ] No `left`/`right`/`ml-`/`pr-` anywhere; logical utilities throughout
- [ ] Directional icons flip; non-directional ones don't
- [ ] Email/URL/phone fields carry `dir="ltr"`
- [ ] Interpolated values in Arabic prose wrapped in `<bdi>`
- [ ] Prices and countdowns use `tabular-nums`
- [ ] Loading, error, and empty states all render something
- [ ] Errors are Arabic sentences, not exceptions or codes
- [ ] Form errors come from the server's field map and preserve input
- [ ] Each error tied to its input with `aria-describedby` + `role="alert"`
- [ ] Submit disabled while in flight
- [ ] Any interval or subscription cleaned up
- [ ] `key` is a stable id
- [ ] Colours from tokens; status has a text label
- [ ] Keyboard-reachable with a visible focus ring
- [ ] No horizontal scroll at 360px, checked with real Arabic text
