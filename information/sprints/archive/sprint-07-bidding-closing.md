# Sprint 07 — Bidding & Closing

**Goal:** live bidding. Individuals place bids that must beat the current price, all viewers see updates within 3–5 seconds via polling, and auctions close themselves and name a winner without a scheduled job.

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

FR-13 (bidding), FR-14 (closing and notification), C-10 (polling, no Socket.io), NFR-P2, NFR-R3.

## In scope

BidHistory model, bid validation, polling, lazy closing, winner determination, the individual's auction history, and the simulated payment screen.

## Out of scope

The auction-win **email** — Sprint 08. `TODO(sprint-08)` at the call site. The in-app winner notice **is** in scope (FR-14.3).

---

## Two concepts that define this sprint

### Lazy closing (FR-14.1)

There is **no cron job and no scheduler**. An auction whose `endsAt` has passed is treated as closed **on the next request that reads it**. Both `getAuctionById` and `listActiveAuctions` call a shared `resolveAuctionState(auction)` helper that:

1. Returns the auction unchanged if `endsAt` is still in the future
2. Otherwise sets `status: "ended"`, determines the winner from `currentHighestBidder`, persists, and returns the updated document

This is why NFR-R3 insists the winner is computed from `endsAt` and stored bid data — never from a value cached at listing time. Because polling runs every 3–5 seconds, a live auction closes within seconds of its deadline in practice.

### The race condition

Two individuals bidding the same amount at the same moment can both pass a naive read-then-write check. Use a **conditional atomic update** so the database arbitrates:

```js
const updated = await Auction.findOneAndUpdate(
  { _id: id, status: "active", currentPrice: { $lt: amount } },
  { $set: { currentPrice: amount, currentHighestBidder: req.user.id } },
  { new: true },
);
// updated === null means someone else got there first, or the auction closed
```

If `updated` is `null`, return 400 with the Arabic "your bid must be higher than the current price" message. Only write the `BidHistory` record **after** a successful update — otherwise history fills with bids that never took effect.

---

## Data model — `BidHistory` (SRS §5.5)

| Field | Type | Constraints |
|---|---|---|
| `auction` | ObjectId → Auction | Required |
| `bidder` | ObjectId → User | Required |
| `amount` | Number | Required |
| `createdAt` | Date | Generated |

Index `{ auction: 1, createdAt: -1 }` — the detail page reads recent bids on every poll, and without the index that query degrades as history grows.

---

## Backend tasks

1. **`models/bidHistory.model.js`** — as above, with the index.
2. **`placeBid`**
   - `isAuth` → `isRole(["individual"])` (FR-13.1). Organizations and admins bidding → **403**.
   - **404** if no such auction
   - **400** if `status !== "active"` or `endsAt` has passed
   - The atomic update above; `null` result → 400 with the "bid too low" message (FR-13.2)
   - Write `BidHistory` on success (FR-13.3)
   - Return the updated auction
3. **`resolveAuctionState`** — shared helper in `functions/` or `config/`, called by both read paths. One implementation, two call sites (NFR-M4 spirit).
4. **`getAuctionById`** — returns the auction plus recent bid history, populated with bidder names. This endpoint is polled every 3–5s, so keep it lean: limit history to the most recent ~10 and select only the fields the UI renders.
5. **`GET /api/users/me/auctions`** — auctions the caller has bid on, each with their highest bid and an outcome: `winning`, `outbid`, `won`, `lost` (FR-14.4). Derive from `BidHistory` joined against the auction's `currentHighestBidder` and status.
6. **Winner notice** — on resolution, record enough for the client to show an in-app notice to the winner (FR-14.3).

## Endpoints added

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | `/api/auctions/:id/bid` | Yes | Individual |
| GET | `/api/users/me/auctions` | Yes | Individual |

## Frontend tasks

1. **Polling on `/auctions/:id`** — `setInterval` at **4000ms** (inside the 3–5s band, NFR-P2). **The `useEffect` must return `clearInterval`** — see the react-component skill §5. An interval that outlives the page keeps hitting the API forever.
2. **Stop polling** when the auction has ended. Continuing to poll a closed auction is pure waste.
3. **Price updates without jitter** — `tabular-nums`, `dir="ltr"`. A subtle pulse on change (`design.md` §6), respecting `prefers-reduced-motion`.
4. **Bid form** — individuals only. Logged-out visitors see the auction and a prompt to log in, not a broken form (FR-12.4 keeps browsing public). Organizations and admins see no form.
5. **Client-side minimum** as a courtesy: input `min` set above `currentPrice`. Server remains authoritative (NFR-S7).
6. **Submit disabled while in flight.** Double-submitting a bid is worse here than anywhere else in the app.
7. **Bid history list** — bidder name, amount, time. `aria-live="polite"` so new bids are announced to screen readers.
8. **`/my-auctions`** — table per `design.md` §6: auction name, your bid, outcome status stamp. Four distinct Arabic labels for winning / outbid / won / lost.
9. **Winner experience** — an in-app notice on the auction page and in `/my-auctions`, leading to the **simulated payment confirmation screen** (FR-14.5). Label it unmistakably in Arabic as a simulation; no real payment occurs.

---

## Acceptance criteria

- [ ] Individual places a bid above the current price → accepted, price updates
- [ ] Bid equal to the current price → **400** (must be *strictly* greater, FR-13.2)
- [ ] Bid below → 400 with the specific Arabic message
- [ ] Organization bidding → **403**; admin bidding → **403**
- [ ] Unauthenticated bid → 401
- [ ] Bid on a `pending_approval` auction → 400
- [ ] Bid on an auction past `endsAt` → 400
- [ ] **Two browsers**: bid in one, the other reflects the new price within ~5 seconds
- [ ] `BidHistory` records only successful bids
- [ ] An auction past `endsAt` shows `ended` on the next read, with no scheduler running
- [ ] Winner is the holder of the highest bid; an auction with zero bids ends with no winner and does not error
- [ ] `/my-auctions` shows correct outcomes across all four states
- [ ] Navigating away from the auction page **stops** the polling (verify in the network tab)
- [ ] Payment screen is clearly labelled as a simulation

## Failure modes to avoid

- **Read-then-write bid validation.** Two simultaneous bids both pass. Use the conditional atomic update.
- **Writing `BidHistory` before confirming the update succeeded.** History fills with phantom bids.
- **Missing `clearInterval`.** The most common bug in this whole project — requests continue after unmount and multiply as the user navigates.
- **Polling faster than 3s.** Violates NFR-P2 and hammers the server.
- **Assuming a scheduler.** FR-14.1 explicitly requires lazy resolution.
- **Crashing on a zero-bid auction.** `currentHighestBidder` is legitimately null.
- **Hiding the whole auction page from logged-out visitors.** Browsing is public; only bidding requires login.
