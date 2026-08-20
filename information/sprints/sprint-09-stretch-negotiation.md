# Sprint 09 — Negotiation & Contract Draft *(stretch goal)*

**Goal:** a simple message thread between a tender owner and an accepted bidder, plus an AI-generated draft contract.

> **Do not start this sprint unless Sprints 00–08 are complete, stable, and audited.**
> SRS §3.6 and limitation L-10 designate Phase 5 explicitly as a stretch goal that "may be absent from the delivered baseline entirely." A polished MVP without this sprint scores better than a complete-looking product with an unstable core. If in doubt, stop at Sprint 08 and spend the time on documentation and the defense.

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

FR-15.1 (message thread), FR-15.2 (AI contract draft), FR-15.3 (explicitly non-binding).

## Entry conditions

Verify all of these before writing a line:

- [ ] Every acceptance criterion in Sprints 00–08 passes
- [ ] The Sprint 08 audit is complete and recorded in `PROGRESS.md`
- [ ] No known bug is carried forward
- [ ] There is genuine time remaining before the deadline

---

## Data model — `NegotiationMessage` (new)

Not specified in SRS §5, because Phase 5 is a stretch. Keep it minimal and consistent with the existing entities:

| Field | Type | Constraints |
|---|---|---|
| `proposal` | ObjectId → BidProposal | Required |
| `sender` | ObjectId → User | Required |
| `body` | String | Required, non-empty |
| `createdAt` | Date | Generated |

Index `{ proposal: 1, createdAt: 1 }`.

Optionally store the generated draft on the proposal as `contractDraft: String` rather than creating a second collection.

---

## Backend tasks

1. **Thread access rule** — a thread exists **only** for a proposal with `status: "accepted"` (FR-15.1). Exactly two participants: the tender owner and the proposal's submitter. Everyone else, including other bidders, gets **403**. An admin may read but should not post.
2. **`POST /api/proposals/:id/messages`** — participant only; 400 if the proposal is not `accepted`.
3. **`GET /api/proposals/:id/messages`** — participant or admin; ordered oldest first.
4. **`POST /api/proposals/:id/contract-draft`** — **tender owner only**. Calls the existing `ai.controller.js` (C-7, NFR-M4) — do **not** import the Gemini SDK again here. Prompt it with the tender's fields and the accepted proposal's data; return editable Arabic text.
5. **Same AI discipline as Sprint 05** — timeout, try/catch, graceful failure. A failed generation shows an Arabic message and leaves the thread usable (NFR-R1 spirit).

## Endpoints added

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | `/api/proposals/:id/messages` | Yes | Tender owner or submitter |
| GET | `/api/proposals/:id/messages` | Yes | Participants or Admin |
| POST | `/api/proposals/:id/contract-draft` | Yes | Tender owner |

## Frontend tasks

1. **Thread UI** — simple message list plus a composer. Follow the notification-list pattern from `design.md` §6; this is not a chat product, so resist typing indicators, read receipts, and reactions.
2. **Polling** — if live updates are wanted, reuse the Sprint 07 pattern at 4000ms **with cleanup**. Simpler and equally acceptable: a manual refresh button. Socket.io remains out of scope (C-10).
3. **Contract draft** — progress state during generation (NFR-U3), then the draft in an editable textarea.
4. **Non-binding notice** (FR-15.3) — a permanent, prominent Arabic notice on the draft stating it is not legally binding without a signature outside the system. This is a requirement, not a disclaimer to tuck away in small print.
5. **Entry point** — the thread is reachable only from an accepted proposal, for the two participants.

---

## Acceptance criteria

- [ ] A thread opens only on an `accepted` proposal
- [ ] Both participants can post and read
- [ ] A third organization → **403**
- [ ] An individual → 403
- [ ] Messages render oldest first with sender and timestamp
- [ ] Only the tender owner can request a contract draft
- [ ] The draft is editable and reflects the real tender and proposal data
- [ ] The non-binding notice is permanently visible (FR-15.3)
- [ ] A Gemini failure shows an Arabic message and leaves the thread working
- [ ] `@google/generative-ai` is **still** imported in exactly one file
- [ ] Any polling stops on unmount

## Failure modes to avoid

- **Starting this sprint early.** It is the single most common way a graduation project ships with a broken core.
- **Importing the Gemini SDK a second time.** Reuse `ai.controller.js`.
- **Building a full chat product.** The requirement is a simple message thread.
- **Burying the non-binding notice.** It is FR-15.3, not fine print.
- **Opening the thread to non-participants.** It contains commercially sensitive negotiation.
