# Sprint Plan — Procurement & Auction Platform (MVP)

**20 sprints total to build a complete MVP from backend to frontend.**

Sprints are organized sequentially to build the backend first (models, controllers, routes), followed by the frontend structure, components, and finally the pages and theme. Each sprint ends with a testable milestone.

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
    ├── theme-colors.md             ← Theme definition
    ├── PalTenders_Full-Stack_Build_Specification.md  ← reference only
    ├── skills/
    │   └── react-component/SKILL.md
    └── sprints/
        ├── sprint-00-foundation.md
        ├── sprint-01-server-config.md
        ├── sprint-02-server-models.md
        ├── sprint-03-server-auth-users.md
        ├── sprint-04-server-tenders-proposals.md
        ├── sprint-05-server-auctions.md
        ├── sprint-06-server-chat-notifications.md
        ├── sprint-07-client-foundation.md
        ├── sprint-08-client-routing-context.md
        ├── sprint-09-client-ui-components.md
        ├── sprint-10-client-auth-pages.md
        ├── sprint-11-client-admin-dashboard.md
        ├── sprint-12-client-org-dashboard.md
        ├── sprint-13-client-tenders.md
        ├── sprint-14-client-auctions.md
        ├── sprint-15-client-chat-negotiation.md
        ├── sprint-16-client-theme-darkmode.md
        ├── sprint-17-client-email-notifications.md
        ├── sprint-18-ai-integration.md
        ├── sprint-19-testing-hardening.md
        └── sprint-20-final-polish.md
```

**Every sprint begins by reading every document in `/information`.** Each sprint file repeats this instruction at the top. Do not start a sprint from its own file alone.

---

## 2. Precedence when documents disagree

1. `procurement-platform-srs.md` — the contract. Requirement IDs are authoritative.
2. `AGENTS.md` — how it must be built.
3. `design.md` & `theme-colors.md` — how it must look.
4. `skills/react-component/SKILL.md` — how components must be written.
5. Sprint files — the plan for getting there.

If a sprint file contradicts the SRS, **stop and report it** rather than guessing.

---

## 3. Sprint sequence

| # | Sprint | Focus Area | Demo at the end |
|---|---|---|---|
| 00 | Foundation | Project Init | Both apps boot, DB connects, RTL shell renders |
| 01 | Server Config | Backend Core | Express, DB connection, Multer, Error handling |
| 02 | Server Models | Database | Mongoose schemas for User, Tender, Auction, Chat |
| 03 | Server Auth | API | Registration, Login, Email Verification APIs |
| 04 | Server Tenders | API | CRUD Tenders, AI extraction, Proposals |
| 05 | Server Auctions | API | CRUD Auctions, Bidding logic |
| 06 | Server Chat | API | Socket.io rooms, Notifications |
| 07 | Client Foundation | Frontend Core | Vite setup, Tailwind v4, Axios |
| 08 | Client Routing | Frontend Nav | React Router, Protected Routes, AuthContext |
| 09 | Client Components | UI | Buttons, Inputs, Cards, Badges, Modals |
| 10 | Client Auth | Pages | Login, Register (Org/Ind), Verification |
| 11 | Client Admin | Pages | Admin Dashboard, User Approval |
| 12 | Client Org | Pages | Org Dashboard, Profile |
| 13 | Client Tenders | Pages | Tender List, Detail, Create, Proposal |
| 14 | Client Auctions | Pages | Auction List, Detail, Create, Bidding |
| 15 | Client Chat | Pages | Negotiation UI, Real-time messages |
| 16 | Client Theme | Styling | Dark Mode, Logo, Responsive Layout |
| 17 | Email Integration | Notifications | EmailJS templates for Auth and Alerts |
| 18 | AI Integration | Features | Gemini document parsing and validation |
| 19 | Testing & Polish | QA | Bug fixes, alignment, responsiveness |
| 20 | Final Delivery | Launch | Production build, documentation |

---

## 4. Definition of Done — applies to every sprint

Taken from `requirements.md` §4. A sprint is not finished until all five hold:

1. **Every functional requirement listed in the sprint actually works.**
2. **Every endpoint tested manually** (or via UI).
3. **Expected failures return the correct status code**.
4. **The frontend is wired to the real API.** No mock data.
5. **The four render states exist on every data screen**: loading, error, empty, and data.
6. **RTL check**: logical utilities only (`ps-`, `pe-`, `ms-`, `me-`).
7. **Arabic check**: every user-facing string is Arabic.
8. **Mobile check**: no horizontal scroll at 360px.

---

## 5. Progress tracking

Keep a `PROGRESS.md` at the project root. After each sprint, append completion details.
