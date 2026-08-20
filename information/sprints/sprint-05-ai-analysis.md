# Sprint 05 — AI Analysis & Proposal Decisions

**Goal:** the differentiating feature. Gemini extracts a price and summary from an uploaded proposal document, shows them with a confidence score, lets the submitter override, and lets the tender owner accept or reject.

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

FR-10 (document analysis), FR-11 (review and decision), C-7 (Gemini isolation), NFR-M4, NFR-R1 (graceful degradation), NFR-P4, NFR-U3.

## In scope

Gemini integration behind a single module, the confidence-score UI, manual override, and accept/reject on proposals.

## Out of scope

The decision **email** — Sprint 08. Leave `TODO(sprint-08)` at the call site.

---

## The governing constraint

**A failed AI call must never block submission (FR-10.4, NFR-R1).** The AI is advisory. Build the manual path first and treat AI as an enhancement layered on top — not the other way round. If Gemini is down, the user must still be able to submit a proposal with a price they typed themselves.

The second constraint: **every AI output shown to a user carries a `confidenceScore` (0–100)** (AGENTS.md). Never present extracted data as fact.

---

## Backend tasks

1. **`controllers/ai.controller.js`** — the **only** file in the codebase that imports `@google/generative-ai` (C-7, NFR-M4). Every other module calls this one. If a second file imports the SDK, the constraint is violated.
2. **`analyzeProposalDocument(filePath)`**
   - Reads the stored document, sends it to Gemini
   - Prompt asks for **JSON only**: `{ extractedPrice, summary, confidenceScore }`. Instruct the model explicitly to return no prose and no markdown fences.
   - Strip any ``` fences defensively before `JSON.parse` — models add them regardless of instructions
   - Wrap the parse in try/catch; a malformed response is an AI failure, not a crash
   - Validate the shape: `extractedPrice` numeric, `confidenceScore` 0–100. Reject anything outside and treat it as a failure.
   - Apply a **timeout** (15–20s). A hung call must not hold the request open indefinitely.
3. **`POST /api/proposals/:id/analyze`** — submitter only. Returns `{ aiExtractedData }` on success, **502** on AI failure (SRS §4.2). 502 is deliberate: it distinguishes "the upstream AI failed" from "you sent bad data" (400), so the client knows to offer the manual path rather than blame the user.
4. **`PATCH /api/proposals/:id/status`** — tender owner only (FR-11.2). Accepts `accepted` or `rejected`. **Accepting one proposal must not auto-reject the others** (FR-11.4) — rejecting the rest is a separate explicit action.
5. **Never log the document contents or the API key** (AGENTS.md).

## Endpoints added

| Method | Endpoint | Auth | Role | Notes |
|---|---|---|---|---|
| POST | `/api/proposals/:id/analyze` | Yes | Submitter | 502 on AI failure |
| PATCH | `/api/proposals/:id/status` | Yes | Tender owner | `accepted` / `rejected` |

## Frontend tasks

1. **Three-step submission flow** on the proposal form:
   - **Upload** → progress indicator (NFR-U3)
   - **Analysing** → distinct Arabic progress state. This can take 10+ seconds and is exempt from the 2s rule (NFR-P4), which makes the feedback mandatory rather than optional.
   - **Review** → extracted price, summary, and confidence displayed, **editable**, then final submit
2. **Confidence score, visibly** — a labelled bar or badge showing 0–100 with an Arabic caption making clear this is an AI estimate, not a verified figure. Colour bands are fine but must carry a text label too (`design.md` §2).
3. **The price field stays editable** (FR-10.3). Pre-fill it with the extracted value; never lock it. If the user changes it, `finalPrice` is theirs and the extracted value is retained separately for the owner's comparison.
4. **AI failure path** (FR-10.4) — on 502, show a calm Arabic notice ("تعذّر تحليل المستند تلقائياً، يمكنك إدخال السعر يدوياً") and reveal the manual fields. **The submit button stays enabled throughout.** This is the single most important behaviour in the sprint.
5. **Owner review screen** — per proposal: extracted price, submitter's final price, confidence, summary, document link, and Accept / Reject. Where extracted and final prices differ, show both; that gap is decision-relevant information.
6. **Accept / Reject** — Accept `registry-green`, Reject `flag-red` with a confirm step (NFR-U4). Status stamps update in place.
7. **Missing AI data** renders as a neutral Arabic "لم يتم التحليل" — never as `undefined`, `null`, or an empty cell.

---

## Acceptance criteria

- [ ] A valid PDF returns a numeric price, an Arabic-readable summary, and a 0–100 confidence
- [ ] The extracted price is pre-filled and **editable**
- [ ] An edited price is what gets stored as `finalPrice`
- [ ] **With `GEMINI_API_KEY` deliberately invalid, the proposal can still be submitted manually** — test this explicitly, it is FR-10.4
- [ ] A Gemini timeout does not hang the request or the UI
- [ ] A malformed AI response (non-JSON) is handled as a failure, not a crash
- [ ] AI failure returns **502**, distinct from a 400
- [ ] Progress feedback shows throughout analysis
- [ ] Only the submitter can trigger analysis on their own proposal → others 403
- [ ] Only the tender owner can change proposal status → others 403
- [ ] Accepting one proposal leaves the others `submitted` (FR-11.4)
- [ ] `@google/generative-ai` is imported in exactly **one** file
- [ ] The API key appears in no log, no response, and no commit

## Failure modes to avoid

- **Building AI-first.** Then a Gemini outage blocks all submissions and FR-10.4 fails. Manual path first.
- **`JSON.parse` on a fenced response.** Strip ``` markers first.
- **No timeout.** A hung upstream call ties up the request indefinitely.
- **Trusting the model's numbers.** Validate the shape and range before storing.
- **Auto-rejecting other proposals on accept.** Explicitly forbidden by FR-11.4.
- **Importing the Gemini SDK anywhere else.** It breaks C-7 and makes the integration untestable.
