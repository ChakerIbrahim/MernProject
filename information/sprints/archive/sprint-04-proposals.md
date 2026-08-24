# Sprint 04 — Proposals

**Goal:** an approved organization submits a document-backed proposal against another organization's tender, with the two business rules that make the marketplace coherent: no self-bidding, no duplicates.

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

FR-9 (submit proposal), FR-11.1 (owner lists proposals), reuses the upload pipeline from Sprint 02.

## In scope

Proposal model, submission with document upload, self-bid and duplicate guards, and the tender owner's proposal list.

## Out of scope

- **AI analysis** — Sprint 05. Store `aiExtractedData` as absent for now; the schema field exists and stays empty.
- **Accept/reject decisions** — Sprint 05. The owner's list is read-only this sprint.

---

## Data model — `BidProposal` (SRS §5.3)

| Field | Type | Constraints |
|---|---|---|
| `tender` | ObjectId → Tender | Required |
| `submittedBy` | ObjectId → User | Required |
| `documentUrl` | String | Required |
| `aiExtractedData.extractedPrice` | Number | Optional |
| `aiExtractedData.summary` | String | Optional |
| `aiExtractedData.confidenceScore` | Number | Optional, 0–100 |
| `finalPrice` | Number | Required, positive |
| `status` | String | Enum `submitted` / `under_review` / `accepted` / `rejected`, default `submitted` |

Every `aiExtractedData` sub-field is **optional by design** — FR-10.4 requires submission to succeed when Gemini fails. Do not mark them required in Sprint 05 either.

**Enforce the duplicate rule at the database level**, not only in the controller:

```js
BidProposalSchema.index({ tender: 1, submittedBy: 1 }, { unique: true });
```

A controller check alone loses to two rapid submissions; the index cannot. Catch the resulting duplicate-key error (code `11000`) and translate it to a 400 with the Arabic message from SRS §5.6.

---

## Backend tasks

1. **`models/bidProposal.model.js`** — as above, with the compound unique index.
2. **`controllers/proposal.controller.js`**
   - `submitProposal`
     - Load the tender; **404** if absent
     - **400** if the tender is not `open` — no proposals on a closed tender
     - **403** if `tender.createdBy` equals `req.user.id` (FR-9.2, self-bid)
     - **400** if a proposal already exists for this pair (FR-9.3)
     - Upload the document via the Sprint 02 multer module
     - `submittedBy` from `req.user.id`; default `status: "submitted"`
   - `listProposalsForTender` — tender owner **or** admin only (FR-11.1). Any other organization requesting them → **403**. Competitors must not see each other's prices.
   - `getProposalById` — owner of the tender, the submitter, or an admin. Nobody else.
3. **Route order** — `isAuth` → `isRole(["organization"])` → `isApprovedOrganization` → controller.
4. **Index creation** — confirm the unique index actually exists in MongoDB (`db.bidproposals.getIndexes()`). Mongoose builds indexes in the background and silently swallows failures if duplicate data already exists.

## Endpoints added

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | `/api/tenders/:id/proposals` | Yes | Approved Organization (not owner) |
| GET | `/api/tenders/:id/proposals` | Yes | Tender owner or Admin |
| GET | `/api/proposals/:id` | Yes | Tender owner, submitter, or Admin |

## Frontend tasks

1. **Enable the submit-proposal action** on `/tenders/:id`, gated by role, approval status, ownership, and tender status. Hidden for the owner; hidden for individuals; disabled with an Arabic explanation when the tender is closed.
2. **Proposal submission form** — document upload with progress (NFR-U3) plus a `finalPrice` field. Leave visual room for the AI panel that Sprint 05 inserts between upload and submit; agreeing that layout now avoids a rework.
3. **Submit disabled while in flight.** A double-click that creates two proposals is exactly what the unique index exists to stop, but the button should not invite it.
4. **`/tenders/:id/proposals`** — owner's review list. Each row: submitting company, final price (`tabular-nums`, `dir="ltr"`), document link, status stamp, submission date. Leave a column for the confidence score, empty this sprint.
5. **Empty state** — "لم يتم تقديم أي عروض على هذا العطاء بعد" (NFR-U5).
6. **Error mapping** — the two business rules need distinct, human Arabic messages, not a generic failure:
   - self-bid → "لا يمكنك تقديم عرض على عطاء تملكه"
   - duplicate → "لقد قدّمت عرضاً على هذا العطاء مسبقاً"

---

## Acceptance criteria

- [ ] Approved organization submits a proposal on another organization's open tender
- [ ] Tender owner submitting on their own tender → **403** with the specific message
- [ ] Same organization submitting twice → **400** with the specific message
- [ ] The duplicate is blocked even when the controller check is bypassed (verify the unique index directly in MongoDB)
- [ ] Proposal on a closed tender → 400
- [ ] Pending organization → 403
- [ ] Individual → 403
- [ ] Document upload obeys the 5MB and MIME rules from Sprint 02
- [ ] A third organization requesting the proposal list → **403** (prices stay confidential)
- [ ] Owner sees all proposals; admin sees all proposals
- [ ] `aiExtractedData` is absent and nothing breaks
- [ ] Empty state renders on a tender with no proposals

## Failure modes to avoid

- **Controller-only duplicate check.** Two fast clicks beat it. The index is the real guard.
- **Ignoring error `11000`** and returning a 500 for what is a validation failure.
- **Exposing the proposal list to any authenticated organization.** That leaks competitor pricing — the most serious data-exposure risk in this system.
- **Marking `aiExtractedData` required**, which would break FR-10.4 in the next sprint.
- **Forgetting to block proposals on closed tenders.** The tender status check is easy to omit and produces nonsense data.
