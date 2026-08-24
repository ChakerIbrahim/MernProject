# Sprint 03 — Tenders

**Goal:** the first real business entity. An approved organization publishes tenders; any authenticated user browses and filters them; the owner edits and closes; an admin moderates anything.

## MANDATORY — read before writing any code

Read **every** document in `/information` before starting this sprint. Do not
begin coding from this sprint file alone.

| # | File | Why |
|---|---|---|
| 1 | `/information/AGENTS.md` | Build commands, stack versions, folder structure, and the non-negotiable conventions (roles, uploads, AI, email, error handling, secrets) |
| 2 | `/information/procurement-platform-srs.md` | The authoritative requirement IDs. **If this sprint file and the SRS disagree, the SRS wins — stop and report the conflict** |
| 3 | `/information/requirements.md` | Arabic requirement list and the Definition of Done applied to every sprint |
| 4 | `/information/design.md` | Colour tokens, typography, spacing, motifs, screen inventory. Never invent a colour or a component style |
| 5 | `/information/skills/react-component/SKILL.md` | How every React component in this project must be written, including all RTL rules |
| 6 | `/information/SPRINT_PLAN.md` | Where this sprint sits, global conventions, and the Definition of Done |

`PalTenders_Full-Stack_Build_Specification.md` is **reference only** — visual
language, nothing else. Do not copy its stack, routes, pages, assets, or copy.

Then re-read this file and begin.

---

## Requirements covered

FR-6 (create), FR-7 (browse and filter), FR-8 (edit, close, admin moderation), DATA-1…DATA-3, NFR-U1…U5.

## In scope

Tender model, full CRUD with ownership rules, category and budget filtering, and the three-way permission model (owner / admin / other).

## Out of scope

Proposals — Sprint 04. The tender detail page gets a "submit proposal" button that is present but disabled with an Arabic "coming soon" tooltip, so the layout is settled before Sprint 04 fills it in.

---

## Data model — `Tender` (SRS §5.2)

| Field | Type | Constraints |
|---|---|---|
| `title` | String | Required |
| `description` | String | Required |
| `category` | String | Required |
| `budgetEstimate` | Number | Optional |
| `deadline` | Date | Required, **must be in the future** |
| `createdBy` | ObjectId → User | Required |
| `status` | String | Enum `open` / `closed` / `cancelled`, default `open` |

The future-date rule is a custom validator, since Mongoose has no built-in for it:

```js
deadline: {
  type: Date,
  required: [true, "الموعد النهائي مطلوب"],
  validate: {
    validator: (value) => value > new Date(),
    message: "يجب أن يكون الموعد النهائي في المستقبل",
  },
},
```

Note this validator does **not** run on update unless the update passes `{ runValidators: true }`. Set it on every update path or a tender can be edited into the past.

`category` should be an `enum` of a fixed Arabic list so the filter has stable values to match against. Agree the list once and use it in both the schema and the create form.

---

## Backend tasks

1. **`models/tender.model.js`** — as above. Validation lives here only (NFR-M3).
2. **`controllers/tender.controller.js`**
   - `createTender` — `createdBy` from `req.user.id`, **never** from the body
   - `listTenders` — default to `status: "open"` (FR-7.1); accept `category` and `minBudget`/`maxBudget` query params (FR-7.2); build the Mongo filter conditionally so absent params do not become `undefined` keys
   - `getTenderById` — `populate("createdBy", "companyName")`; 404 for unknown or malformed id
   - `updateTender` — owner only, and only while `status === "open"` (FR-8.1)
   - `closeTender` — owner **or** admin (FR-8.2, FR-8.3)
3. **`isOwnerOrAdmin` middleware** — loads the tender, compares `createdBy` against `req.user.id`, allows through if either matches or the role is admin, else **403**. Reusable in Sprints 04 and 05.
4. **Route composition** — `isAuth` → `isRole` → `isApprovedOrganization` (create only) → `isOwnerOrAdmin` (mutations) → controller. Order matters: authenticate, then authorize, then check ownership.
5. **Malformed ObjectId** — Mongoose throws `CastError`. The global middleware must translate it to **404**, not 500 (API-5).

## Endpoints added

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | `/api/tenders` | Yes | Approved Organization |
| GET | `/api/tenders` | Yes | Any |
| GET | `/api/tenders/:id` | Yes | Any |
| PATCH | `/api/tenders/:id` | Yes | Owner |
| DELETE | `/api/tenders/:id` | Yes | Owner or Admin |

## Frontend tasks

1. **`/tenders`** — filter bar (category select, budget range) above a card grid (`design.md` §6). Each card carries a `StatusStamp` and a deadline **data rail** — the right-bordered key/value block from `design.md` §5, not a decorative info card.
2. **Filtering** — drive from URL query params, not local state alone, so a filtered view is shareable and survives a refresh. `useSearchParams` from react-router-dom.
3. **`/tenders/:id`** — `PageHeading` with the registry rule; data rail for budget, deadline, category; owner's company name; status stamp.
4. **`/org/dashboard`** — "my tenders" list with edit and close actions on each.
5. **Create / edit form** — shared component, mirroring the create/edit relationship in the react-component skill. Pre-fill on edit. Server error map into state.
6. **Deadline input** — `<input type="date">` with a `min` of today as a courtesy; the server validator remains authoritative.
7. **Close** — destructive styling and a confirm step (NFR-U4).
8. **Ownership-aware rendering** — edit/close appear only for the owner or an admin. This is presentation only; the server enforces it (FR-5.5).
9. All four render states on both list and detail (loading / error / empty / data).

---

## Acceptance criteria

- [ ] Approved organization creates a tender; it defaults to `open`
- [ ] **Pending** organization attempting creation → **403** (FR-6.3)
- [ ] Individual attempting creation → **403**
- [ ] Past deadline rejected on create **and** on update
- [ ] Filtering by category returns only that category; budget range filters correctly; no filter returns all open tenders
- [ ] A non-owner organization editing someone else's tender → **403**
- [ ] Admin closes another organization's tender successfully (FR-8.3)
- [ ] Editing a closed tender → rejected
- [ ] `GET /api/tenders/:id` with a malformed id → **404**, not 500
- [ ] Filters survive a page refresh via the URL
- [ ] Empty state renders when no tenders match
- [ ] No physical direction utilities in any new JSX

## Failure modes to avoid

- **`createdBy` from the request body** — trivially forged. Always `req.user.id`.
- **Filter params leaking as `undefined`** into the Mongo query, silently matching nothing. Build the filter object conditionally.
- **Forgetting `runValidators` on update**, letting the deadline be edited into the past.
- **Hiding the edit button and calling it authorization.** The endpoint must 403 independently.
- **`CastError` → 500.** It is a 404.
