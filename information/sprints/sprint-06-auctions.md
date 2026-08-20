# Sprint 06 — Auctions

**Goal:** the second product line. Organizations and admins list auctions, an admin approves them before publication, and the public can browse active ones without logging in.

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

FR-12 (create, approve, browse), NFR-U5, reuses the Sprint 02 upload pipeline for the auction image.

## In scope

Auction model, creation with image upload, admin approval gate, public browsing, and the detail page.

## Out of scope

**Bidding and closing** — Sprint 07. The detail page shows the current price and a bid form area, but the form is disabled with an Arabic placeholder this sprint.

---

## Data model — `Auction` (SRS §5.4)

| Field | Type | Constraints |
|---|---|---|
| `title` | String | Required |
| `description` | String | Required |
| `imageUrl` | String | Optional |
| `startingPrice` | Number | Required, **> 0** |
| `currentPrice` | Number | Required, defaults to `startingPrice` |
| `currentHighestBidder` | ObjectId → User | Optional |
| `createdBy` | ObjectId → User | Required |
| `endsAt` | Date | Required, future |
| `status` | String | Enum `pending_approval` / `active` / `ended` / `cancelled`, default `pending_approval` |

Set `currentPrice = startingPrice` in a `pre("save")` hook on new documents, not in the controller — it belongs with the data, and Sprint 07 depends on it never being null.

---

## The visibility rule

**`pending_approval` auctions are never visible publicly** (FR-12.2, `design.md` §6). The public list returns `status: "active"` only. This is a server-side filter, not a client-side one — a `pending` auction must not appear in the API response at all, since anyone can call `GET /api/auctions` without a token.

An organization sees its own pending auctions on its dashboard, through a separate authenticated endpoint.

---

## Backend tasks

1. **`models/auction.model.js`** — as above, with the future-date validator on `endsAt` and a positive-number check on `startingPrice`.
2. **`controllers/auction.controller.js`**
   - `createAuction` — approved Organization **or** Admin (FR-12.1). `createdBy` from `req.user.id`. Forced to `pending_approval` regardless of any status in the body (FR-12.2).
   - `listActiveAuctions` — **public, no auth**. Filters to `active` and `endsAt > now`. Returns time remaining per auction (FR-12.5).
   - `getAuctionById` — **public**. Returns 404 for a `pending_approval` auction requested by an unauthenticated visitor; the creator and admins may see it.
   - `listMyAuctions` — authenticated; the caller's own auctions in any status.
3. **`PATCH /api/admin/auctions/:id/approve`** — admin only; `pending_approval` → `active` (FR-12.3). Approving an already-active auction → 400.
4. **Image upload** — reuse `config/multer.config.js` unchanged. Image is optional; an auction with no image must render correctly.
5. **Public route placement** — `listActiveAuctions` and `getAuctionById` must sit **outside** any `isAuth` router-level middleware. A common mistake is mounting all auction routes behind auth and breaking FR-12.4.

## Endpoints added

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | `/api/auctions` | Yes | Approved Organization or Admin |
| GET | `/api/auctions` | **No** | — |
| GET | `/api/auctions/:id` | **No** | — |
| GET | `/api/users/me/auctions` | Yes | Any |
| PATCH | `/api/admin/auctions/:id/approve` | Yes | Admin |

## Frontend tasks

1. **`/auctions`** — public card grid. Each card: image (or a token-coloured placeholder), title, current price in `tabular-nums` with `dir="ltr"`, time remaining, status stamp. Reachable while logged out.
2. **`/auctions/:id`** — public. Current price prominent in Noto Kufi Arabic (`design.md` §6), data rail for starting price / closing time / lister, description, and a bid area disabled this sprint with an Arabic note.
3. **Countdown** — computed from `endsAt` client-side, `tabular-nums` so digits do not jitter. On reaching zero, show "انتهى المزاد" rather than a negative number.
4. **Create-auction form** — organization and admin. Image upload with progress. On success, an Arabic notice explaining the listing awaits admin approval before appearing publicly — otherwise the user assumes it failed.
5. **`/org/dashboard`** — "my auctions" with status stamps, including pending ones.
6. **`/admin/dashboard`** — pending-auctions section with an Approve action, alongside the pending-organizations section from Sprint 02.
7. **Empty states** — "لا توجد مزادات نشطة حالياً" on the public list, distinct wording on the dashboards (NFR-U5).

---

## Acceptance criteria

- [ ] Approved organization creates an auction → `pending_approval`
- [ ] Admin creates an auction → also `pending_approval` (no self-approval shortcut)
- [ ] `status` supplied in the request body is ignored
- [ ] Pending auction does **not** appear in `GET /api/auctions`
- [ ] `GET /api/auctions` works **with no token at all** (FR-12.4)
- [ ] `GET /api/auctions/:id` on a pending auction, unauthenticated → 404
- [ ] Admin approval flips to `active` and it appears publicly
- [ ] `startingPrice` of 0 or negative → 400
- [ ] Past `endsAt` → 400
- [ ] `currentPrice` equals `startingPrice` on creation
- [ ] An auction with no image renders without a broken image icon
- [ ] Countdown shows correctly and does not go negative
- [ ] Pending organization creating an auction → 403
- [ ] Individual creating an auction → 403

## Failure modes to avoid

- **Mounting the public routes behind `isAuth`.** Breaks FR-12.4 and is easy to do accidentally with a router-level middleware.
- **Filtering pending auctions on the client.** The data still ships to anyone reading the network tab.
- **Accepting `status` from the body**, letting a lister self-approve.
- **Leaving `currentPrice` null**, which makes every Sprint 07 bid comparison fail.
- **No image, broken layout.** Test that case explicitly.
