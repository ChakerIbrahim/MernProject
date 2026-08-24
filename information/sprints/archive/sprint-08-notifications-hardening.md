# Sprint 08 — Notifications & Hardening

**Goal:** wire all five email notifications through one helper, close the security gaps, and audit the whole product against the non-functional requirements. This is the sprint that turns a working app into a defensible one.

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

FR-16 (all email notifications), C-8, NFR-R2, NFR-S4, NFR-S5, NFR-S8, NFR-U1…U6, NFR-P1…P3, NFR-M5, and the SRS §8 traceability table.

## Why this sprint is last

Notifications attach to events created in Sprints 02, 05, and 07. Building them earlier means building them three times. Hardening is last because it audits everything.

---

## Part A — Email notifications

**Five triggers** (FR-16.1). Every `TODO(sprint-08)` left in earlier sprints resolves here:

| Trigger | Sprint left the TODO in | Recipient |
|---|---|---|
| Organization approved | 02 | The organization |
| Organization rejected | 02 | The organization |
| Proposal accepted | 05 | The submitting organization |
| Proposal rejected | 05 | The submitting organization |
| Auction won | 07 | The winning individual |

**Architecture (C-8, NFR-M4):** EmailJS runs **client-side** via `@emailjs/browser`. All five calls go through **one** shared helper at `src/functions/sendEmail.js`. If a second file imports `@emailjs/browser`, the constraint is broken.

```js
// src/functions/sendEmail.js — the only file importing @emailjs/browser
export const sendNotification = async ({ templateId, params }) => {
  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      templateId,
      params,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
    );
  } catch (err) {
    console.error("EmailJS failed:", err);
    // deliberately swallowed — see NFR-R2
  }
};
```

**The swallow is the requirement, not laziness.** NFR-R2 and FR-16.3 state that a failed email must not block, retry indefinitely, or reverse the state change. The database is the sole source of truth for status. Concretely: if the approval succeeded and the email failed, **the organization is still approved**. Never wrap the state change and the email in the same try/catch such that the email failure reverts the approval.

**Order of operations, always:** action succeeds server-side → UI updates from the response → *then* fire the email. Never the reverse.

Config from `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY` — never hard-coded (NFR-S4).

## Part B — Security hardening

1. **helmet** — confirm it is mounted and before the routes.
2. **express-rate-limit** — a global policy, plus tighter limits on `/api/auth/login`, `/api/auth/register`, and `/api/auctions/:id/bid`. Limitation L-3 acknowledges this is basic; do not over-engineer it.
3. **CORS** — exactly one origin, from `CLIENT_ORIGIN` (NFR-S5). No wildcard.
4. **Secrets audit** — grep the repo for any literal key, secret, or connection string. `.env` untracked; `.env.example` committed with empty values (NFR-S4).
5. **Log audit** — no request body containing a password, token, or file content is ever logged (AGENTS.md).
6. **Upload re-verification** — re-test the MIME checks from Sprint 02 now that three flows use them (proof document, proposal document, auction image). NFR-S8.
7. **Password exposure** — confirm no endpoint anywhere returns the `password` field (NFR-S2).
8. **Role integrity** — confirm no controller reads a role from a request body (FR-5.4, NFR-S6).
9. **Error shape** — every thrown error passes through the one global middleware (NFR-M5). No stack trace reaches a client.

## Part C — UX and accessibility audit

Walk every screen in SRS §4.1 against the react-component skill checklist:

- [ ] **Four render states** on every data screen — loading, error, empty, data (NFR-U3, U5)
- [ ] **Every user-facing string is Arabic.** No status codes, no exception text, no English placeholder
- [ ] **Field-level validation messages** tied to their input with `aria-describedby` and `role="alert"` (NFR-U1)
- [ ] **Failed submissions preserve input** (NFR-U2) — test each form by submitting invalid data
- [ ] **Destructive actions** in `flag-red` with a confirm step (NFR-U4)
- [ ] **No status communicated by colour alone** — every status stamp has an Arabic label (`design.md` §2)
- [ ] **No physical direction utilities** anywhere: grep for `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`
- [ ] **Directional icons flip** with `rtl:-scale-x-100`; non-directional icons do not
- [ ] **Email, URL, phone, and reference inputs carry `dir="ltr"`**
- [ ] **Interpolated values in Arabic prose wrapped in `<bdi>`**
- [ ] **Prices and countdowns use `tabular-nums`**
- [ ] **Keyboard reachable** with a visible `registry-green` focus ring
- [ ] **No horizontal scroll at 360px** on every screen (NFR-U6)
- [ ] **Tested with real Arabic content**, not mirrored Latin placeholder text

## Part D — Performance and cleanup

- [ ] Non-AI reads return within 2 seconds (NFR-P1)
- [ ] Auction polling is between 3 and 5 seconds and **stops on unmount** (NFR-P2)
- [ ] No navigation causes a full page reload (NFR-P3)
- [ ] AI analysis shows progress feedback throughout (NFR-P4)
- [ ] The Sprint 01 temporary `/api/admin/ping` probe route is **deleted**
- [ ] All `TODO(sprint-08)` markers are resolved and removed
- [ ] The `/dev/rtl` smoke-test page is either removed or excluded from the production build

## Part E — Traceability

Work through SRS §8 and confirm each row. Record the result in `PROGRESS.md`. Any requirement you cannot demonstrate is either incomplete or a deliberate deviation — write down which, with a reason. An undocumented gap found during the defense is far worse than a documented one.

---

## Acceptance criteria

- [ ] All five emails send on their triggers
- [ ] **With EmailJS credentials deliberately wrong, every underlying action still succeeds** — approval still approves, acceptance still accepts, the winner is still the winner. Test this explicitly; it is NFR-R2.
- [ ] `@emailjs/browser` is imported in exactly **one** file
- [ ] Rate limiting returns 429 on repeated login attempts
- [ ] No secret appears anywhere in the repository
- [ ] No password appears in any response or log
- [ ] Every item in Parts C and D is checked
- [ ] SRS §8 traceability walked and recorded

## Failure modes to avoid

- **Blocking on email.** If the UI waits for EmailJS before showing success, a slow email makes the app feel broken and a failed one hides a successful action.
- **Reverting state on email failure.** Directly contradicts NFR-R2.
- **Duplicating EmailJS calls inline** across components instead of routing through the helper.
- **Treating the audit as a formality.** These checks are where a graded project gains or loses most of its non-functional marks.
