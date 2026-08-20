# /information

Everything the build depends on. This folder sits at the project root, beside `client/` and `server/`.

## For the coding agent

**Read every document in this folder before starting any sprint.** Each sprint file repeats this instruction at the top, with the reading order. Do not begin a sprint from its own file alone.

Start at **`SPRINT_PLAN.md`**, then open the sprint you are on in `sprints/`.

## Contents

| File | What it is | Authority |
|---|---|---|
| `SPRINT_PLAN.md` | Sprint sequence, dependencies, Definition of Done, global conventions | Plan |
| `sprints/sprint-NN-*.md` | One file per sprint: scope, tasks, endpoints, acceptance criteria, failure modes | Plan |
| `procurement-platform-srs.md` | **The contract.** Requirement IDs (FR-*, NFR-*, DATA-*, C-*, L-*) | **Highest** |
| `AGENTS.md` | Build commands, stack versions, folder structure, conventions | High |
| `design.md` | Colour tokens, typography, spacing, motifs, screen inventory | High |
| `requirements.md` | Arabic requirements list and per-phase Definition of Done | High |
| `skills/react-component/SKILL.md` | How every React component must be written, including all RTL rules | High |
| `PalTenders_Full-Stack_Build_Specification.md` | **Reference only** — visual language, nothing else | Reference |

## Precedence

SRS → AGENTS.md → design.md → SKILL.md → sprint files.

**If a sprint file contradicts the SRS, stop and report it.** The sprint files were derived from the SRS; a conflict is a bug in the plan, not a decision to make silently.

## PalTenders

Visual language only. Do not carry over its tech stack, route map, page inventory, asset files, or copy — `design.md` says so explicitly at the top.

## Keeping this current

If a requirement changes, change it in the **SRS first**, then propagate to the affected sprint files. Never let a sprint file become the only place a decision is recorded.

Progress goes in `PROGRESS.md` at the project root — not here. This folder is inputs; that file is history.
