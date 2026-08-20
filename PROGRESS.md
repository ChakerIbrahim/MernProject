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
