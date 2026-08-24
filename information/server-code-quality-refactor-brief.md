# Server Code Quality Pass — Junior-Level Clean Code Alignment

**Goal:** the backend works and every acceptance criterion from the existing sprint files (00–09) passes. This pass does **not** add features, does **not** change behavior, and does **not** raise the architecture above what a junior MERN developer wrote and can personally explain. It only makes the existing code easier to read: better names, removed dead code, short doc comments, and small same-file extractions where a function is doing too much.

**This is maintenance, not development.** If a change would alter what the API returns, how a route behaves, or what a schema allows, it does not belong in this pass — full stop.

---

## MANDATORY — read before touching any file

| # | File | Why |
|---|---|---|
| 1 | `/information/AGENTS.md` | The stack conventions and folder structure this refactor must stay inside |
| 2 | `/information/procurement-platform-srs.md` | The authoritative, current, correct behavior — every FR/NFR here is what "don't change behavior" is measured against |
| 3 | `/information/requirements.md` | Arabic requirement list, same authority as the SRS |
| 4 | `/information/SPRINT_PLAN.md` | Global conventions |
| 5 | every file in `/information/sprints/` (00 through whichever is your current highest completed sprint) | Each sprint's **acceptance criteria** is the exact regression checklist this pass must still pass afterward, item by item |
| 6 | `/information/engineering-curriculum.md` | The clean-code/software-engineering reference this pass draws from — **see the scope table below before applying anything from it** |

If file 6 isn't saved in `/information` yet, save the curriculum document there first under that name before starting — Manus needs to read it directly, not work from memory of this brief.

---

## The one rule that overrides everything else in this document

**Zero behavior change.** Before touching a file, know what "behavior" means here so nothing crosses the line by accident:

**Counts as behavior — never change these in this pass:**
- Any route path, HTTP method, or middleware order
- Any response JSON shape, field name, or status code
- Any Mongoose schema field name, type, default value, or validation rule
- Any environment variable name
- Any business rule already documented in the SRS — the self-bid check, the duplicate-proposal unique index, the atomic conditional bid update, lazy auction closing, the AI confidence-score handling, exactly which five events trigger an email, the 401-vs-403 distinction, all of it
- Timing behavior — the 3–5s polling band, the 15–20s AI timeout, anything with a number attached to it in the SRS

**Does not count as behavior — safe to change:**
- Variable, function, and file-internal names that are unclear
- Comments and documentation
- Whitespace and formatting
- Splitting one overloaded function into two functions in the *same file*, where the sum of the two does exactly what the one did before
- Removing code that is provably unreachable or unused (see the checklist)
- Consolidating an obviously repeated literal value into one named constant

If Manus is ever unsure which side of this line something falls on, the instruction is: **don't do it, and note it instead.**

---

## Scope: which parts of the curriculum apply here

The curriculum document covers a full engineering program, most of which is out of scope for a cleanup pass on a junior developer's graduation project. Applying the wrong parts would make the code *less* defensible in a project defense, not more — the developer needs to be able to explain every line as their own.

### Apply (junior-appropriate, directly useful for this pass)

| Curriculum section | What to actually do with it |
|---|---|
| §3 Clean Code — Meaningful Naming | Rename genuinely unclear names (`data`, `temp`, `x`, `req2`, `flag`) — leave already-clear names alone |
| §3 Clean Code — Small Functions | If one function is obviously doing 2+ unrelated things, split it into two functions in the same file |
| §3 Clean Code — Avoid Magic Numbers/Strings | Replace a literal that's repeated 3+ times (e.g. `5 * 1024 * 1024`) with one named constant — not one-off values |
| §3 Clean Code — Readable Conditionals / Avoid Deep Nesting | Convert an obviously nested `if` into a guard clause where it doesn't change which branch runs |
| §3 Clean Code — Comments Explain Why | Add a short comment only where the reasoning isn't obvious from the code (example below) |
| §3 Clean Code — Dead Code Removal | Delete unused imports, unused variables, commented-out old code, leftover `console.log` debugging |
| §3 Clean Code — Consistent Formatting | Apply the project's existing formatter defaults — don't introduce a new linter/formatter config |
| §2 — DRY (narrowly) | Only for obvious literal duplication already in one file or two directly related files — not a project-wide dedup effort |
| §2 — KISS / YAGNI | The *guiding constraint* for this whole pass: simpler and smaller wins, never add an abstraction "for later" |
| §2 — Single Responsibility (narrowly) | A same-file extraction is fine (e.g. pull token-signing into a small helper in `jwt.config.js`, which already exists there); this is not license to create new architectural layers |
| §19/§8 Global Error Middleware | Confirm every controller still forwards errors the same way — document it with a comment, don't restructure it |

### Do not apply — explicitly out of scope for this pass

| Curriculum section | Why it's excluded here |
|---|---|
| §2 SOLID beyond SRP (Open/Closed, Liskov, Interface Segregation, Dependency Inversion) | Written for larger OOP systems; this is a small functional Express + Mongoose codebase — forcing these in adds abstraction the project doesn't need and the developer didn't write |
| §20 Service Layer / Data Access Layer as new folders | AGENTS.md defines `config/`, `controllers/`, `models/`, `routes/` — adding a `services/` or `repositories/` layer is an architecture change, not a cleanup, even if the curriculum recommends it for larger systems |
| §46 Design Patterns (Repository, Factory, Strategy, Adapter, Facade, Observer, DI) | None of these are referenced anywhere in AGENTS.md or the SRS. Introducing them here is scope creep dressed as clean code |
| §54 TypeScript | Not part of the project's stack (AGENTS.md specifies plain JS) |
| §10 Testing frameworks | The project currently verifies behavior via the sprint files' manual acceptance criteria — introducing Jest/Supertest is a real, separate decision for the developer to make on purpose, not something to add silently during cleanup |
| §48/§49 Docker, CI/CD | Not part of this project's scope at any point |
| §45 Background Jobs & Queues | Directly conflicts with the SRS's lazy-closing design (C-10: no scheduler) — do not introduce one while "cleaning up" |
| §39/§40 Performance/caching work | No performance problem has been reported; don't optimize what isn't measured as slow |
| Anything touching the database choice, ORM, or major dependency | Completely out of scope, no exceptions |

---

## Process — file by file, not all at once

1. **Inventory** every file under `server/` (everything in `config/`, `controllers/`, `models/`, `routes/`, plus `server.js` and `.env`-adjacent config).
2. For each file: **read the whole file first**. Understand what it currently does before changing anything — this is the only way to guarantee the "zero behavior change" rule holds.
3. Apply the per-file checklist below.
4. Commit that one file (or one tightly-related pair, e.g. a model with its single controller) before moving to the next.
5. After each file, spot-check: does the exact same request still produce the exact same response? Use the relevant sprint's acceptance criteria as the check, not a guess.

Never batch the whole server into one commit — it makes the actual changes impossible to review, and defeats the purpose of doing this carefully.

---

## The per-file checklist

- [ ] Read the entire file before editing anything
- [ ] Remove unused imports, unused variables, commented-out old code, stray `console.log`s
- [ ] Rename only genuinely unclear identifiers
- [ ] Add one short doc comment above every exported function — what it does, its parameters, what it returns, what it throws. Three to five lines. Not an essay.
- [ ] Add inline comments **only** where the "why" isn't obvious — example: `// must await bcrypt.compare — without it the comparison returns a Promise, which is always truthy`
- [ ] Replace a magic value repeated 3+ times in the file with one named constant, defined once
- [ ] If one function clearly does two unrelated jobs, split it into two functions in the same file — verify every call site still gets identical results
- [ ] Confirm formatting is consistent with the rest of the project
- [ ] Confirm the function still calls `next(err)` / returns the same status codes and response shape as before your edit

---

## Documentation & commit conventions

- Commit types: `refactor:` for code reorganization, `docs:` for comment-only changes. **Never `feat:` and never `fix:` in this pass** — this pass adds no features and fixes no bugs.
- One commit per file (or one small tightly-coupled group).
- Commit messages are specific, not vague:
  - Good: `refactor(auth.controller): extract issueToken helper, remove unused lodash import`
  - Bad: `cleanup`
- **If a suspected bug is found while reading a file, do not fix it here.** Add `// TODO(review): <what looks wrong and why>` at that exact line, and list it in a short summary handed back to the developer at the end. Fixing a bug changes behavior, and behavior changes are explicitly out of scope for this pass — the developer should decide separately, on purpose, whether and how to fix it.

---

## Final verification — required before this pass is considered done

- [ ] Server boots with no errors
- [ ] Every acceptance criterion in every sprint file (00 through the current highest sprint) is re-checked and still passes, exactly as before
- [ ] Route count, route paths, and HTTP methods are identical to before the refactor — diff the route list if unsure
- [ ] Every response shape (success and error) is byte-for-byte the same structure as before, for every endpoint touched
- [ ] A reviewer reading the diffs sees only: renames, comments, formatting, dead-code removal, and same-file function splits — nothing else
- [ ] A short summary is produced listing: files touched, one line per file on what changed, and a separate list of any `TODO(review)` items found

## Acceptance criteria

- [ ] Every file under `server/` has been read and reviewed
- [ ] Every exported function has a short doc comment
- [ ] No unused imports, unused variables, or leftover debug logs remain anywhere
- [ ] No endpoint, schema, response shape, status code, env var name, or business rule changed anywhere in the codebase
- [ ] All previously-passing sprint acceptance criteria still pass, unchanged
- [ ] All commits are small, file-scoped, and correctly typed (`refactor:`/`docs:` only)
- [ ] Any suspected bugs are flagged as `TODO(review)` comments and summarized — none silently fixed
- [ ] No new folder, architectural layer, dependency, or design pattern was introduced beyond what `AGENTS.md` already specifies
- [ ] The resulting code still reads like it was written by the same junior developer — clearer, not fancier

## Failure modes to avoid

- **Using "clean code" as cover to redesign the architecture.** A services/repository layer might be textbook-correct for a large system; it is out of scope here and makes the code harder for the developer to defend as their own.
- **Applying SOLID or Gang-of-Four pattern vocabulary wholesale.** Most of it targets systems far larger than this one — forcing it in signals "not written by a junior," which is a real problem at a graduation defense.
- **Fixing a discovered bug inside a refactor commit.** Flag it with `TODO(review)`, don't fix it silently.
- **One giant commit for the whole server.** Impossible to review, defeats the point.
- **Renaming things that were already clear**, generating diff noise without value.
- **Introducing a test framework, linter config, or formatter "while already in there."** Each of those is a real decision for the developer to make deliberately, not a side effect of a cleanup pass.
- **Treating this brief as permission to touch the frontend, the AI integration behavior, the polling interval, or anything already governed by a specific numbered sprint's acceptance criteria.** This pass is additive documentation and subtractive dead-code removal only.
