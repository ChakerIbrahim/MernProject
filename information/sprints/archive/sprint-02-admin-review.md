# Sprint 02 — Admin Organization Review

**Goal:** file upload works end to end, and an Admin can approve or reject pending organizations — the gate that unlocks every organization action in Sprint 03 onward.

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

FR-1.3 (proof document required), FR-4 (admin review), FR-4.5 (email failure must not roll back), NFR-S8 (MIME validation), NFR-U4 (destructive actions distinct).

## In scope

- multer upload pipeline with server-side type and size validation
- Organization registration completing with a real uploaded document
- Admin: list pending, approve, reject with optional reason
- Status gating enforced server-side on organization-only actions

## Out of scope

The approval/rejection **email** — Sprint 08 wires EmailJS. Leave a clearly marked `TODO(sprint-08)` at the exact call site so it is trivial to find.

---

## Backend tasks

1. **`config/multer.config.js`** — single upload module reused by Sprints 04 and 06.
   - Destination `/uploads`, already gitignored
   - `limits: { fileSize: 5 * 1024 * 1024 }`
   - `fileFilter` accepting `jpg`, `jpeg`, `png`, `pdf` **by MIME type**, not extension (NFR-S8). An attacker renaming `evil.exe` to `evil.pdf` must be rejected.
   - Filename: timestamp + random suffix, never the user's original name unsanitised
   - Store the **URL** on the document, never the buffer (AGENTS.md)
2. **Static serving** — `app.use("/uploads", express.static("uploads"))` so the admin can open a submitted document.
3. **Multer error handling** — a file over 5MB throws `MulterError` before your controller runs. Catch it in the global middleware and return **400** with an Arabic message, not a 500.
4. **Wire the upload into registration** — `POST /api/auth/register` accepts `multipart/form-data` for the organization branch. `proofDocumentUrl` becomes required and real (FR-1.3).
5. **`controllers/admin.controller.js`**
   - `listPendingOrganizations` — `role: "organization", status: "pending"`
   - `approveOrganization` — sets `approved`; 404 if no such id; 400 if already decided
   - `rejectOrganization` — sets `rejected`, stores optional `rejectionReason`
6. **Status gate** — a reusable `isApprovedOrganization` middleware. Sprint 03 will place it in front of tender creation (FR-6.3). Build it here so it is not improvised later.

## Endpoints added

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| GET | `/api/admin/organizations/pending` | Yes | Admin |
| PATCH | `/api/admin/organizations/:id/approve` | Yes | Admin |
| PATCH | `/api/admin/organizations/:id/reject` | Yes | Admin |

## Frontend tasks

1. **File input on organization registration** — Arabic helper text stating accepted types and the 5MB cap. Show upload progress (NFR-U3); a document upload on a slow connection with no feedback reads as a frozen page.
2. **Client-side pre-check** as a courtesy only — type and size before sending. The server check remains authoritative (NFR-S7).
3. **`/admin/dashboard`** — pending organizations as cards per `design.md` §6: company name, commercial register number, submitted-document link, and Approve / Reject actions.
4. **Approve** — `registry-green`. **Reject** — `flag-red`, with a confirm step and an optional Arabic reason field (NFR-U4).
5. **Optimistic-but-honest removal** — on success remove the card without a full refetch; on failure restore it and show the error.
6. **Empty state** — "لا توجد طلبات قيد المراجعة" rather than a blank panel (NFR-U5).
7. **Document link** opens in a new tab with `rel="noopener noreferrer"`.

---

## Acceptance criteria

- [ ] Organization registration requires a document and stores a working URL
- [ ] A 6MB file → 400 with an Arabic message, not 500
- [ ] A `.txt` renamed to `.pdf` → rejected (MIME checked, not extension)
- [ ] An `.exe` → rejected
- [ ] Pending list shows only pending organizations
- [ ] Approve flips status to `approved`; the organization's next login shows full access
- [ ] Reject flips to `rejected` and stores the reason
- [ ] Approving an already-approved organization → 400, not a silent success
- [ ] A non-admin token on any of these three endpoints → **403**
- [ ] No token → **401**
- [ ] `/uploads` is gitignored and untracked
- [ ] A `TODO(sprint-08)` marks both email call sites

## Failure modes to avoid

- **Trusting the extension.** `req.file.mimetype` is the check (NFR-S8).
- **Letting multer errors reach the client as 500.** They are validation failures.
- **Storing the raw buffer** on the document instead of a URL.
- **Forgetting the status gate.** Without `isApprovedOrganization`, a pending organization can create tenders in Sprint 03 by calling the API directly, violating FR-6.3.
- **Building the email now.** It belongs in Sprint 08 with the other four.
