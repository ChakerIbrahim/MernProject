# Sprint 00 — Foundation & Shell

**Goal:** both applications boot, connect, and render an RTL Arabic shell using the real design tokens. No features. This sprint exists so that every later sprint starts from a correct baseline instead of fighting setup.

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

C-1…C-6 (stack and structure), NFR-M1, NFR-M2, NFR-PO1, UI-1, UI-3, and the RTL foundation the whole product depends on.

## In scope

- Repository structure exactly as `AGENTS.md` §3 specifies
- Server boots, connects to MongoDB, serves a health endpoint
- Client boots on port 5173, routes without page reload
- Tailwind 4 configured with the `design.md` colour tokens
- `dir="rtl" lang="ar"` document shell, Arabic fonts loaded
- Shared UI primitives every later sprint will reuse
- Global error middleware and the `.env` skeleton

## Out of scope

Any model beyond `User`, any authentication logic, any page with real data. Those are Sprint 01.

---

## Backend tasks

1. **Scaffold** using the exact commands in `AGENTS.md` §1. Folder layout must match §3 exactly — `config/`, `controllers/`, `models/`, `routes/`, `server.js`.
2. **`config/mongoose.config.js`** — connect from `process.env.MONGOOSE_URI`. Log the full error object on failure, not a fixed string; a bare "connection failed" message wastes hours later.
3. **`server.js`** — `express.json()`, `express.urlencoded({ extended: true })`, `helmet()`, `cors({ credentials: true, origin: process.env.CLIENT_ORIGIN })`, then routes, then the global error middleware **last**.
4. **Global error middleware** (NFR-M5) — one `app.use((err, req, res, next) => {...})` that maps thrown errors to the standard shape. Mongoose `ValidationError` → 400 with a per-field map. Everything unrecognised → 500 with a generic Arabic message; never leak a stack trace to the client.
5. **`/api/health`** → `{ message: "backend is healthy" }`. This is the first thing to check in every later sprint before debugging anything else.
6. **`.env`** with `PORT=8000`, `MONGOOSE_URI`, `SECRET`, `CLIENT_ORIGIN=http://localhost:5173`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `GEMINI_API_KEY`. Commit a `.env.example` with empty values; gitignore the real one.
7. **`.gitignore`** — `node_modules/`, `.env`, `server.env`, `/uploads`.

## Frontend tasks

1. **Scaffold** per `AGENTS.md` §1. Create `src/components/`, `src/pages/`, `src/functions/`.
2. **`index.html`** — `<html dir="rtl" lang="ar">`. This is the single most important line in the client.
3. **Tailwind 4 tokens** in `src/index.css`. Resolve the config conflict here — use the CSS-first `@theme` block, not `tailwind.config.js`:

```css
@import "tailwindcss";

@theme {
  --color-registry-green: #007A3D;
  --color-green-dark: #005D2F;
  --color-flag-red: #CE1126;
  --color-ink: #17202A;
  --color-paper: #F7F8FA;
  --color-surface: #FFFFFF;
  --color-border: #E5E7EB;
  --color-text-secondary: #667085;
  --color-success: #16803C;
  --color-warning: #D97706;
  --color-error: #C62828;
}
```

4. **Fonts** — IBM Plex Sans Arabic for UI/body, Noto Kufi Arabic for display only. `font-display: swap`. Preload the Arabic subset. Do not load a Latin font; this build is Arabic-only.
5. **Routing shell** — `BrowserRouter` in `main.jsx`, `<Routes>` in `App.jsx`, one placeholder landing page at `/`.
6. **Shared primitives in `src/components/`** — build these now, because every later sprint assumes they exist:
   - `Spinner` — accepts an Arabic `label`
   - `EmptyState` — Arabic message, optional action (NFR-U5)
   - `ErrorState` — Arabic message + retry callback
   - `StatusStamp` — outlined badge, colour **plus** Arabic label, never colour alone (`design.md` §5). One component, four label sets.
   - `FormField` — label + input + `aria-invalid` + `aria-describedby` + `role="alert"` error line, per the react-component skill §6
   - `Button` — variants `primary` (registry-green), `secondary`, `danger` (flag-red)
   - `PageHeading` — carries the 3px registry-green rule (`design.md` §5)
7. **RTL smoke-test page** at `/dev/rtl` — renders every primitive above with real Arabic text, one long word in a narrow container, and one sentence containing an embedded Latin term. Keep this page for the life of the project; check it before every sprint sign-off. Mirrored Latin placeholder text will not expose these bugs.

---

## Acceptance criteria

- [ ] `npm start` in `server/` logs a successful DB connection and `server is running`
- [ ] `GET http://localhost:8000/api/health` returns the expected JSON
- [ ] `npm run dev` in `client/` serves on **port 5173** (if it lands on 5174, CORS will fail in Sprint 01 — fix it now)
- [ ] The page renders right-to-left with Arabic fonts applied
- [ ] Every colour on screen traces to a token; no hex literal appears in any component
- [ ] All seven primitives render correctly on `/dev/rtl`
- [ ] No horizontal scroll at 360px
- [ ] Throwing a test error in a route produces the standard shape from the global middleware, not a stack trace
- [ ] `.env` is gitignored; `.env.example` is committed

## Failure modes to avoid

- **Vite silently using port 5174** because 5173 is taken. Every later sprint's CORS depends on 5173. Check the printed URL.
- **Maintaining both `tailwind.config.js` and `@theme`.** Pick `@theme`. They will diverge.
- **Skipping the primitives** and inlining these patterns per-page later. Every one of them encodes an NFR; building them once is what makes the later sprints cheap.
- **Registering the error middleware before the routes.** It must be last or it never fires.
