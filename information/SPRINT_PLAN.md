# Sprint Plan — Procurement & Auction Platform (MVP)

**10 sprints total: 9 to a complete MVP, plus 1 optional stretch sprint.**

At roughly one week each, that is **9 weeks to MVP**. Sprints are sized so that each one ends with something a human can open in a browser and use — not a half-built layer.

---

## 1. How this folder works

Everything the build depends on lives in `/information`, at the project root beside `client/` and `server/`:

```
project-root/
├── client/
├── server/
└── information/
    ├── README.md
    ├── SPRINT_PLAN.md              ← you are here
    ├── AGENTS.md                   ← build commands + conventions
    ├── procurement-platform-srs.md ← authoritative requirements
    ├── requirements.md             ← Arabic requirements + DoD
    ├── design.md                   ← visual system
    ├── PalTenders_Full-Stack_Build_Specification.md  ← reference only
    ├── skills/
    │   └── react-component/SKILL.md
    └── sprints/
        ├── sprint-00-foundation.md
        ├── sprint-01-identity-access.md
        ├── sprint-02-admin-review.md
        ├── sprint-03-tenders.md
        ├── sprint-04-proposals.md
        ├── sprint-05-ai-analysis.md
        ├── sprint-06-auctions.md
        ├── sprint-07-bidding-closing.md
        ├── sprint-08-notifications-hardening.md
        └── sprint-09-stretch-negotiation.md
```

**Every sprint begins by reading every document in `/information`.** Each sprint file repeats this instruction at the top. Do not start a sprint from its own file alone.

**PalTenders is reference material only.** Take its visual language, nothing else. Do not copy its stack, routes, page inventory, asset URLs, or copy — `design.md` §0 is explicit about this.

---

## 2. Precedence when documents disagree

1. `procurement-platform-srs.md` — the contract. Requirement IDs are authoritative.
2. `AGENTS.md` — how it must be built.
3. `design.md` — how it must look.
4. `skills/react-component/SKILL.md` — how components must be written.
5. Sprint files — the plan for getting there.

If a sprint file contradicts the SRS, **stop and report it** rather than guessing. The sprint files were derived from the SRS and any conflict is a bug in the plan.

One known conflict already flagged: `design.md` shows colour tokens in `tailwind.config.js` (Tailwind 3 form) while `AGENTS.md` installs `@tailwindcss/vite` (Tailwind 4). Sprint 00 resolves this to the Tailwind 4 `@theme` block. Do not maintain both.

---

## 3. Sprint sequence

| # | Sprint | Phase | Requirements | Demo at the end |
|---|---|---|---|---|
| 00 | Foundation & Shell | — | C-1…C-6, NFR-M1/M2, UI-1 | Both apps boot, DB connects, RTL shell renders with design tokens |
| 01 | Identity & Access | 1 | FR-1, FR-2, FR-3, FR-5 | Register both roles, log in, hit a protected endpoint, get 401/403 correctly |
| 02 | Admin Organization Review | 1 | FR-4, FR-1.3, NFR-S8 | Admin sees pending orgs with proof docs, approves/rejects, status gate works |
| 03 | Tenders | 2 | FR-6, FR-7, FR-8 | Approved org creates a tender; anyone browses and filters; owner edits, admin moderates |
| 04 | Proposals | 2 | FR-9 | Org submits a proposal with a document; self-bid and duplicate blocked; owner sees the list |
| 05 | AI Analysis & Decisions | 3 | FR-10, FR-11 | Upload → extracted price + confidence shown → editable → owner accepts/rejects |
| 06 | Auctions | 4 | FR-12 | Org creates auction → pending → admin approves → visible publicly |
| 07 | Bidding & Closing | 4 | FR-13, FR-14 | Individual bids, price updates live for two browsers, auction closes and names a winner |
| 08 | Notifications & Hardening | — | FR-16, NFR-S, NFR-U | All 5 emails fire; helmet + rate limit on; RTL/a11y audit passes |
| 09 | Negotiation & Contract *(stretch)* | 5 | FR-15 | Message thread + AI contract draft — only if 00–08 are complete and stable |

**Sprints 00–08 are the deliverable.** Sprint 09 is explicitly a stretch goal per SRS §3.6 and L-10. Do not start it while any earlier sprint has open items.

---

## 4. Dependency order

```
00 Foundation
   └── 01 Identity & Access
         ├── 02 Admin Review ──┐
         │                     │
         ├── 03 Tenders ───────┤
         │     └── 04 Proposals│
         │           └── 05 AI & Decisions
         │                     │
         └── 06 Auctions ──────┤
               └── 07 Bidding  │
                               └── 08 Notifications & Hardening
                                     └── 09 Negotiation (stretch)
```

02, 03, and 06 all depend only on 01, so their order can flex. Keep 02 early: without approved organizations there is nobody who can legally create a tender, and testing 03 becomes awkward.

08 must come last because it wires notifications into events created in 02, 05, and 07.

---

## 5. Definition of Done — applies to every sprint

Taken from `requirements.md` §4. A sprint is not finished until all five hold:

1. **Every functional requirement listed in the sprint actually works.** Not a mockup, not a stub.
2. **Every endpoint tested manually in Postman** — one success case and at least one failure case each.
3. **Expected failures return the correct status code**, never a bare 500: `400` validation, `401` not authenticated, `403` wrong role, `404` not found.
4. **The frontend is wired to the real API.** No mock data unless explicitly labelled as a temporary placeholder.
5. **The four render states exist on every data screen**: loading, error, empty, and data (NFR-U3, NFR-U5).

Additionally, for every sprint after 00:

6. **RTL check**: no `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`/`text-left`/`text-right` in any new JSX. Logical utilities only.
7. **Arabic check**: every user-facing string is Arabic. No raw exception text, no status codes shown to users.
8. **Mobile check**: no horizontal scroll at 360px (NFR-U6).

---

## 6. Conventions that hold across all sprints

These are drawn from `AGENTS.md` and the SRS. They are not restated in every sprint file.

**Auth transport.** Login returns `{ user, token }` in the **response body** (SRS §4.2). The client stores the token and sends it as `Authorization: Bearer <token>`. This project does **not** use httpOnly cookies. Token has no expiry in the MVP — that is accepted limitation L-1, not an oversight to fix.

**Middleware order.** `isAuth` → `isRole([...])` → controller. `isAuth` only verifies the token and attaches `req.user`. `isRole` reads `req.user.role`. Never read a role from the request body (FR-5.4, NFR-S6).

**Status codes.** 400 validation · 401 unauthenticated · 403 wrong role · 404 not found · 500 unexpected only.

**Response shape.** Always an object with a named key: `{ tenders }`, `{ tender }`, `{ errors }`. Never a bare array (API-2).

**Errors.** Controllers call `next(err)`. One global error middleware in `server.js` formats every response (NFR-M5). Controllers do not format error responses individually.

**Validation.** Declared once in the Mongoose schema (NFR-M3). Server is authoritative; client checks are advisory only (NFR-S7).

**Uploads.** multer, 5MB cap, `jpg`/`jpeg`/`png`/`pdf` only, MIME-checked server-side not by extension (NFR-S8). Store the URL on the document, never the buffer. `/uploads` is gitignored.

**Secrets.** `.env` only. `GEMINI_API_KEY`, `SECRET`, `MONGOOSE_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` server-side; `VITE_EMAILJS_*` client-side. Never committed, never logged.

**Isolation.** All Gemini calls in one module (C-7, NFR-M4). All EmailJS calls through one client helper (C-8).

**Graceful degradation.** A failed Gemini or EmailJS call never blocks or reverses the underlying action (NFR-R1, NFR-R2). The database is the only source of truth.

---

## 7. Out of scope — do not build these

From SRS §1.2. If a sprint seems to call for one of these, the sprint file is wrong:

- Multi-currency or currency conversion
- Multi-tier pre-qualification
- Formal dispute/appeal workflow
- Immutable audit trail
- Real payment gateway — use a simulated confirmation screen (FR-14.5)
- SMS or push notifications — EmailJS and in-app notices only
- Socket.io / WebSockets — polling only (C-10, NFR-P2)
- English localisation — Arabic-only is the MVP baseline (`design.md` §3)

---

## 8. Progress tracking

Keep a `PROGRESS.md` at the project root. After each sprint, append:

```markdown
## Sprint NN — <name> — completed YYYY-MM-DD

**Requirements delivered:** FR-x.y, FR-x.z, NFR-…
**Endpoints added:** …
**Screens added:** …
**Deviations from the sprint file:** … (or "none")
**Known issues carried forward:** … (or "none")
**Postman collection updated:** yes/no
```

Deviations matter more than completions. A deviation recorded now is a bug found in week 3; a deviation unrecorded is a bug found during the defense.
