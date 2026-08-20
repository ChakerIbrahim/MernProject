# Sprint 01 — Identity & Access

**Goal:** all three roles can register and log in, and the authorization layer that every later sprint depends on is proven to work. This is the highest-risk sprint — everything after it assumes `isAuth` and `isRole` are correct.

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

FR-1 (organization registration), FR-2 (individual registration), FR-3 (login/logout), FR-5 (role-based authorization), NFR-S1…S3, NFR-S6, NFR-S7.

## In scope

- `User` model covering all three roles with conditional fields
- Registration for Organization and Individual
- Login issuing a JWT; logout discarding it
- `isAuth` and `isRole` middleware
- Admin seed script
- Client-side route guards and role-aware redirects

## Out of scope

- The proof-document **upload** (multer) and the admin approval screens — Sprint 02. For this sprint accept `proofDocumentUrl` as a plain string so registration can be tested end to end.
- Any tender, proposal, or auction logic.

---

## Data model — `User` (SRS §5.1)

| Field | Type | Constraints |
|---|---|---|
| `name` | String | Required |
| `email` | String | Required, **unique**, lowercased |
| `password` | String | Required, min 8, hashed |
| `role` | String | Required, enum `admin` / `organization` / `individual` |
| `companyName` | String | Required **if** `role === "organization"` |
| `commercialRegisterNo` | String | Required if organization |
| `proofDocumentUrl` | String | Required if organization |
| `nationalId` | String | Required if `role === "individual"` |
| `status` | String | Enum `pending` / `approved` / `rejected`, default `approved` |

Conditional requirements use Mongoose's function form:

```js
companyName: {
  type: String,
  required: [function () { return this.role === "organization"; }, "اسم الشركة مطلوب"],
},
```

Hash in a `pre("save")` hook guarded by `isModified("password")` — otherwise every later update re-hashes the hash and locks the user out.

**New organizations get `status: "pending"` (FR-1.5); individuals get `approved` (FR-2.2).** Set this in the controller from `role`, never from the request body.

---

## Backend tasks

1. **`models/user.model.js`** — as above. Never return `password`; use `select: false` or strip it in the controller (NFR-S2).
2. **`controllers/auth.controller.js`**
   - `register` — one endpoint, branches on `role`. Reject a duplicate email with a field-level message (FR-1.1). Hash before storage (FR-1.4).
   - `login` — find by email, `await bcrypt.compare(...)`. **The `await` is mandatory**: without it the comparison returns a Promise, which is always truthy, and every password succeeds. Return an identical Arabic message for unknown email and wrong password (FR-3.2).
   - On success return `{ user, token }` **in the response body** (SRS §4.2). This project does not use cookies.
   - A `pending` organization **may log in** but the response must carry its status so the client can show the "awaiting review" message (FR-3.4).
3. **`config/jwt.config.js`** — sign `{ id, role }`. Export `isAuth` and `isRole`:

```js
const isAuth = (req, res, next) => { /* verify Bearer token → req.user → next(); else 401 */ };
const isRole = (allowed) => (req, res, next) => { /* req.user.role in allowed → next(); else 403 */ };
```

`isRole` is a **factory** returning middleware, so routes read `isAuth, isRole(["admin"])`. Read the role from the verified token or the DB record only (FR-5.4, NFR-S6).

4. **`GET /api/users/me`** — protected by `isAuth`, returns the current user. The client uses this to restore a session on reload.
5. **`config/seed.js`** — upserts the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Run manually, once per environment. **The admin is never created through the public register endpoint** (AGENTS.md).
6. **Temporary probe route** — `GET /api/admin/ping` behind `isAuth, isRole(["admin"])`, purely to prove 401 vs 403 differ. Delete it at the end of the sprint.

## Endpoints added

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | `/api/auth/register` | No | — |
| POST | `/api/auth/login` | No | — |
| GET | `/api/users/me` | Yes | Any |

## Frontend tasks

1. **`src/functions/api.js`** — one axios instance with `baseURL` from `import.meta.env.VITE_API_URL`, and an interceptor attaching `Authorization: Bearer <token>`. Every later sprint imports this. Do not call raw `axios` in a page.
2. **`src/functions/auth.js`** — `saveToken`, `getToken`, `clearToken`, `getStoredUser`. One module owns storage.
3. **`AuthContext`** — holds `user` and `token`, exposes `login`, `logout`, `isLoading`. On mount, if a token exists, call `/api/users/me` to restore the session. Until that resolves, render nothing decisive — a flash of the login page on every refresh is the classic bug here.
4. **`RequireAuth`** — redirects to `/login` when unauthenticated (FR-5.5).
5. **`RequireRole roles={[...]}`** — redirects to the user's own dashboard when the role is wrong. Never render an admin screen to a non-admin even briefly.
6. **Pages**
   - `/` landing — links to both registrations and login
   - `/register/organization` — name, email, password, companyName, commercialRegisterNo, (temporary text) proofDocumentUrl
   - `/register/individual` — name, email, password, nationalId
   - `/login`
   - Three empty role dashboards: `/admin/dashboard`, `/org/dashboard`, `/dashboard`
7. **Post-login routing** — by role: admin → `/admin/dashboard`, organization → `/org/dashboard`, individual → `/dashboard`. A `pending` organization lands on its dashboard showing an Arabic "account under review" notice and **no** tender-creation entry point (FR-3.4).
8. All forms follow the react-component skill §6: server error map into state, input preserved on failure (NFR-U2), each message tied to its field.

---

## Acceptance criteria

- [ ] Organization registers → `status: "pending"` in the database
- [ ] Individual registers → `status: "approved"`
- [ ] Duplicate email rejected with a field-level Arabic message, 400
- [ ] Password under 8 characters rejected, 400
- [ ] Stored password is a bcrypt hash; no response or log ever contains the plaintext
- [ ] Unknown email and wrong password return the **same** message
- [ ] Login returns `{ user, token }`
- [ ] `/api/users/me` with no token → **401**; with an individual's token on the admin probe → **403**. These must differ.
- [ ] A forged or tampered token → 401
- [ ] Refreshing the browser keeps the session and does not flash the login page
- [ ] A pending organization sees the review notice and cannot reach tender creation
- [ ] Admin exists via seed and cannot be created through `/api/auth/register`

## Failure modes to avoid

- **Missing `await` on `bcrypt.compare`** — every password passes. Test with a deliberately wrong password before declaring this sprint done.
- **Trusting `req.body.role`** on register to make someone an admin. Whitelist to `organization` / `individual` only.
- **Returning the password document** because `select: false` was never set.
- **Re-hashing on update** because the `pre("save")` hook lacks the `isModified` guard.
- **Conflating 401 and 403.** They are separate requirements (FR-5.1, FR-5.3) and later sprints depend on the distinction.
