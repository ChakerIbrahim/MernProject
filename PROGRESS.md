# PROGRESS

Sprint history for the Procurement & Auction Platform (MVP). Inputs live in
`/information`; this file is the record of what was actually built.

---

## Sprint 00 — Foundation & Shell — completed 2026-08-20

**Requirements delivered:** C-1, C-2, C-3 (schema-first validation groundwork), C-4, C-5 (bcrypt installed, hashing itself is Sprint 01), C-6, NFR-M1, NFR-M2, NFR-M5, NFR-PO1, NFR-PO2, NFR-U3/U5 (primitives), NFR-U6, UI-1, UI-3, NFR-P3, API-1, API-2, API-3, API-5, NFR-S5.

**Endpoints added:**

| Method | Path | Result |
|---|---|---|
| GET | `/api/health` | 200 `{ message: "backend is healthy" }` |
| GET | `/api/dev/error` | 500 generic Arabic message — dev-only, proves the global error middleware |
| — | any unmatched path | 404 `{ message }` JSON, never Express's default HTML |

**Screens added:**

| Path | Purpose |
|---|---|
| `/` | Placeholder landing page. Sprint 01 replaces it with the real entry point (SRS §4.1) |
| `/dev/rtl` | Permanent development tool: every shared primitive rendered with real Arabic, plus the three RTL hazards. Check before every sprint sign-off, at 360px |
| `*` | Redirects to `/` — routing behaviour, not a screen |

**Shared primitives added** (`client/src/components/`): `Spinner`, `EmptyState`,
`ErrorState`, `StatusStamp`, `FormField`, `Button`, `PageHeading`.

**Deviations from the sprint file:**

1. **Env file is `server/.env`, not `server.env`.** `AGENTS.md` §1 scaffolds
   `server.env` while §4 says values are read from `.env` files, and §5
   gitignores both — the doc is internally inconsistent. Sprint 00 task 6 says
   `.env`, and `.env` is dotenv's default with no extra config. Both names are
   gitignored, so switching later costs nothing.

2. **Added `routes/health.routes.js` and `controllers/health.controller.js`.**
   `AGENTS.md` §3 lists only the `user.*` trio. Putting the health handler in
   `server.js` would have mixed routing with business logic (NFR-M1). The folder
   layout is unchanged; only files were added inside it.

3. **Added `GET /api/dev/error`.** The sprint's acceptance criteria require
   proving that a thrown error produces the standard shape. The route is guarded
   by `NODE_ENV !== "production"` and never mounts in production.

4. **Added a 404 catch-all and a `CastError → 404` branch** to the global error
   middleware. The sprint file specifies only `ValidationError → 400` and
   `unrecognised → 500`; without these two, an unknown path returns Express's
   HTML page and a malformed ObjectId returns 500 — both forbidden by API-5.
   A duplicate-key (`11000`) → 400 branch was added for the same reason (FR-1.1).

5. **`start()` is guarded by `require.main === module`.** `npm start` behaves
   exactly as specified; the guard lets a script or test import the configured
   app without opening a DB connection or a port. This is how the endpoints were
   verified with MongoDB unavailable (see Known issues).

6. **`User` model implemented per SRS §5.1.** The sprint puts "any model beyond
   `User`" out of scope, so the User schema is in scope; `AGENTS.md` §1 scaffolds
   the file. Validation is declared once in the schema (NFR-M3) with Arabic
   messages from SRS §5.6, plus a `toJSON` transform that strips the password
   hash (NFR-S2). **No authentication logic** — no bcrypt hook, no JWT, no
   controller bodies. That is Sprint 01.

7. **`.claude/launch.json` added** so the client dev server can be launched and
   inspected by tooling. Not a product file.

8. **Postman collection created** at
   `postman/procurement-platform.postman_collection.json`. Requests were not
   clicked through the Postman GUI — they were exercised with equivalent HTTP
   calls (see the acceptance-criteria report for the transcript). The collection
   is the artifact later sprints append to.

**Conflicts checked and NOT found:** No statement in `sprint-00-foundation.md`
contradicts the SRS. Two items looked like conflicts and are not:

- The `tailwind.config.js` (Tailwind 3) vs `@tailwindcss/vite` (Tailwind 4)
  clash between `design.md` §8 and `AGENTS.md` §1 is already flagged in
  `SPRINT_PLAN.md` §2 and pre-resolved to the CSS-first `@theme` block. Only
  `client/src/index.css` holds the tokens; **no `tailwind.config.js` exists.**
- `/dev/rtl` is not in the SRS §4.1 screen inventory, and `design.md` §6 says not
  to invent screens beyond what the FRs require. `/dev/rtl` is a development
  tool the sprint file mandates, not a product screen; SRS §4.1 does not forbid
  non-product routes.

**Noted for Sprint 01 (not a Sprint 00 conflict):** `SPRINT_PLAN.md` §6 states
the token travels in the response body as `Authorization: Bearer <token>` and
that this project does **not** use httpOnly cookies, but the
`react-component` SKILL's examples (§5, §6) pass `withCredentials: true` to
axios. Follow SPRINT_PLAN §6 — it is downstream of SRS §4.2, which specifies
`200 { user, token }`. Sprint 00's `cors({ credentials: true })` is harmless
either way and was kept exactly as the sprint file specifies.

**Known issues carried forward:**

1. **MongoDB cannot run on this machine.** MongoDB 8.3 is installed at
   `C:\Program Files\MongoDB\Server\8.3`, but `mongod.exe` aborts immediately
   with `0xC0000139 STATUS_ENTRYPOINT_NOT_FOUND`, and its log directory is
   empty — the Windows service has never started successfully since it was
   installed. The VC++ 2015-2022 runtime is present and current, and the host is
   Windows 10 22H2 (build 19045); MongoDB 8.1+ dropped Windows 10 support, which
   is the most likely cause. **Consequence:** the "successful DB connection"
   half of the first acceptance criterion is unverified. The failure path is
   verified — the full error object is logged and the process exits 1.
   **Fix before Sprint 01:** install MongoDB 8.0 (the last line supporting
   Windows 10 — SRS requires only "MongoDB 6 or later"), or point
   `MONGOOSE_URI` at an Atlas cluster (NFR-PO1 permits either).

   **RESOLVED 2026-08-20 (during Sprint 01):** the owner supplied a MongoDB
   Atlas connection string. `npm start` now logs
   `[db] database connected: test` followed by `server is running on port 8000`,
   and `GET http://localhost:8000/api/health` answers from the real server.
   **Sprint 00 acceptance criteria are now 9/9.** The local MongoDB 8.3 install
   is still broken; nothing depends on it any more.

2. **Client-side env skeleton not created.** `VITE_EMAILJS_SERVICE_ID`,
   `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` are needed in
   Sprint 08 (FR-16). Sprint 00 task 6 only specifies the server `.env`, so no
   `client/.env.example` was created.

3. **`GEMINI_API_KEY` is present but empty** in `server/.env`. Needed in
   Sprint 05 (FR-10).

4. **`express-rate-limit` is installed but not wired.** Sprint 08 (NFR-S, L-3).

5. **Vite template leftovers kept:** `client/README.md` and
   `client/.oxlintrc.json` are the scaffold defaults, untouched.

6. **`helmet()` defaults will block cross-origin `/uploads` in Sprint 02.**
   Verified on the running server: helmet sets
   `Cross-Origin-Resource-Policy: same-origin`. The moment the API serves
   uploaded proof documents and auction images statically and the client at
   `:5173` loads them in an `<img>` or a link, the browser will refuse them —
   and the failure looks like a CORS bug, not a helmet setting. Expect to need
   `helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })`, or to
   scope that relaxation to the `/uploads` route only. Left as-is because
   Sprint 00 specifies a bare `helmet()` and there are no uploads yet.

**Postman collection updated:** yes — created (see deviation 8 for how it was
verified).

---

## Sprint 01 — Identity & Access — completed 2026-08-20

**All 12 acceptance criteria verified against a live MongoDB Atlas cluster.**
17/17 automated API checks passed, plus browser verification of the role guards
and the pending-organization behaviour. One criterion is verified in part by
inspection rather than observation — see the caveat below.

**Requirements delivered:** FR-1.1 … FR-1.6, FR-2.1 … FR-2.3, FR-3.1 … FR-3.5,
FR-5.1 … FR-5.5, NFR-S1, NFR-S2, NFR-S3, NFR-S6, NFR-S7, NFR-U1, NFR-U2, NFR-U3,
DATA-1, DATA-2, DATA-3, API-3, API-4.

**Endpoints added:**

| Method | Path | Auth | Role | Success | Failure |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | No | — | 200 `{ user }` | 400 `{ errors }` |
| POST | `/api/auth/login` | No | — | 200 `{ user, token }` | 400 `{ error }` |
| GET | `/api/users/me` | Yes | Any | 200 `{ user }` | 401 |

**Screens added:** `/login`, `/register/organization`, `/register/individual`,
`/admin/dashboard`, `/org/dashboard`, `/dashboard`. `/` was rewritten to link to
both registrations and login, and to the caller's own dashboard once signed in.

**Modules added:** `config/jwt.config.js` (`signToken`, `isAuth`, `isRole`),
`config/seed.js`, `controllers/auth.controller.js`, `routes/auth.routes.js`;
client `functions/api.js`, `functions/auth.js`, `functions/authContext.js`,
`functions/roles.js`, `functions/apiErrors.js`, and components `AuthProvider`,
`RequireAuth`, `RequireRole`, `LogoutButton`.

**Verification evidence.** Registration produced `status: "pending"` for an
organization and `"approved"` for an individual, read back from the database
rather than from the response. The stored password was a `$2b$10$` hash that
bcrypt accepted; no response body contained the plaintext or a `password` key.
A duplicate email returned 400 with an Arabic field-level message; a
three-character password returned 400 and wrote **no** document (DATA-2).
Unknown email and wrong password returned byte-identical 400 bodies, and the
wrong password was genuinely rejected — the missing-await failure mode is not
present. `/api/users/me` returned 401 with no token, with a garbage token, with
a tampered signature, and with a token signed by a foreign secret; the admin
probe returned 403 for an individual and 200 for the admin, so 401 and 403 are
demonstrably different paths. Registering with `role: "admin"` returned 400 and
created nothing; exactly one admin exists, from the seed. Saving a user without
touching the password left the hash byte-identical, so the `isModified` guard
holds.

In the browser: a pending organization logged in, landed on `/org/dashboard`,
showed the "قيد المراجعة" stamp and the review notice, and had **no**
tender-creation control — only logout. Flipping that account to `approved` made
the approval notice and the tender section appear, so the gate is conditional
rather than merely absent. A logged-in individual visiting `/admin/dashboard` or
`/org/dashboard` was redirected to `/dashboard`, and an organization visiting
the other two was redirected to `/org/dashboard`. A full browser reload kept the
session on `/org/dashboard`. A forged token together with a forged cached user
never rendered the admin screen and left storage cleared at `/login`.

**Caveat on criterion 10.** "Refreshing keeps the session" is verified by
observation. "Does not flash the login page" is verified **structurally, not by
sampling**: `isLoading` is initialised synchronously from `getToken()` before
first paint, so `RequireAuth` renders a spinner and its `!user` redirect branch
is unreachable while the session is being restored. High-frequency DOM sampling
of a cold mount was attempted and abandoned — the headless browser pane throttles
timers well below the resolution needed. Worth one look by eye on a real screen.

**Deviations from the sprint file:**

1. **`useAuth` lives in `functions/authContext.js`, not beside the provider.**
   Exporting a hook and a component from one file trips the linter's
   Fast-Refresh rule, and the project's own SKILL argues that warnings people
   learn to ignore are a defect. `components/AuthProvider.jsx` exports only a
   component. No `src/contexts/` directory was created — `AGENTS.md` §3 lists
   exactly three client source folders.

2. **Login failure is `400 { error }`, not 401.** SRS §4.2's endpoint table
   specifies `400 { error }` for `/api/auth/login`, while API-4 says
   "authentication failures shall return HTTP 401". Read together, API-4 governs
   protected endpoints reached without a valid token (FR-5.1); a bad credential
   posted to a public endpoint is a validation failure of the submitted form.
   The specific per-endpoint statement wins. This is an SRS-internal tension,
   resolved rather than escalated.

3. **`server.js` error middleware gained two branches** — a controller-supplied
   per-field map (`err.errors`) and a single-message body (`err.error`) — so
   controllers still `next(err)` and one place formats every response (NFR-M5)
   while honouring both shapes the SRS specifies.

4. **Expected 4xx failures log one line instead of a stack trace.** Genuine 5xx
   faults still log the full error object. Without this, every unauthenticated
   request would bury real faults in noise from Sprint 02 onward.

5. **`LogoutButton` navigates to `/login`, not `/`.** Clearing the user makes
   `RequireAuth` redirect to `/login` on the same tick, so the original
   `navigate("/")` created a race the guard always won. The code now states the
   actual outcome. Found by testing logout, not by reading it.

6. **`client/.env` and `client/.env.example` created** — Sprint 00 known issue 2,
   now closed. `VITE_API_URL` is set; the three `VITE_EMAILJS_*` keys are present
   but empty, for Sprint 08.

7. **`GET /api/admin/ping` was created, used, and deleted** exactly as the sprint
   file directs. It proved 401 differs from 403 (evidence above), then was
   removed along with its controller. From Sprint 02 the real
   `GET /api/admin/organizations/pending` carries that check; the Postman
   collection holds a placeholder request pointing at it.

**Bug found and fixed during verification:** rejecting `role: "admin"` returned
the schema's generic "نوع الحساب مطلوب." because the Mongoose validation pass
overwrote the controller's more specific message. The merge no longer overwrites
a message the controller already set.

**Security issue found and fixed:** `server/.env.example` — which is committed by
design — was found holding real live values: the Atlas username and password, the
JWT `SECRET`, `ADMIN_PASSWORD`, and a real `GEMINI_API_KEY`. That violates C-4
and NFR-S4. The file was restored to a placeholder template. Nothing had been
committed, so no secret entered git history. **The exposed credentials should
still be rotated** if this repository is ever pushed or shared.

**Conflicts checked and NOT found:** nothing in `sprint-01-identity-access.md`
contradicts the SRS. Deferring the multer proof-document upload to Sprint 02
while still requiring `proofDocumentUrl` looks like it weakens FR-1.3, but
`SPRINT_PLAN.md` §3 explicitly assigns FR-1.3 to Sprint 02 — the requirement is
enforced now; only the upload mechanism is phased.

**Known issues carried forward:**

1. **The Atlas URI names no database, so everything lands in `test`,** beside an
   unrelated `jokes` collection from an earlier project. Adding
   `/procurement_platform` before the `?` in `MONGOOSE_URI` would give this
   project its own database. Harmless today — `users` was empty — but worth
   fixing before real data accumulates.
2. **No token expiry** — accepted limitation L-1, not an oversight.
3. **`isAuth` performs one `User.findById` per protected request.** Deliberate:
   role *and* status are re-derived from the record (NFR-S6), so an admin
   approval takes effect immediately rather than at next login. Revisit only if
   NFR-P1 is ever missed.
4. **Sprint 00 known issues 4, 5, 6 still stand.** Issues 1, 2 and 3 are now
   closed.
5. **All verification data was cleaned up.** The `users` collection holds only
   the seeded admin; the unrelated `jokes` collection was not touched.

**Postman collection updated:** yes — a 12-request "Sprint 01" folder covering a
success and at least one failure per endpoint. The equivalent HTTP calls were all
executed and passed; the requests were not clicked through the Postman GUI.

---

## Sprint 02 — Admin Organization Review — completed 2026-08-20

**All 12 acceptance criteria verified.** 20/20 automated API checks passed, plus
browser verification of the upload form and the admin review screen. Sprint 01
was re-run and is 17/17, now including a real 401-vs-403 pair against this
sprint's admin endpoint.

**Requirements delivered:** FR-1.3, FR-4.1, FR-4.2, FR-4.3, FR-4.5 (call sites
marked, not wired), NFR-S8, NFR-U3, NFR-U4, NFR-U5, C-9, API-2, API-5.

**Endpoints added:**

| Method | Path | Auth | Role | Success | Failure |
|---|---|---|---|---|---|
| GET | `/api/admin/organizations/pending` | Yes | Admin | 200 `{ organizations }` | 401, 403 |
| PATCH | `/api/admin/organizations/:id/approve` | Yes | Admin | 200 `{ organization }` | 400, 401, 403, 404 |
| PATCH | `/api/admin/organizations/:id/reject` | Yes | Admin | 200 `{ organization }` | 400, 401, 403, 404 |
| GET | `/uploads/:file` | No | — | the stored document | 404 |

`POST /api/auth/register` now accepts `multipart/form-data` for the organization
branch; the individual branch still posts plain JSON. One route serves both.

**Screens changed:** `/register/organization` gained a file field with Arabic
helper text, a courtesy type/size pre-check, and an upload progress bar.
`/admin/dashboard` became the real review queue.

**Modules added:** `config/multer.config.js`, `controllers/admin.controller.js`,
`routes/admin.routes.js`, `isApprovedOrganization` in `config/jwt.config.js`;
client `components/FileField.jsx`, `components/PendingOrganizationCard.jsx`,
`functions/uploads.js`, and a `fileUrl` helper in `functions/api.js`.

**Verification evidence.** A registration with a real PDF stored
`/uploads/<generated>.pdf`, and fetching that URL returned the file with
`content-type: application/pdf`. Registration without a document returned 400
with an Arabic field message. A 6MB file returned 400 with an Arabic size
message, not 500. An `.exe` was rejected both when declared honestly and when
disguised as `application/pdf`. A `.txt` renamed `.pdf` **and declared
`application/pdf`** — exactly what a browser sends — was rejected. Every
rejected upload left `/uploads` with no extra file. The pending list contained
only pending organizations, as a named key, with no password field. All three
admin endpoints returned 403 for a non-admin token and 401 for no token.
Approve flipped the status and the organization's next login reported
`approved`; approving again returned 400. Reject stored the reason. An unknown
id and a malformed id both returned 404.

In the browser at 360px: the registration form uploaded a real PDF through the
actual file input and redirected to `/login` with the Arabic pending notice. The
admin dashboard listed both pending organizations with the document link
carrying `target="_blank"` and `rel="noopener noreferrer"`, and the linked file
fetched cross-origin as a real `%PDF`. Rejecting showed the confirm step with an
optional reason and left both cards in place until confirmed; confirming removed
only that card. Approving the last one left the Arabic empty state. Both
decisions were read back from the database, the rejection with its reason
intact.

The `isApprovedOrganization` gate was unit-tested across all six cases: no user
→ 401; individual, admin, pending organization and rejected organization → 403;
approved organization → `next()`.

**Deviations from the sprint file:**

1. **Magic-byte validation, not just `file.mimetype`.** The sprint says to check
   the MIME type rather than the extension. That alone does not satisfy the
   acceptance criterion "a .txt renamed to .pdf is rejected": `file.mimetype` is
   the Content-Type the *client* declares, and a browser derives it from the
   very extension being faked, so a renamed file arrives declared as
   `application/pdf` and passes. `verifyUploadedFile` therefore also reads the
   first bytes off disk and matches them against the real PDF/PNG/JPEG
   signatures, deleting the file before rejecting. The declared-type check is
   kept as the cheap first gate.

2. **`rejectionReason` added to the User schema.** SRS §5.1 lists no field for
   it, but FR-4.3 requires the optional reason to be stored. The data model is
   silent rather than contradictory, so the field was added rather than
   escalated.

3. **`nodemonConfig.ignore` for `uploads/*`.** Uploaded files land inside
   `server/`, which nodemon watches, so every upload restarted the API in the
   middle of its own request. This cost a failed verification run before it was
   diagnosed. Sprints 04 and 06 would have hit the same wall.

4. **helmet's `Cross-Origin-Resource-Policy` relaxed on `/uploads` only.**
   Sprint 00 known issue 6, now due. The default `same-origin` policy defeats
   the purpose of serving documents to a client on another port. Scoped to that
   one route; the API keeps helmet's defaults.

5. **Orphaned uploads are deleted on a later validation failure.** multer writes
   the file before the controller runs, so a duplicate email would otherwise
   leave the document on disk forever with no record pointing at it.

6. **`AdminDashboardPage` fetches inside its effect with a cancellation flag**
   rather than calling a component-scope function, because oxlint's
   `set-state-in-effect` rule flags the latter and its disable directive was not
   honoured. The rewrite also cancels an in-flight request on unmount, which the
   original did not.

7. **The 400 for an already-decided organization** is not in SRS §4.2's failure
   column for these endpoints (which lists 401, 403, 404). FR-4.2 and FR-4.3
   both describe acting on a *pending* organization, so a second decision falls
   outside the specified operation, and API-3's 400 is the honest answer. The
   sprint file requires it explicitly.

**Conflicts checked and NOT found:** nothing in `sprint-02-admin-review.md`
contradicts the SRS. Three items were examined and cleared:

- Deferring the approval/rejection **email** to Sprint 08 does not drop FR-4.4.
  `SPRINT_PLAN.md` §3 puts all five notifications in Sprint 08 precisely because
  they wire into events created in 02, 05 and 07. Both call sites carry a
  `TODO(sprint-08)` naming FR-4.4, FR-16.1 and the no-rollback rule.
- Registration becoming `multipart/form-data` sits awkwardly beside API-1 ("all
  request and response bodies shall use JSON"), but C-9 and AGENTS.md §5 mandate
  multer, which is multipart by definition. API-1 governs data payloads; the
  response stays JSON.
- The extra 400 case, above.

**Known issues carried forward:**

1. **Uploaded PDFs are served inline**, so a browser renders them in place. Fine
   for the MVP with generated filenames and a validated three-type allowlist,
   but a production deployment would serve them with
   `Content-Disposition: attachment`.
2. **`isApprovedOrganization` is built but not yet wired to any route** — by
   design. Sprint 03 places it in front of tender creation (FR-6.3).
3. **The Atlas URI still names no database**, so data lands in `test` beside an
   unrelated `jokes` collection. Unchanged from Sprint 01.
4. **No token expiry** — accepted limitation L-1.
5. **Local disk storage** — accepted limitation L-4. The API contract stores a
   URL, so moving to Cloudinary later changes no response shape.
6. **Sprint 00 known issues 4 and 5 still stand.** Issue 6 is now closed.
7. **All verification data was cleaned up** — test users and their uploaded
   files removed; `/uploads` holds 0 files. Two accounts are present that this
   sprint did not create: the seeded admin, and an `aws@gmail.com` individual
   registered by the owner. Both were left untouched.

**Postman collection updated:** yes — a 12-request "Sprint 02" folder covering
the four upload rejection cases, all three admin endpoints with their 401/403
pairs, the approve-twice 400, and the 404. The Sprint 01 registration requests
were converted to `multipart/form-data`, since organization registration now
requires a real file. The equivalent HTTP calls were all executed and passed;
the requests were not clicked through the Postman GUI.

---

## Sprint 03 — Tenders — completed 2026-08-20

**All 12 acceptance criteria verified.** 30/30 automated API checks passed, plus
browser verification of browsing, filtering, the create/edit forms, and the
ownership-aware rendering. Sprints 01 and 02 were re-run: 17/17 and 20/20.

**Requirements delivered:** FR-6.1, FR-6.2, FR-6.3, FR-7.1, FR-7.2, FR-7.3,
FR-8.1, FR-8.2, FR-8.3, DATA-1, DATA-2, DATA-3, NFR-U1 … NFR-U5, API-2, API-5.

**Endpoints added:**

| Method | Path | Auth | Role | Success | Failure |
|---|---|---|---|---|---|
| POST | `/api/tenders` | Yes | Approved organization | 200 `{ tender }` | 400, 401, 403 |
| GET | `/api/tenders` | Yes | Any | 200 `{ tenders }` | 401 |
| GET | `/api/tenders/:id` | Yes | Any | 200 `{ tender }` | 401, 404 |
| PATCH | `/api/tenders/:id` | Yes | Owner | 200 `{ tender }` | 400, 401, 403, 404 |
| DELETE | `/api/tenders/:id` | Yes | Owner or admin | 200 `{ message, tender }` | 400, 401, 403, 404 |

**Screens added:** `/tenders` (filter bar + card grid), `/tenders/:id` (registry
heading, data rail, owner controls, disabled proposal placeholder),
`/tenders/new`, `/tenders/:id/edit`. `/org/dashboard` gained an "عطاءاتي" list
with edit and close on each open tender.

**Modules added:** `models/tender.model.js`, `controllers/tender.controller.js`,
`routes/tender.routes.js`, `config/ownership.config.js`; client
`components/TenderCard.jsx`, `TenderFilters.jsx`, `TenderForm.jsx`,
`DataRail.jsx`, `functions/tenders.js`.

**Verification evidence.** An approved organization created a tender that
defaulted to `open`, with `createdBy` taken from the token — sending `createdBy`
and `status: "closed"` in the body changed neither. A pending organization got
403 with an Arabic explanation, as did an individual and an admin; no token got
401. A past deadline was rejected on create **and** on update, and the refused
update left the stored deadline untouched. Filtering returned only the requested
category, only budgets inside the range, an empty list for an unmatched range,
and every open tender with no filter. A second organization editing someone
else's tender got 403 and changed nothing; so did an **admin**, since FR-8.1
gives editing to the owner alone. The owner could edit while open. An admin
closed another organization's tender (FR-8.3); an unrelated organization could
not. Editing a closed tender returned 400, as did closing it twice. A malformed
id returned 404 on both a read and a mutation. The detail response populated
only the owning `companyName`, with no password field. `mine=true` returned the
caller's own tenders across all statuses and nothing belonging to anyone else.

In the browser at 360px: the organization dashboard listed its three tenders
with edit and close actions; the browse page filtered to one card by category
and **the filter survived a hard refresh through the URL** (`?category=صيانة`,
select still populated, reset button offered); an unmatched budget filter showed
the Arabic empty state with a reset action. The edit form pre-filled every
field, carried `min` set to today, rejected a past deadline with the message
tied to the deadline input while preserving the typed title, then saved
successfully. Closing took a confirm step and flipped the stamp to `مغلق`, after
which the edit and close controls disappeared. Logged in as an individual: no
create button, no edit or close on someone else's tender, `/tenders/new`
redirected away, and the closed tender dropped out of the browse list.

**Deviations from the sprint file:**

1. **`isOwnerOrAdmin` is a factory taking the model and an `allowAdmin` flag.**
   The sprint describes one middleware that "loads the tender", but it also asks
   for reuse in Sprints 04 and 05, which act on proposals. Parameterising by
   model costs nothing and avoids a second implementation. The loaded document
   is attached to `req.resource` so the controller does not re-read it.

2. **`allowAdmin: false` on PATCH.** The sprint's task list says
   "isOwnerOrAdmin (mutations)", but its own endpoint table says PATCH is
   **Owner** and DELETE is **Owner or Admin** — matching SRS §4.2 and FR-8.1.
   Editing is owner-only; an admin moderates by closing. Verified: an admin
   editing another organization's tender gets 403.

3. **`GET /api/tenders?mine=true`.** The sprint requires a "my tenders" list on
   the organization dashboard, which needs closed and cancelled rows, but SRS
   §4.2 defines no separate endpoint. Adding a query parameter keeps the
   endpoint list as specified rather than inventing a route. An explicit
   `status` parameter is supported for the same reason.

4. **DELETE is a soft close, not a hard delete.** The SRS has no
   deletion requirement; FR-8.2 says "close or cancel", and §5.2 keeps `closed`
   and `cancelled` as states. DELETE sets `closed`, or `cancelled` when the body
   asks for it. The response carries `{ message, tender }` — `message` as SRS
   §4.2 specifies, with the updated tender added so the client need not refetch.

5. **`category` is a fixed Arabic enum.** SRS §5.2 only says "String, Required",
   but a free-text category makes the FR-7.2 filter unusable. The sprint file
   calls for this. The list lives in the schema and is mirrored in
   `client/src/functions/tenders.js` with a comment noting the schema is the
   authority — there is no shared package in this structure.

6. **`/tenders/new` and `/tenders/:id/edit` are new routes.** SRS §4.1 does not
   list them, and design.md §6 warns against inventing screens — but FR-6.1 and
   FR-8.1 require somewhere to create and edit. Routes rather than modals, so
   the forms are linkable and survive a refresh.

7. **The update path loads and saves the document** instead of
   `findOneAndUpdate`. That makes the future-date validator run without relying
   on anyone remembering `runValidators: true` — the failure mode the sprint
   file calls out. Verified directly.

8. **`min` added to `FormField`, `title` added to `Button`.** Both explicit
   props, not a spread: the date input needs a courtesy lower bound and the
   disabled proposal placeholder needs its Arabic "coming soon" tooltip.

9. **A confirm step was added to the dashboard's close button.** The sprint asks
   for one on close; the first version fired immediately from the card. NFR-U4
   requires the confirm, so both the card and the detail page now take two steps.

**Conflicts checked and NOT found:** nothing in `sprint-03-tenders.md`
contradicts the SRS. One item was examined and cleared: design.md §6 labels the
tender list "Tender list (public)", while SRS §4.1 marks `/tenders` as
Protected, any authenticated role. The SRS wins and the sprint file agrees with
it; design.md's parenthetical is loose wording about visual treatment, not an
access rule.

**Known issues carried forward:**

1. **`cancelled` is reachable only by sending `{ "status": "cancelled" }` to
   DELETE.** No UI exposes it yet; the close controls always send a plain
   DELETE, which sets `closed`. Enough for FR-8.2; revisit if the admin ever
   needs to distinguish a moderation cancellation in the interface.
2. **The category list is duplicated** between the schema and the client. Kept
   in step by hand. A shared constants module would need a build change that
   `AGENTS.md` §3 does not describe.
3. **No pagination on `GET /api/tenders`.** Fine at MVP volumes; the response is
   already a named key, so adding a `page` parameter later changes no shape.
4. **The Atlas URI still names no database** — data lands in `test` beside the
   unrelated `jokes` collection. Unchanged since Sprint 01.
5. **No token expiry** — accepted limitation L-1. **Local disk uploads** — L-4.
6. **Sprint 00 known issues 4 and 5 still stand.**
7. **All verification data was cleaned up.** The `users` collection holds only
   the seeded admin and the owner's own `aws@gmail.com` account; `tenders` is
   empty; `/uploads` holds no files. Two orphaned accounts from a harness run
   that crashed mid-way were also removed.

**Postman collection updated:** yes — an 18-request "Sprint 03" folder covering
create (success, pending 403, individual 403, past deadline 400, no token 401),
list (unfiltered, by category, by budget range, mine), detail (success,
malformed id 404), edit (owner, other organization 403, past deadline 400,
closed 400) and close (owner, admin, unrelated 403). The equivalent HTTP calls
were all executed and passed; the requests were not clicked through the Postman
GUI.

---

## Sprint 04 — Proposals — completed 2026-08-20

**All 12 acceptance criteria verified.** 27/27 automated API checks passed, plus
browser verification of submission, the two business rules, and the owner's
review list. Sprints 01-03 were re-run: 17/17, 20/20, 30/30. **94 checks green
in total.**

**Requirements delivered:** FR-9.1, FR-9.2, FR-9.3, FR-9.4, FR-11.1, C-9 and
NFR-S8 (reused pipeline), DATA-1, DATA-2, NFR-U2, NFR-U3, NFR-U5.

**Endpoints added:**

| Method | Path | Auth | Role | Success | Failure |
|---|---|---|---|---|---|
| POST | `/api/tenders/:id/proposals` | Yes | Approved organization, not the owner | 200 `{ proposal }` | 400, 401, 403, 404 |
| GET | `/api/tenders/:id/proposals` | Yes | Tender owner or admin | 200 `{ proposals }` | 401, 403, 404 |
| GET | `/api/proposals/:id` | Yes | Tender owner, submitter, or admin | 200 `{ proposal }` | 401, 403, 404 |

**Screens changed:** `/tenders/:id` gained the proposal form, gated by role,
approval status, ownership and tender status. `/tenders/:id/proposals` is new —
the owner's read-only review list.

**Modules added:** `models/bidProposal.model.js`,
`controllers/proposal.controller.js`, `routes/proposal.routes.js`; client
`components/ProposalForm.jsx`, `pages/TenderProposalsPage.jsx`.

**Verification evidence.** An approved organization submitted against another
organization's open tender: status defaulted to `submitted`, `submittedBy` came
from the token, `documentUrl` was stored as a URL and served back at 200, and
`aiExtractedData` was **absent** with nothing breaking. The tender's own owner
got 403 with the specific self-bid message; a second submission from the same
organization got 400 with the specific duplicate message. **The duplicate is
blocked at the database level:** a direct `insertOne` bypassing the controller
entirely was rejected with code 11000, and the compound unique index
`tender_1_submittedBy_1` was confirmed present in MongoDB. A proposal against a
closed tender returned 400. A pending organization, an individual and an admin
all got 403; no token got 401. The Sprint 02 upload rules still applied — a 6MB
file, a `.txt` renamed `.pdf` and declared `application/pdf`, and a missing
document each returned 400, and every rejected submission left no orphan file in
`/uploads`. A negative price returned the SRS §5.6 message. On confidentiality:
a third organization, the *submitting* organization, and an individual were all
refused the proposal list with 403; only the owner and an admin saw it, populated
with the submitting company and no password field. `GET /api/proposals/:id`
answered 200 for owner, submitter and admin, 403 for everyone else, 404 for a
malformed id.

In the browser at 360px: the bidder submitted a real PDF through the actual form
with the submit button disabled and `aria-busy` set in flight, then saw the
Arabic success notice. Re-submitting produced **"لقد قدّمت عرضاً على هذا العطاء
مسبقاً."** with the typed price and chosen file preserved. The tender owner saw
no submit form at all, only the review link; the review list showed the
submitting company, the `مُقدَّم` stamp, price/date/confidence rail with the
"لم يُجرَ التحليل بعد" placeholder, and a document link carrying
`rel="noopener noreferrer"`. A tender with no proposals rendered the Arabic empty
state. A competitor navigating straight to `/tenders/:id/proposals` got an Arabic
permission message, zero rows, and **no price anywhere on the page**. An
individual saw no proposal section at all.

**Deviations from the sprint file:**

1. **`GET /api/tenders/:id/proposals` is not in SRS §4.2's endpoint table**,
   though FR-11.1 requires the capability and SRS §4.1 lists the
   `/tenders/:id/proposals` screen. The table is silent, not contradictory, so
   the endpoint was added to satisfy FR-11.1 — the same kind of gap-fill as
   `rejectionReason` in Sprint 02.

2. **`GET /api/proposals/:id` also admits the submitter.** SRS §4.2 says "Owner
   or Admin" without saying which owner. FR-10.2 and FR-10.3 require the
   *submitting* organization to see its own AI-extracted data before final
   submission, so the submitter must be able to read its own proposal. Verified
   that nobody else can.

3. **The proposal form lives on `/tenders/:id`, not its own route.** SRS §4.1
   gives that screen the purpose "View a tender, **submit a proposal**". The
   form sits inside the detail page with a deliberate gap between the upload and
   the submit button, where Sprint 05 inserts the AI panel.

4. **Reused `isOwnerOrAdmin(Tender)` for the list route** rather than writing a
   fresh check. That is exactly the reuse Sprint 03 built the factory for.

5. **`finalPrice` uses `min: 0.01`, not just "required".** SRS §5.6 says
   "Present, positive number"; `required` alone would accept `0` and negatives.

6. **The controller catches E11000 itself** instead of leaving it to the global
   middleware. The generic handler maps duplicate keys to a per-field map keyed
   by index fields, which would produce "هذه القيمة مستخدمة مسبقاً" against
   `tender` — useless to a user. The controller returns the SRS §5.6 sentence.

**Conflicts checked and NOT found:** nothing in `sprint-04-proposals.md`
contradicts the SRS. Both items above are gaps in the SRS's endpoint table
rather than disagreements with it.

**Known issues carried forward:**

1. **No "my proposals" list for the submitting organization.** SRS §4.1
   describes the organization dashboard as "My tenders, my proposals", but no FR
   requires the list and Sprint 04 does not ask for it. A submitter can reach
   its own proposal by id, not by list. Worth adding in Sprint 05, when accept
   and reject give it something to report.
2. **`under_review` is unreachable.** The enum carries it (SRS §5.3) but nothing
   sets it; proposals go straight from `submitted` to `accepted`/`rejected` in
   Sprint 05.
3. **The review list is read-only.** Accept and reject are FR-11.2, Sprint 05.
4. **`aiExtractedData` is absent on every proposal** — by design (FR-10.4). The
   confidence column already renders a placeholder for it.
5. **The Atlas URI still names no database** — data lands in `test` beside the
   unrelated `jokes` collection. Unchanged since Sprint 01.
6. **No token expiry** — L-1. **Local disk uploads** — L-4.
7. **Sprint 00 known issues 4 and 5 still stand.**
8. **All verification data was cleaned up.** `users` holds only the seeded admin
   and the owner's own `aws@gmail.com`; `tenders` and `bidproposals` are empty;
   `/uploads` holds no files.

**Postman collection updated:** yes — a 12-request "Sprint 04" folder covering
submission (success, self-bid 403, duplicate 400, closed tender 400, pending
organization 403, bad upload 400, missing price 400), the proposal list (owner
200, other organization 403, empty 200), and proposal detail (permitted 200,
unrelated 403). The collection now holds 57 requests across five folders. The
equivalent HTTP calls were all executed and passed; the requests were not
clicked through the Postman GUI.

---

## Sprint 05 — AI Analysis & Proposal Decisions — completed 2026-08-20

**All 13 acceptance criteria verified.** 24/24 automated API checks passed
against the live Gemini API, plus browser verification of the three-step flow,
the failure path, and the owner's decision screen. Sprints 01-04 were re-run:
17/17, 20/20, 30/30, 27/27. **118 checks green in total.**

**Requirements delivered:** FR-10.1 … FR-10.4, FR-11.1 … FR-11.4, C-7, NFR-M4,
NFR-R1, NFR-P4, NFR-U3, NFR-U4.

**Endpoints added:**

| Method | Path | Auth | Role | Success | Failure |
|---|---|---|---|---|---|
| POST | `/api/proposals/:id/analyze` | Yes | Submitter | 200 `{ aiExtractedData }` | 401, 403, 404, **502** |
| PATCH | `/api/proposals/:id` | Yes | Submitter | 200 `{ proposal }` | 400, 401, 403, 404 |
| PATCH | `/api/proposals/:id/status` | Yes | Tender owner | 200 `{ proposal }` | 400, 401, 403, 404 |

**Screens changed:** the proposal form on `/tenders/:id` became a three-step
flow (upload → analysing → review). `/tenders/:id/proposals` gained the AI
panel, the price comparison, and Accept / Reject.

**Modules added:** `controllers/ai.controller.js`; client
`components/ConfidenceMeter.jsx`, `ProposalSection.jsx`,
`ProposalReviewCard.jsx`.

**Verification evidence.** A structurally valid PDF stating "Total price: 47500
ILS" produced `extractedPrice: 47500`, an Arabic summary, and a confidence score
inside 0–100 — read back from the database, not just the response. The submitter
revised the price to 46000 and that is what `finalPrice` holds, while
`aiExtractedData.extractedPrice` still reads 47500 for the owner's comparison.
Only the submitter can analyse or revise (tender owner 403, other organization
403, no token 401); only the tender owner can decide (submitter, other
organization and individual all 403). An invalid decision value returned 400
with a field message. **Accepting one proposal left the second at `submitted`**
(FR-11.4), and rejecting it afterwards was a separate call. Deciding twice, and
revising a price after a decision, both returned 400.

On graceful degradation: with `GEMINI_API_KEY` set to an invalid value the
proposal was still created and its price still set manually, and the analysis
failure surfaced as **502, not 400**. An unsupported file type and a missing
file both produced 502 rather than a crash. `@google/generative-ai` is imported
in exactly one file, and the key appears in no source file and no response body.

In the browser at 360px: the three-step flow ran end to end. The analysing stage
showed its Arabic progress state. On the owner's screen the card showed final
price 60,000 against extracted 47,500 with an explicit mismatch warning, the
Arabic summary, and the confidence meter reading **"ثقة مرتفعة — 98%"** with the
"this is an automated estimate" caveat. Reject took a confirm step and left the
stamp untouched until confirmed; accepting flipped it to `مقبول` in place and
removed the decision buttons.

**The AI failure path was verified twice, from two genuinely different causes** —
a malformed document (Gemini 400) and upstream load (Gemini 503). Both times the
UI showed the calm Arabic notice, kept the price field editable with the typed
value intact, kept the confirm button enabled, and showed no status code or raw
error. Submission completed manually at the user's own price.

**Deviations from the sprint file:**

1. **`PATCH /api/proposals/:id` is a new endpoint.** SRS §4.2 defines
   `/api/proposals/:id/analyze`, which needs an existing proposal, while FR-10.2
   says the analysis is shown "before final submission" and FR-10.3 requires the
   submitter to override the extracted price. Those cannot both hold with the
   endpoint list as written — see the note below. The proposal is created first,
   analysed by id, then its price revised through this endpoint.
2. **`GEMINI_MODEL` is configurable, defaulting to `gemini-flash-latest`.** The
   supplied key does not have access to `gemini-2.0-flash` or `gemini-2.5-flash`
   on the v1beta endpoint; `ListModels` and a live call confirmed
   `gemini-flash-latest` works. Hard-coding a model name would have made the
   integration break on the next model retirement.
3. **The SDK error is never re-thrown.** Every failure becomes our own 502 with
   a sanitised, key-redacted reason, so no SDK object can carry the API key into
   a log line.
4. **`ProposalSection` owns the submission flow and calls the API directly** —
   the self-contained-lifecycle exception in the react-component skill §1. It is
   rendered with `key={tenderId}` so React remounts it per tender; see the bug
   below. This also brought `TenderDetailPage` back under 200 lines.
5. **Deciding an already-decided proposal returns 400.** Not specified either
   way. FR-11.4 governs *other* proposals; re-deciding the same one is blocked
   for the same reason Sprint 02 blocks re-approving an organization.

**Bugs found during verification and fixed:**

- **Proposal state leaked between tenders.** `TenderDetailPage` stays mounted
  when only the `:id` param changes, so after submitting on one tender, opening
  a different one showed "تم إرسال عرضك بنجاح" and no form at all — the user
  could not bid without a full page reload. Fixed by moving the flow into
  `ProposalSection` and keying it on the tender id.
- **The decision response dropped the submitting company.**
  `PATCH /:id/status` populated only `tender`, so merging the response into the
  list replaced the populated `submittedBy` with a raw id and the company name
  vanished from the card after a decision. The response now populates both.

**A note on the SRS, not a sprint conflict.** FR-10.2 says the analysis is shown
"before final submission", but SRS §4.2 defines analysis as
`POST /api/proposals/:id/analyze`, which requires the proposal to already exist,
and lists no endpoint for changing `finalPrice` afterwards. Read together those
cannot both be satisfied. The explicit endpoint spec was treated as governing
and the gap filled with `PATCH /api/proposals/:id`. The practical consequence is
that a proposal record exists, at the price the submitter first typed, during
the seconds between upload and confirmation. **Worth a decision:** if the record
must not exist until after review, the analyze endpoint has to take the document
rather than a proposal id, which would contradict SRS §4.2 as written.

**Known issues carried forward:**

1. **Gemini returns transient 503s under load, often.** Roughly a third of calls
   during verification. The system degrades correctly every time, but a user may
   need to retry to get an analysis. No retry was added — the sprint does not
   ask for one and NFR-R2 warns against retry loops. A single bounded retry on
   503 would be a cheap improvement if the rate stays this high.
2. **A document with no recognisable price is treated as a failure.** The sprint
   requires rejecting a non-numeric `extractedPrice`, so a priceless document
   yields 502 and the manual path, rather than a summary with a null price.
3. **No "my proposals" list for the submitting organization** — carried from
   Sprint 04. Now more visible, since a submitter has no in-app way to see that
   its proposal was accepted or rejected. The decision email is Sprint 08; the
   list deserves a home before then.
4. **`under_review` is still unreachable.** Proposals go straight from
   `submitted` to `accepted`/`rejected`.
5. **The Atlas URI still names no database** — data lands in `test`.
6. **No token expiry** (L-1), **local disk uploads** (L-4).
7. **Sprint 00 known issues 4 and 5 still stand.**
8. **Verification data was cleaned up**, including four orphans from a harness
   run that crashed mid-way. The `demo-*` accounts seeded for manual testing were
   deliberately left in place.

**Postman collection updated:** yes — a 9-request "Sprint 05" folder covering
analysis (success, wrong caller 403, AI unavailable 502), price revision (owner
200, other 403), and decisions (accept, reject, wrong caller 403, invalid value
400). The collection now holds 66 requests across six folders. The equivalent
HTTP calls were all executed and passed; the requests were not clicked through
the Postman GUI.

---

## Sprint 06 — Auctions — completed 2026-08-20

**All 13 acceptance criteria verified.** 28/28 automated API checks passed, plus
browser verification of public browsing with no session at all. Sprints 01-05
were re-run: 17/17, 20/20, 30/30, 27/27, 24/24. **146 checks green in total.**

**Requirements delivered:** FR-12.1 … FR-12.5, NFR-U5, C-9 and NFR-S8 (reused
upload pipeline), API-2, API-5.

**Endpoints added:**

| Method | Path | Auth | Role | Success | Failure |
|---|---|---|---|---|---|
| POST | `/api/auctions` | Yes | Approved organization or admin | 200 `{ auction }` | 400, 401, 403 |
| GET | `/api/auctions` | **No** | — | 200 `{ auctions }` | — |
| GET | `/api/auctions/:id` | **No** | — | 200 `{ auction }` | 404 |
| GET | `/api/users/me/auctions` | Yes | Any | 200 `{ auctions }` | 401 |
| GET | `/api/admin/auctions/pending` | Yes | Admin | 200 `{ auctions }` | 401, 403 |
| PATCH | `/api/admin/auctions/:id/approve` | Yes | Admin | 200 `{ auction }` | 400, 401, 403, 404 |

**Screens added:** `/auctions` and `/auctions/:id` (both public), `/auctions/new`.
`/org/dashboard` gained "مزاداتي"; `/admin/dashboard` gained a pending-auctions
queue beside the pending-organizations one.

**Modules added:** `models/auction.model.js`,
`controllers/auction.controller.js`, `routes/auction.routes.js`,
`isApprovedOrganizationOrAdmin` and `attachUserIfPresent` in
`config/jwt.config.js`; client `components/AuctionCard.jsx`,
`AuctionCountdown.jsx`, `functions/auctions.js`, and three pages.

**Verification evidence.** An approved organization created an auction that
defaulted to `pending_approval` with `currentPrice` equal to `startingPrice`,
persisted and never null. An **admin** listing was also `pending_approval` — no
self-approval shortcut — and a `status: "active"` sent in the body was ignored.
`GET /api/auctions` answered 200 **with no Authorization header at all**, and the
response body contained no pending listing and never even the string
`pending_approval`. A pending auction's detail returned 404 to an anonymous
visitor *and* to an unrelated signed-in user, while its creator and an admin got
200. Admin approval flipped it to `active` and it appeared publicly at once;
approving twice returned 400, and a non-admin got 403. A `startingPrice` of 0 or
negative and a past `endsAt` each returned 400 with Arabic field messages. An
auction with no image was created cleanly with no `imageUrl`. A pending
organization and an individual were both refused creation with 403. Each listed
auction carried `timeRemainingMs`, and an auction whose `endsAt` had passed
dropped out of the public list on the next read.

In the browser at 360px, **logged out entirely**: `/auctions` showed the two
active listings — one with its image, one with the "لا توجد صورة" placeholder
rather than a broken image icon — with live countdowns, status stamps, and no
create button. The detail page showed the price prominently in the display face,
the data rail, and the Sprint 07 bid placeholder disabled. The countdown ticked
(`23:59:23` → `23:59:19` across a two-second sample) and a pending auction's URL
produced the Arabic "المزاد المطلوب غير موجود." with no status code and no leak
of its title. Creating an auction showed the awaiting-approval notice; the
organization dashboard listed it with the `قيد الموافقة` stamp; the admin
dashboard's queue approved it; and it then appeared in the public list **while
logged out**.

**The endpoint conflict, resolved by the owner.** `sprint-06` line 85 defines
`GET /api/users/me/auctions` as **Role: Any**, returning the caller's own
*created* listings. **SRS §4.2 defines the same path as Role: Individual**, and
FR-14.4 makes it the individual's *participation* history with outcomes —
which is exactly how `sprint-07` line 101 re-specifies it. This was raised
before any code was written and the owner chose to **follow sprint-06
literally**. The endpoint therefore ships with the sprint-06 meaning, and both
the controller and the Postman entry carry a note saying so.

> **Sprint 07 must resolve this.** Implementing FR-14.4 on the same path will
> break the organization dashboard's "مزاداتي" list unless that list is moved
> first — `GET /api/auctions?mine=true` is the obvious home, matching the
> `?mine=true` pattern already used for tenders in Sprint 03.

**Deviations from the sprint file:**

1. **`currentPrice` is set in `pre("validate")`, not `pre("save")`.** The sprint
   says a save hook, but Mongoose validates *before* save hooks run, so a
   `pre("save")` assignment arrives after `required: true` has already failed
   and every creation would 400. The hook still lives with the data, as
   intended.
2. **`GET /api/admin/auctions/pending` added.** Frontend task 6 requires a
   pending-auctions queue on the admin dashboard, but no endpoint feeds it and
   the public list deliberately hides pending listings. Mirrors Sprint 02's
   `/api/admin/organizations/pending` exactly. A gap-fill, not a conflict.
3. **`attachUserIfPresent` middleware added.** The public auction detail must
   behave differently for a creator or an admin while never rejecting anyone, so
   it needs a token reader that cannot 401. `isAuth` cannot do this.
4. **`isApprovedOrganizationOrAdmin` added.** FR-12.1 allows either, but
   `isApprovedOrganization` alone refuses admins.
5. **A pending auction returns 404, not 403,** to an unauthorised caller. 403
   would confirm that a hidden listing exists at that id.
6. **`AuctionCountdown` derives the remaining span during render** rather than
   storing it, so the effect owns only the timer. This also satisfies the
   linter's `set-state-in-effect` rule, which the stored version tripped.

**Known issues carried forward:**

1. **The `/api/users/me/auctions` collision above** — the single most important
   thing to settle at the start of Sprint 07.
2. **An auction past `endsAt` disappears from the list but keeps
   `status: "active"`.** Sprint 07 owns the closing transition (FR-14.1), which
   flips it to `ended` and names a winner. Until then the public list filters on
   `endsAt` so nothing expired is shown.
3. **`cancelled` is unreachable for auctions** — no requirement sets it yet.
4. **No pagination on `GET /api/auctions`**, as with tenders.
5. **The Atlas URI still names no database** — data lands in `test`.
6. **No token expiry** (L-1), **local disk uploads** (L-4).
7. **Sprint 00 known issues 4 and 5 still stand.**
8. **Verification data was cleaned up.** All auctions were removed, including
   the ones seeded for browser testing. The `demo-*` accounts, their four
   tenders and one proposal were left in place for manual testing.

**Postman collection updated:** yes — a 10-request "Sprint 06" folder covering
creation (organization, admin, pending organization 403, invalid values 400),
public browsing and detail with **no token**, the pending-detail 404, my
listings, the admin queue, and approval. The collection now holds 76 requests
across seven folders. The equivalent HTTP calls were all executed and passed;
the requests were not clicked through the Postman GUI.

---

## Sprint 07 — Bidding & Closing — completed 2026-08-20

**All 14 acceptance criteria verified.** 22/22 automated API checks passed, plus
browser verification of live polling between two viewers, cleanup on navigation,
and the full winner journey. Sprints 01-06 were re-run: 17/17, 20/20, 30/30,
27/27, 24/24, 29/29. **169 checks green in total.**

**Requirements delivered:** FR-13.1 … FR-13.4, FR-14.1 … FR-14.5, C-10, NFR-P2,
NFR-R3, NFR-U2, NFR-U4.

**Endpoints added / changed:**

| Method | Path | Auth | Role | Notes |
|---|---|---|---|---|
| POST | `/api/auctions/:id/bid` | Yes | Individual | 200 `{ auction }`, 400/401/403/404 |
| GET | `/api/users/me/auctions` | Yes | **Individual** | **Redefined** — now the bidding history with outcomes (FR-14.4) |
| GET | `/api/auctions?mine=true` | Yes | Any | Where an organization's own listings moved |
| GET | `/api/auctions/:id` | No | — | Now returns `{ auction, bids }` and closes a finished auction on read |

**Screens added:** `/my-auctions` (the individual's history table) and
`/auctions/:id/payment` (the simulated confirmation). `/auctions/:id` gained
polling, the bid form, live bid history and the winner notice. The individual
dashboard gained links to both.

**Modules added:** `models/bidHistory.model.js`, `config/auctionState.js`;
client `components/BidSection.jsx`, `BidHistoryList.jsx`, and two pages.

**The endpoint collision, now resolved.** Sprint 06 shipped
`GET /api/users/me/auctions` with its sprint-06 meaning — the caller's own
listings — at the owner's explicit direction, over the SRS. Sprint 07 requires
that path for FR-14.4, and sprint-07 agrees with SRS §4.2, so there was no
contradiction left to escalate: the path now returns the individual's bidding
history with outcomes, restricted to `individual`. The organization listing moved
to `GET /api/auctions?mine=true`, matching the `?mine=true` pattern used for
tenders since Sprint 03. Nothing was lost — verified from both sides — and the
Sprint 06 regression fixture was updated to follow the move.

**Verification evidence.** A bid above the current price was accepted and moved
the price; a bid **equal** to it was refused with the Arabic
"يجب أن تكون مزايدتك أعلى من السعر الحالي." — strictly greater, as FR-13.2
requires — as was a bid below. An organization and an admin were both refused
with 403, an anonymous bid with 401, a bid on a `pending_approval` auction and on
one past its deadline with 400 each. After four rejected attempts, `BidHistory`
held exactly **one** row: only successful bids are recorded.

**The race condition:** six simultaneous identical bids on one auction produced
exactly **one** acceptance and **one** history row. A read-then-write check would
have let several through.

**Lazy closing (FR-14.1):** an auction's `endsAt` was pushed into the past
directly in the database with nothing scheduled running. It still read `active`
until the next request; that request returned `ended` and persisted it. The
winner was the holder of the highest bid, and an auction with **zero** bids
closed cleanly with no winner and no error. All four outcomes were confirmed
through `/api/users/me/auctions`: `winning`, `outbid`, `won`, `lost`.

In the browser at 360px:

- **Two viewers.** One tab watched an auction **logged out**, showing the
  sign-in prompt rather than a broken form. A bid placed out-of-band appeared in
  the watching tab **3.87 seconds** later — inside the 3-5s band of NFR-P2 —
  along with the new history row and bidder name.
- **Polling cleanup**, the failure mode the sprint calls the most common bug in
  the project: instrumenting `XMLHttpRequest` showed **2 polls in 9 seconds**
  (~4.5s apart) while on the page, and **0 in 9 seconds** after navigating away.
  The interval is genuinely cleared.
- **Submit disabled in flight:** a MutationObserver recorded the exact sequence
  `disabled → aria-busy=true → enabled → aria-busy=null`. A plain sample missed
  it because the local API answers in under 40ms.
- A too-low bid showed the specific Arabic message and kept the typed amount.
- **The winner journey:** after the deadline passed, the page showed the `منتهي`
  stamp, "انتهى المزاد" instead of a negative countdown, the congratulations
  notice with the winning amount, and no bid form. Polling had stopped. The
  payment screen led with its simulation warning, and after confirming still said
  "لم يُخصم أي مبلغ، ولم تُنفَّذ أي عملية دفع فعلية." `/my-auctions` then read
  **"فزت بالمزاد"** with a link back to payment.

**Deviations from the sprint file:**

1. **`resolveAuctionState` lives in `config/auctionState.js`.** The sprint offers
   "functions/ or config/"; the server has no `functions/` directory — that is a
   client folder in `AGENTS.md` §3 — so `config/` it is.
2. **Closing uses an atomic `updateOne`, not `document.save()`.** A save would
   run the schema's future-date validator against an `endsAt` that is by
   definition now in the past, and every close would fail validation. The atomic
   form also means two concurrent readers cannot both close the same auction.
3. **The `endsAt` validator was scoped to creation and explicit edits.** Same
   root cause: a rule about when an auction may be *created* must not block
   operations on one that is already running.
4. **`listActiveAuctions` now resolves each candidate before filtering** rather
   than querying `endsAt > now`. FR-14.1 says a finished auction is closed by the
   next read; the previous query hid them without ever closing them.
5. **`/auctions/:id/payment` is a new route.** FR-14.5 requires the simulated
   confirmation and SRS §4.1 lists no path for it. Gated to the winning
   individual; anyone else gets an Arabic explanation rather than the screen.
6. **The winner is derived, not stored.** SRS §5.4 has no winner field:
   `status === "ended"` plus `currentHighestBidder` is the answer, which is
   exactly what NFR-R3 asks for — computed from `endsAt` and stored bid data, not
   cached at listing time.

**Known issues carried forward:**

1. **The auction-win email is not wired** — Sprint 08 (FR-14.3 in-app notice is
   done). Unlike the other four notifications there is no `TODO(sprint-08)` in
   the server for this one, because closing happens inside
   `resolveAuctionState` on a read path that may run for any visitor. Sprint 08
   should decide where the win notice is triggered from — most likely the
   client, when the winner first sees the ended auction.
2. **A closed auction is resolved by whoever reads it first**, which may be an
   anonymous visitor. Harmless today, but it means the closing moment is not
   attributable to anyone. An audit trail is out of scope (L-5).
3. **`/my-auctions` loads every auction the caller has bid on, one query each.**
   Fine at MVP volumes; an aggregation would be the fix if history grows.
4. **No pagination** on auctions, tenders, or bid history.
5. **The Atlas URI still names no database** — data lands in `test`.
6. **No token expiry** (L-1), **local disk uploads** (L-4).
7. **Sprint 00 known issues 4 and 5 still stand.**
8. **Verification data was cleaned up** — all auctions and bid history removed.
   The `demo-*` accounts, four tenders and one proposal remain for manual
   testing.

**Postman collection updated:** yes — an 8-request "Sprint 07" folder covering
bidding (accepted, equal, below, wrong role, closed auction), the polled detail
endpoint, the individual history, and the moved organization listing. The
collection now holds 84 requests across eight folders. The equivalent HTTP calls
were all executed and passed; the requests were not clicked through the Postman
GUI.

---

## Sprint 08 — Notifications & Hardening — completed 2026-08-21

**The MVP is complete.** All 8 acceptance criteria verified. **211 checks green:**
169 across the Sprint 01-07 regression, 22 in the Part B/D security and cleanup
audit, and 20 in the Part C accessibility audit. Part E traceability is walked
and recorded below.

**Requirements delivered:** FR-16.1, FR-16.2, FR-16.3, C-8, NFR-R2, NFR-S4,
NFR-S5, NFR-S8, NFR-U1 … NFR-U6, NFR-P1 … NFR-P4, NFR-M4, NFR-M5.

**Modules added:** `client/src/functions/sendEmail.js` (the single EmailJS
importer), `server/config/rateLimit.config.js`.

---

### Part A — the five notifications

| Trigger | Fired from | Recipient |
|---|---|---|
| Organization approved | `AdminDashboardPage` | the organization |
| Organization rejected | `AdminDashboardPage` | the organization |
| Proposal accepted | `TenderProposalsPage` | the submitting organization |
| Proposal rejected | `TenderProposalsPage` | the submitting organization |
| Auction won | `BidSection` | the winning individual |

All five route through `sendNotification` in `client/src/functions/sendEmail.js`.
**C-8 verified: `@emailjs/browser` is imported in exactly one file.** Config comes
only from `import.meta.env.VITE_EMAILJS_*`; no key is hard-coded (NFR-S4).

**The auction-win trigger resolves the question Sprint 07 left open.** An auction
closes inside `resolveAuctionState`, on a read any anonymous visitor might make,
so no server-side moment belongs to the winner. It fires client-side the first
time the winner sees the ended auction, with a `localStorage` marker so the
four-second poll does not re-send it.

**NFR-R2, the criterion that matters most, verified end to end with genuinely
broken credentials.** `client/.env` was set to `service_deliberately_wrong` /
`template_deliberately_wrong` / `key_deliberately_wrong`, and EmailJS really did
fail — the console recorded *"The Public Key is invalid"* on each attempt.
Despite that:

- **Approval:** the organization went `pending` → `approved`, persisted; its next
  login reported `approved`; and it successfully published a tender afterwards.
- **Proposal decision:** the stamp went `مُقدَّم` → `مقبول` and the database
  confirmed `accepted`.
- **Neither showed a user-facing error.** A failed notice is invisible to the
  person taking the action, because the action succeeded.

Order of operations is enforced structurally: no `notify*` call is `await`ed into
a success path, so a slow send cannot stall the UI, and the helper contains no
`throw` inside any `catch`, so a failed send cannot reach the caller.

### Part B — security hardening (13/13)

- **helmet** mounted before the routes; `nosniff` and a CSP present on every response
- **Rate limiting** added: global, plus tighter limits on login/register and on
  bidding. **429 demonstrated live** with production-shaped limits — statuses ran
  `400, 400, 400, 400, 400, 429, 429, 429`, refused after exactly 5 attempts with
  an Arabic message, while `GET /api/health` stayed 200 throughout
- **CORS** names exactly one origin from `CLIENT_ORIGIN`, never a wildcard
- **Secrets:** no secret appears in any of the 99 tracked files; both `.env`
  gitignored, both `.env.example` tracked with no real values
- **Logs:** no server log statement writes a request body or a password value
- **Uploads:** MIME spoofing rejected on all three flows — proof document,
  proposal document and auction image — and an oversized file returns 400
- **Passwords:** none of eight read endpoints returns a `password` field or a hash
- **Roles:** no controller trusts a body role; `role: "admin"` at registration
  still creates nothing
- **Errors:** all five sampled failures return JSON with Arabic text and no stack

### Part C — UX and accessibility audit (20/20)

Walked across all 45 components and pages. Four render states on every data
screen; every rendered string Arabic with no status codes; field errors wired
with `aria-invalid`/`aria-describedby`/`role="alert"`; no `catch` clears form
state; every destructive action confirms first; status never by colour alone (15
labelled statuses with icons); **zero physical direction utilities**; every email
and numeric input `dir="ltr"`; 18 files isolate interpolated values in `<bdi>`;
10 files rendering figures use `tabular-nums`; focus rings on every raw control
plus a global `:focus-visible`; no clickable `div`; every `img` has `alt`; no
index keys; no hex literals; both `setInterval` callers clear their timer; no
component imports axios directly.

**Four checks failed on the first pass and all four were faults in my checker,
each confirmed by inspection, not assumption:** it required an empty state on
single-record pages (a missing record is a 404, rendered as the error state);
flagged the dev smoke page's `variant="danger"` swatch as an unconfirmed
destructive action; flagged a component that carries `finalPrice` in state
without rendering it; and flagged files for missing a focus ring when they render
the shared `Button`/`FormField`, which carry it themselves.

### Part D — performance and cleanup (4/4)

- Non-AI reads: slowest of five sampled endpoints was **487ms**, well inside
  NFR-P1's two seconds
- Auction polling measured at ~4s and **stops on unmount** (Sprint 07: 2 polls in
  9s on the page, 0 in 9s after navigating away)
- The Sprint 01 `/api/admin/ping` probe is gone — 404
- **All `TODO(sprint-08)` markers resolved**, replaced with notes naming the
  client function that now sends each notice
- **`/dev/rtl` excluded from the production build** — neither the route string nor
  the page's own content appears in the bundle, while it still works in `npm run
  dev`. The landing-page link to it is gated the same way.

### Part E — SRS §8 traceability

| Requirement | Verified by | Status |
|---|---|---|
| FR-1.1, FR-1.2 | Sprint 01 checks 3, 4 — duplicate email and 3-char password both 400 with Arabic field messages | ✅ |
| FR-1.4, NFR-S1 | Sprint 01 check 5 — stored value is a `$2b$10$` hash that `bcrypt.compare` accepts | ✅ |
| FR-1.5, FR-3.4 | Sprint 01 check 1 + browser: pending organization logs in, sees the review notice, has no tender control | ✅ |
| FR-4.2, FR-4.4 | Sprint 02 check 6 (status flips) + Sprint 08 Part A (EmailJS call fires) | ✅ |
| FR-5.1, FR-5.3 | Sprint 01 check 8 — no token 401, wrong role 403, demonstrably different paths | ✅ |
| FR-5.4 | Sprint 01 check 12b + Sprint 08 B8b — `role: "admin"` creates nothing | ✅ |
| FR-6.3 | Sprint 03 check 2 — pending organization creating a tender gets 403 | ✅ |
| FR-9.2, FR-9.3 | Sprint 04 checks 2, 3, 4 — self-bid 403, duplicate 400, and blocked by the unique index with the controller bypassed | ✅ |
| FR-10.2, FR-10.4 | Sprint 05 checks 1, 4 — real extraction of 47500 with confidence; invalid key still allows manual submission | ✅ |
| FR-11.2, FR-11.3 | Sprint 05 check 11 + Sprint 08 Part A — decision persists, notice fires | ✅ |
| FR-12.2, FR-12.3 | Sprint 06 checks 4, 7 — pending never in the public body; approval publishes it | ✅ |
| FR-13.2 | Sprint 07 checks 2, 3 — equal and below both 400, strictly greater enforced | ✅ |
| FR-13.3, FR-13.4 | Sprint 07 checks 1, 9 + browser — a second viewer saw the new price **3.87s** after the bid | ✅ |
| FR-14.2, FR-14.3 | Sprint 07 checks 10, 11 — winner determined lazily with no scheduler; in-app notice shown | ✅ |
| DATA-1, DATA-2 | Sprint 03 check 4c, Sprint 04 check 4b — rejected create and rejected update both write nothing | ✅ |
| NFR-R1 | Sprint 05 check 4 — invalid `GEMINI_API_KEY`, proposal still submitted at a manual price | ✅ |
| NFR-R2 | Sprint 08 Part A — invalid EmailJS credentials, approval and acceptance both stand | ✅ |

**Every row in SRS §8 is demonstrated.** The one qualification is on FR-4.4 and
FR-11.3: what is proven is that the EmailJS call is *made* with the right
recipient and that failure is harmless. **Actual delivery has never been observed,
because no real EmailJS account is configured** — see known issues.

---

**Deviations from the sprint file:**

1. **Rate limits are environment-configurable** (`RATE_LIMIT_MAX`,
   `AUTH_RATE_LIMIT_MAX`, `BID_RATE_LIMIT_MAX`, plus windows), defaulting to the
   production intent of 300/15min global, 10/15min auth, 30/min bids. Without
   this a development machine running the regression suites locks itself out
   after ten logins. `.env.example` documents them with empty values; the local
   `.env` raises them. NFR-M2 covers externalising exactly this kind of value.
2. **`/dev/rtl` is excluded from the production build rather than deleted.**
   Sprint 00 says keep it for the life of the project; sprint-08 offers "removed
   **or** excluded". Excluded satisfies both.
3. **The submitter's email is exposed to the tender owner.** `listProposalsForTender`
   now populates `submittedBy` with `companyName` **and** `email`. This is forced
   by C-8: EmailJS sends from the browser, so the address must reach the sender's
   client. Nothing else about the submitter was added. Worth noting as a
   consequence of the client-side email architecture, not a choice.
4. **No `TODO(sprint-08)` was ever placed for the auction win** (Sprint 07
   deviation 1), because closing happens on an anonymous read path. Resolved in
   Part A above.

**Known issues carried forward:**

1. **No email has ever actually been delivered.** The owner has no EmailJS
   account configured; `client/.env` currently holds deliberately-invalid
   credentials from the NFR-R2 test. **To send for real:** create an EmailJS
   service and template whose variables are `to_email`, `to_name`, `subject`,
   `message`, then put the real service ID, template ID and public key in
   `client/.env`. Until then `isEmailConfigured()` short-circuits and logs a
   skip. Everything else works regardless — that is NFR-R2 by design.
2. **One EmailJS template serves all five notifications**, varying by `subject`
   and `message`. `AGENTS.md` and `SPRINT_PLAN.md` §6 specify a single
   `VITE_EMAILJS_TEMPLATE_ID`, so this matches the configured shape. Five
   separate templates would need five env keys.
3. **Rate limiting is in-memory and per-process** — L-3 acknowledges this. It
   resets on restart and would not hold across multiple instances.
4. **The local `.env` carries relaxed rate limits** (5000/500/300) so the test
   suites can run. Clear those three lines before any real deployment to fall
   back to the production defaults.
5. **The Atlas URI still names no database** — data lands in `test` beside an
   unrelated `jokes` collection. Adding `/procurement_platform` before the `?`
   fixes it. Unchanged since Sprint 01.
6. **Atlas Network Access is IP-bound.** The cluster refused all connections
   mid-sprint when the owner's IP changed overnight, which halted verification
   until it was allowlisted again. Worth knowing before a live defense.
7. **No token expiry** (L-1), **local disk uploads** (L-4), **no audit trail**
   (L-5), **simulated payment only** (L-7), **polling not push** (L-8),
   **single currency** (L-9).
8. **Sprint 00 known issues 4 and 5 still stand** (`express-rate-limit` is now
   wired, closing issue 4's other half; Vite template leftovers remain).
9. **Verification data was cleaned up.** The database holds the seeded admin, the
   owner's own `aws@gmail.com`, and the `demo-*` accounts with their 4 tenders,
   1 proposal and 6 auctions, left deliberately for manual testing.

**Postman collection updated:** yes — a "Sprint 08" folder documenting the rate
limit behaviour and the notification architecture. The collection holds 87
requests across nine folders. Sprint 08 adds no new endpoints; its changes are
middleware and client-side.

---

## Sprint 09 — Negotiation & Contract Draft *(stretch)* — completed 2026-08-21

**All 11 acceptance criteria verified.** 26/26 automated API checks passed, plus
browser verification of both participants, the contract draft, the access
refusals and the polling cleanup. Everything before it was re-run: **237 checks
green** — 169 across Sprints 01-07, 22 in the Sprint 08 security audit, 20 in the
accessibility audit, and 26 here.

**Requirements delivered:** FR-15.1, FR-15.2, FR-15.3.

**Entry conditions checked before any code was written**, as the sprint file
demands: every Sprint 00-08 criterion passing, the Sprint 08 audit recorded in
this file, and no known bug carried forward — the outstanding items are accepted
limitations and configuration notes, not defects.

**Endpoints added:**

| Method | Path | Auth | Role | Success | Failure |
|---|---|---|---|---|---|
| GET | `/api/proposals/:id/messages` | Yes | Participants or admin | 200 `{ messages, thread }` | 400, 401, 403, 404 |
| POST | `/api/proposals/:id/messages` | Yes | Participants only | 200 `{ message }` | 400, 401, 403, 404 |
| POST | `/api/proposals/:id/contract-draft` | Yes | Tender owner | 200 `{ contractDraft }` | 400, 401, 403, 404, 502 |
| GET | `/api/proposals` | Yes | Approved organization | 200 `{ proposals }` | 401, 403 |

**Screens added:** `/proposals/:id/negotiation`. The organization dashboard
gained a **عروضي المقدَّمة** section, and the proposal review card gained a
thread link on an accepted proposal.

**Modules added:** `models/negotiationMessage.model.js`,
`controllers/negotiation.controller.js`, `routes/negotiation.routes.js`,
`generateContractDraft` + `requestContractDraft` inside the existing
`ai.controller.js`; client `components/MessageThread.jsx`,
`ContractDraftPanel.jsx`, `MyProposalsList.jsx`, `pages/NegotiationPage.jsx`.

**Verification evidence.** A thread refused to open on a `submitted` proposal —
400 with "لا تُفتح غرفة التفاوض إلا بعد قبول العرض." — and opened the moment the
proposal was accepted. Both participants posted and read the same two messages,
ordered oldest first with sender and timestamp, and the payload carried no
password field. **A third organization was refused 403 on both read and post,
and the refusal body contained none of the thread's content**; an individual got
403 and an anonymous caller 401. An admin read the thread but was refused
posting, with `canPost: false` in the payload. An empty message returned 400 with
a field-level Arabic error, and a malformed id returned 404 rather than 500.

On the contract draft: only the tender owner may request one — the submitter and
a third organization both got 403 — and a draft on a never-accepted proposal
returned 400. A real generation produced **958 characters of Arabic prose naming
the actual parties and the accepted value**, persisted on the proposal and
returned as plain editable text. With the key cleared, generation failed as a
**502 carrying a contract-specific Arabic message**, and the thread kept working
immediately afterwards. `@google/generative-ai` is **still imported in exactly
one file**.

In the browser at 360px: the room rendered with its data rail, the empty-thread
message and the composer. **The non-binding notice was visible before any draft
existed** — it is permanent, not attached to the draft. The owner posted a
message, generated a draft (674 characters, opening "عقد توريد … الطرف الأول:
شركة البناء الحديثة"), and the notice stayed visible above it. Switching to the
submitting organization: the dashboard showed **عروضي المقدَّمة** with the
`مقبول` stamp and a thread link; following it showed the owner's message, an
enabled composer, the draft — and **no generate button**, since that belongs to
the owner alone. An unrelated individual navigating straight to the URL got the
Arabic permission message with **no message text, no draft, and no status code**.
Polling ran at ~4.5s in the room and **0 polls in 9 seconds after leaving**.

**Deviations from the sprint file:**

1. **`GET /api/proposals` added** for the submitting organization's own
   proposals. Not in SRS §4.2, but SRS §4.1 describes the organization dashboard
   as "My tenders, my proposals", and FR-15.1 is unusable without it: the
   submitter had no way to reach an accepted proposal. This closes the gap
   flagged since Sprint 04. It is declared **before** `/proposals/:id` so the
   literal path is never read as an id.
2. **An admin may read a thread but never post.** The sprint says "an admin may
   read but should not post"; that is enforced, not merely advised — `canPost`
   is false in the payload and a POST returns 403.
3. **The contract draft has its own Arabic failure message.** `aiUnavailable`
   previously carried the document-analysis wording, which would have told a
   user to "enter the data manually" when a *contract* failed to generate.
   Failures now report the operation that actually failed.
4. **Polling rather than a refresh button.** The sprint offers either; reusing
   the Sprint 07 pattern at the same 4000ms keeps one polling idiom in the
   codebase, and it clears on unmount.
5. **`contractDraft` stored on the proposal**, as the sprint suggests, rather
   than a second collection.

**Known issues carried forward:**

1. **The draft is generated fresh each time and overwrites the stored one.**
   Editing it in the textarea is local to the page — there is no endpoint to
   save an edited draft, because FR-15.2 asks for a *draft* and FR-15.3 makes
   clear the binding artefact lives outside the system. Copy the text out before
   regenerating.
2. **Gemini still returns transient 503s under load.** The draft path degrades
   the same way the analysis path does: an Arabic notice, and the thread stays
   usable. Retrying usually succeeds.
3. **No unread indicator or notification on a new message.** FR-15.1 asks for a
   simple thread; the sprint file explicitly warns against building a chat
   product. A participant sees new messages within one 4-second poll while the
   room is open.
4. **No email on a negotiation message.** FR-16.1 lists exactly five triggers and
   this is not one of them.
5. **The local `.env` still carries relaxed rate limits** (5000/500/300) so the
   suites can run — clear those three lines before deploying.
6. **EmailJS credentials in `client/.env` are still the deliberately-invalid
   ones** from the Sprint 08 NFR-R2 test. Replace them to send real mail.
7. **The Atlas URI still names no database** — data lands in `test`. Atlas
   Network Access is also IP-bound and blocked all work for part of this sprint
   when the owner's address changed overnight.
8. **No token expiry** (L-1), **local disk uploads** (L-4), **no audit trail**
   (L-5), **simulated payment** (L-7), **polling not push** (L-8), **single
   currency** (L-9).
9. **Verification data was cleaned up.** The `demo-*` accounts keep their 4
   tenders, 6 auctions and 1 proposal — now **accepted**, with a generated
   contract draft, so the negotiation room is reachable for manual testing.

**Postman collection updated:** yes — a 6-request "Sprint 09" folder covering the
thread (open, post, third-party 403, admin read-only), the contract draft (owner
only, 502 on failure) and the submitter's proposal list. The collection holds 94
requests across ten folders.

---

## Project status — all ten sprints complete

| Sprint | Checks | |
|---|---|---|
| 00 Foundation & Shell | 9 acceptance criteria | ✅ |
| 01 Identity & Access | 17 | ✅ |
| 02 Admin Organization Review | 20 | ✅ |
| 03 Tenders | 30 | ✅ |
| 04 Proposals | 27 | ✅ |
| 05 AI Analysis & Decisions | 24 | ✅ |
| 06 Auctions | 29 | ✅ |
| 07 Bidding & Closing | 22 | ✅ |
| 08 Notifications & Hardening | 22 audit + 20 accessibility | ✅ |
| 09 Negotiation & Contract *(stretch)* | 26 | ✅ |

**237 automated checks, all passing.** Every SRS §8 traceability row is
demonstrated (recorded in the Sprint 08 entry). The two qualifications on record:
no email has ever actually been delivered, because no EmailJS account is
configured; and the "no flash of the login page" half of Sprint 01's criterion 10
is verified structurally rather than by high-frequency sampling.
