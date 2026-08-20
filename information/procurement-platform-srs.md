# Software Requirements Specification
## Procurement & Auction Platform (MVP)

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 20 August 2026 |
| **Status** | Baseline |
| **Standard** | Based on IEEE 830 |

---

# 1. Introduction

## 1.1 Purpose

This document specifies the functional and non-functional requirements for the Procurement & Auction Platform, a web application that lets organizations publish and bid on tenders, and lets individuals bid on public auctions, with an embedded AI step that analyzes submitted proposal documents.

It is intended for the developer implementing the system, the instructor assessing it, and any future maintainer. It describes **what** the system does, not how the code is written. It reflects the reduced MVP scope agreed for a solo junior-developer graduation project, derived from a larger original platform concept.

## 1.2 Scope

The system is a full-stack MERN application serving three user classes — Admin, Organization, and Individual — through a role-based account model. Organizations publish tenders and submit proposals on each other's tenders; an AI engine (Gemini) analyzes each proposal document and surfaces extracted data with a confidence score before submission. Organizations and admins may also publish auctions that individuals bid on in near-real time. The Admin approves organization registrations and moderates published tenders and auctions.

**In scope**

- Registration and authentication for three roles: Admin, Organization, Individual
- Admin review and approval/rejection of Organization accounts
- Full create, read, update, and delete operations on tenders
- Submission of proposals against open tenders, including document upload
- AI-assisted extraction of price and summary data from an uploaded proposal document, shown with a confidence score
- Creation, admin approval, and browsing of auctions
- Near-real-time bidding on auctions via client-side polling
- Automatic determination of the auction winner at closing time
- Automated email notifications (approval/rejection, proposal decision, auction win) via EmailJS
- Server-side validation of all submitted data
- Role-based restriction of actions to the appropriate user class

**Out of scope (MVP)**

- Multi-currency support and real-time currency conversion
- Formal multi-tier pre-qualification for large organizations
- A formal, multi-stage dispute/appeal system
- A complete, immutable audit trail of every system action
- A real payment gateway (a simulated payment confirmation screen is used instead)
- Real SMS or push notifications (in-app notices and EmailJS are used instead)
- WebSockets / Socket.io (client-side polling is used instead for live bidding)
- The negotiation chat room and AI contract generation (Phase 5) — implemented only if time permits; treated as a stretch goal, not a baseline requirement

## 1.3 Definitions and Abbreviations

| Term | Meaning |
|---|---|
| **Admin** | The system-administrator role; approves organizations and moderates listings |
| **API** | Application Programming Interface — the server's HTTP endpoints |
| **Auction** | A listed asset that individuals bid on until a closing time |
| **bcrypt** | A password hashing algorithm designed to be slow, resisting brute-force attacks |
| **Confidence Score** | A 0–100 value indicating how certain the AI is about its extracted data |
| **CORS** | Cross-Origin Resource Sharing — browser rules governing requests between different origins |
| **CRUD** | Create, Read, Update, Delete |
| **Gemini** | Google's generative AI API, used here to analyze proposal documents |
| **Individual** | A natural-person account restricted to participating in auctions |
| **JWT** | JSON Web Token — a signed token carrying claims about the authenticated user |
| **MERN** | MongoDB, Express, React, Node.js |
| **Middleware** | A function running between the request arriving and the handler responding |
| **ODM** | Object Document Mapper — Mongoose, mapping JavaScript objects to MongoDB documents |
| **Organization** | A company/institution account that publishes and bids on tenders, and may list auctions |
| **Polling** | Repeated client-initiated requests at a fixed interval, used to approximate real-time updates |
| **Proposal** | A document-backed offer an Organization submits against another Organization's tender |
| **Role** | The permission class of a user account: `admin`, `organization`, or `individual` |
| **Tender** | A procurement opportunity published by an Organization for other Organizations to bid on |

## 1.4 References

| Ref | Document |
|---|---|
| R1 | IEEE Std 830-1998, Recommended Practice for Software Requirements Specifications |
| R2 | Mongoose documentation — schema validation and middleware |
| R3 | RFC 7519 — JSON Web Token |
| R4 | Google Generative AI (Gemini) API documentation |
| R5 | EmailJS documentation (`@emailjs/browser`) |
| R6 | Project scope document — *Phased Scope & User Workflows* (internal, v1) |
| R7 | Project requirements reference — *FR/NFR working list* (internal, v1) |
| R8 | `AGENTS.md` — project build conventions (internal) |

## 1.5 Document Overview

Section 2 gives the broad context, actors, and constraints. Section 3 lists the functional requirements, each with a unique identifier, grouped by the five build phases. Sections 4 and 5 specify the interfaces and data. Section 6 covers non-functional requirements. Section 7 records known limitations and deferred scope. Section 8 maps key requirements to verification steps.

---

# 2. Overall Description

## 2.1 Product Perspective

The system is self-contained and follows a three-tier architecture, with an external AI service and an external email service as supporting dependencies.

```
┌─────────────────────────┐
│   PRESENTATION TIER     │   React (Vite) single-page application
│   Browser, port 5173    │   Tailwind CSS, client-side polling for auctions
└───────────┬─────────────┘
            │  HTTP + JSON, JWT attached
            ▼
┌─────────────────────────┐        ┌──────────────────────┐
│   APPLICATION TIER      │ ─────▶ │  Gemini API (AI)      │
│   Node.js / Express     │        │  Document analysis    │
│   Role-based middleware │        └──────────────────────┘
└───────────┬─────────────┘
            │  Mongoose ODM
            ▼
┌─────────────────────────┐        ┌──────────────────────┐
│      DATA TIER          │        │  EmailJS (client-side)│
│   MongoDB                │        │  Status notifications │
│   users, tenders,        │        └──────────────────────┘
│   proposals, auctions,   │
│   bidHistory collections │
└─────────────────────────┘
```

The application and data tiers are independent processes; the API is stateless and derives the caller's identity and role from the JWT on each request rather than from server-held session state. EmailJS is invoked directly from the client and is not part of the trust boundary — see NFR-R2.

## 2.2 Product Functions

At a high level the system shall allow:

1. An Organization or Individual to register an account
2. Any registered user to log in and log out
3. An Admin to review, approve, or reject Organization registrations
4. An Organization to publish, edit, and close a tender
5. Any registered user to browse and filter open tenders
6. An Organization to submit a document-backed proposal on another Organization's tender
7. The system to analyze a submitted proposal document with AI and present extracted data with a confidence score
8. An Organization (tender owner) to accept or reject a proposal
9. An Organization or Admin to publish an auction, subject to Admin approval before it goes live
10. An Individual to browse public auctions and place bids
11. The system to close an auction automatically at its deadline and determine the winner
12. The system to send automated email notifications for key status changes

Functions 4–11 require authentication; function 5 and browsing auctions are available to any visitor, while bidding and proposing require the matching role.

## 2.3 User Characteristics

Three user classes, distinguished by the `role` field on the account:

| Class | Description | Technical knowledge assumed |
|---|---|---|
| **Admin** | Operates the platform; approves organizations, moderates tenders/auctions | Comfortable with a web dashboard; no coding knowledge required |
| **Organization** | A company or institution; publishes/bids on tenders, may list auctions | None beyond ordinary web/mobile browser use |
| **Individual** | A natural person; participates only in auctions | None beyond ordinary web/mobile browser use |

There is no privilege hierarchy within a class — all Organizations have identical capabilities relative to each other, and likewise for all Individuals.

## 2.4 Operating Environment

| Component | Requirement |
|---|---|
| Client | Any modern browser (latest two versions of Chrome/Firefox) with JavaScript enabled; responsive layout targeting mobile-first use |
| Server runtime | Node.js 18 or later |
| Database | MongoDB 6 or later, local or MongoDB Atlas |
| AI service | Network access to the Gemini API from the server |
| Email service | Network access to the EmailJS API from the client |
| Network | Client and server reachable over HTTP in the development context |

## 2.5 Design and Implementation Constraints

| ID | Constraint |
|---|---|
| C-1 | The system shall be implemented using the MERN stack |
| C-2 | All user interface components shall be styled using Tailwind CSS |
| C-3 | All validation shall be enforced on the server; client-side checks are advisory only |
| C-4 | Configuration values (ports, database URI, JWT secret, Gemini API key, EmailJS keys) shall be read from environment variables, never hard-coded |
| C-5 | Passwords shall never be stored in recoverable form |
| C-6 | The client shall run on port 5173 and the server on a configured port, with CORS explicitly naming this origin |
| C-7 | All Gemini API calls shall be isolated in a single AI-handling module, never called directly from route handlers |
| C-8 | All EmailJS calls shall be issued through a single shared client-side helper |
| C-9 | Uploaded files shall be restricted server-side to `jpg`, `jpeg`, `png`, and `pdf`, with a 5MB maximum size |
| C-10 | The system shall be built in five sequential phases (Auth → Tenders → AI Analysis → Auctions → Negotiation/Contract), each independently functional before the next begins |

## 2.6 Assumptions and Dependencies

- A MongoDB instance is running and reachable before the server starts
- The server is started before the client
- A valid Gemini API key is configured; the proposal flow remains usable (manual entry) if the AI call fails — see FR-4.5
- A valid EmailJS configuration is present; core actions (approval, decisions, auction closing) succeed independently of email delivery — see NFR-R2
- The first Admin account is created via a seed script, not through public registration
- The system runs over HTTP in a development context; production deployment would require HTTPS (see §7.1)

---

# 3. Functional Requirements

## 3.1 Authentication & Account Management (Phase 1)

### FR-1 — Organization Registration

The system shall allow a visitor to register an Organization account by supplying a company name, email, password, commercial registration number, and a proof document.

| | |
|---|---|
| **Trigger** | Visitor submits the organization registration form |
| **Precondition** | None |
| **Postcondition** | A user record with `role: "organization"` and `status: "pending"` exists |

**FR-1.1** The system shall reject a missing or duplicate email address.
**FR-1.2** The system shall reject a password shorter than 8 characters.
**FR-1.3** The system shall require a proof document upload (see C-9) before the submission is accepted.
**FR-1.4** The system shall hash the password before storage and shall never persist or log the plaintext.
**FR-1.5** On success, the account shall be created with `status: "pending"` and shall not yet grant tender or proposal actions.
**FR-1.6** On failure, the system shall display the reason and retain the visitor's input.

### FR-2 — Individual Registration

**FR-2.1** The system shall allow a visitor to register an Individual account with a name, email, password, and national ID, without a document upload.
**FR-2.2** The account shall be activated immediately upon successful registration (`status: "approved"` by default).
**FR-2.3** The validation rules of FR-1.1, FR-1.2, and FR-1.4 apply equally to Individual registration.

### FR-3 — Login and Logout

**FR-3.1** The system shall allow a registered user of any role to authenticate with an email and password.
**FR-3.2** The system shall reject an incorrect password without revealing whether the email itself is registered.
**FR-3.3** On success the system shall issue a signed JWT carrying the user's identifier and role.
**FR-3.4** An Organization account with `status: "pending"` may log in but shall receive a distinct message indicating the account is awaiting review, and shall not receive access to tender-creation or proposal actions.
**FR-3.5** The system shall provide a logout control that discards the client-held token.

### FR-4 — Admin Review of Organizations

**FR-4.1** The system shall allow an Admin to list all Organization accounts with `status: "pending"`.
**FR-4.2** The system shall allow an Admin to approve a pending Organization, setting `status: "approved"`.
**FR-4.3** The system shall allow an Admin to reject a pending Organization, setting `status: "rejected"`, with an optional reason.
**FR-4.4** On either decision, the system shall trigger an automated email to the Organization via EmailJS (see FR-13).
**FR-4.5** A failure to send the notification email shall not prevent or roll back the approval/rejection itself (see NFR-R2).

## 3.2 Access Control (Phase 1)

### FR-5 — Role-Based Authorization

**FR-5.1** The system shall reject any request to a protected endpoint that does not carry a valid JWT, responding with HTTP 401.
**FR-5.2** Token verification (`isAuth`) shall occur before any controller logic executes.
**FR-5.3** Endpoints restricted to a specific role shall apply a role check (`isRole`) after authentication, responding with HTTP 403 when the authenticated user's role is not permitted.
**FR-5.4** The role used for authorization shall be read from the verified token or the corresponding database record — never from a role value supplied in the request body.
**FR-5.5** The client shall redirect an unauthenticated visitor away from a protected page to the login page; this is a usability measure only. Enforcement rests solely with FR-5.1 and FR-5.3, which remain effective independently of client behaviour.

## 3.3 Tender Management (Phase 2)

### FR-6 — Create Tender

**FR-6.1** The system shall allow an approved Organization to create a tender with a title, description, category, estimated budget, and deadline.
**FR-6.2** A tender shall default to `status: "open"` on creation.
**FR-6.3** An Organization with `status: "pending"` or `"rejected"` shall not be permitted to create a tender.

### FR-7 — Browse and Filter Tenders

**FR-7.1** The system shall allow any authenticated user to list open tenders.
**FR-7.2** The system shall support filtering the list by category and by budget range.
**FR-7.3** The system shall display a tender's full details, including its current status.

### FR-8 — Edit and Close Tender

**FR-8.1** The system shall allow the owning Organization to edit a tender's fields while it remains `open`.
**FR-8.2** The system shall allow the owning Organization, or an Admin, to close or cancel a tender.
**FR-8.3** An Admin shall be permitted to close or cancel any tender regardless of ownership, to moderate policy violations.

### FR-9 — Submit Proposal

**FR-9.1** The system shall allow an approved Organization to submit a proposal on an open tender by uploading a document (see C-9) and entering a final price.
**FR-9.2** The system shall reject a proposal submitted by the tender's own owner.
**FR-9.3** The system shall reject a second proposal from the same Organization on the same tender.
**FR-9.4** A newly submitted proposal shall default to `status: "submitted"`.

## 3.4 AI-Assisted Proposal Analysis (Phase 3)

### FR-10 — Document Analysis

**FR-10.1** On document upload, the system shall send the document to the Gemini API and request an extracted price and a short summary.
**FR-10.2** The system shall display the extracted price, summary, and a `confidenceScore` (0–100) to the submitting Organization before final submission.
**FR-10.3** The submitting Organization shall be permitted to override the AI-extracted price with a manually entered value; the AI output is advisory, not binding.
**FR-10.4** If the Gemini call fails or times out, the system shall allow the Organization to proceed by entering the price and summary manually, without blocking submission (see C-7, NFR-R1).

### FR-11 — Proposal Review and Decision

**FR-11.1** The system shall allow the tender-owning Organization to list all proposals submitted against its tender, including each one's AI-extracted data and confidence score.
**FR-11.2** The system shall allow the tender-owning Organization to accept or reject a specific proposal.
**FR-11.3** On a decision, the system shall trigger an automated email to the submitting Organization via EmailJS (see FR-13).
**FR-11.4** Accepting one proposal shall not automatically reject the others; rejection of remaining proposals, if desired, shall be a separate explicit action.

## 3.5 Auction Management (Phase 4)

### FR-12 — Create, Approve, and Browse Auctions

**FR-12.1** The system shall allow an approved Organization or an Admin to create an auction with a title, description, image, starting price, and closing time.
**FR-12.2** A newly created auction shall default to `status: "pending_approval"` and shall not be visible in public listings until approved.
**FR-12.3** The system shall allow an Admin to approve an auction, setting `status: "active"`.
**FR-12.4** The system shall allow any visitor, authenticated or not, to browse active auctions.
**FR-12.5** The system shall display, for each active auction, the current price and time remaining until closing.

### FR-13 — Bidding

**FR-13.1** The system shall allow only an authenticated Individual to submit a bid on an active auction.
**FR-13.2** The system shall reject a bid that is not strictly greater than the auction's current price, with a clear error message.
**FR-13.3** On a successful bid, the system shall update the auction's current price and current highest bidder, and record the bid in the bid history.
**FR-13.4** The client shall poll the auction detail endpoint every 3–5 seconds to reflect the current price to all viewers (see C-10, NFR-P2).

### FR-14 — Auction Closing and Notification

**FR-14.1** The system shall treat an auction whose closing time has passed as closed on the next request that reads it, without requiring a separate scheduled job.
**FR-14.2** On closing, the system shall determine the winner as the Individual holding the current highest bid, if any.
**FR-14.3** The system shall display an in-app notice to the winner and trigger an automated email via EmailJS (see FR-13 email requirement, FR-16).
**FR-14.4** The system shall allow an Individual to view a personal list of auctions they have participated in, with each one's outcome.
**FR-14.5** The final payment step for a won auction shall be a simulated confirmation screen in this version (see §1.2, Out of scope).

## 3.6 Negotiation and Contract Generation (Phase 5 — Stretch Goal)

This section is implemented only if time permits after Phases 1–4 are complete and stable; it is not part of the MVP baseline (see C-10, §1.2).

**FR-15.1** If implemented, the system shall open a simple message thread between a tender owner and an Organization whose proposal was accepted.
**FR-15.2** If implemented, the system shall allow the tender owner to request an AI-generated draft contract based on the accepted proposal's data.
**FR-15.3** A generated draft shall be presented as editable, reviewable text and shall be explicitly labelled as non-binding without an out-of-system signature.

## 3.7 Notifications

### FR-16 — Automated Email Notifications

**FR-16.1** The system shall send an email via EmailJS for each of: organization approval, organization rejection, proposal acceptance, proposal rejection, and auction win.
**FR-16.2** All EmailJS calls shall originate from a single shared client-side helper (C-8), not be duplicated inline.
**FR-16.3** A failed EmailJS call shall be logged client-side and shall not alter, retry indefinitely, or block the underlying state change that triggered it (see NFR-R2).

---

# 4. External Interface Requirements

## 4.1 User Interfaces

| Screen | Path (example) | Protected | Role | Purpose |
|---|---|---|---|---|
| Landing Page | `/` | No | — | Entry point; links to registration/login |
| Register (Organization) | `/register/organization` | No | — | Create an organization account |
| Register (Individual) | `/register/individual` | No | — | Create an individual account |
| Login | `/login` | No | — | Authenticate |
| Admin Dashboard | `/admin/dashboard` | Yes | Admin | Pending organizations, tenders, auctions overview |
| Organization Dashboard | `/org/dashboard` | Yes | Organization | My tenders, my proposals |
| Individual Dashboard | `/dashboard` | Yes | Individual | My auction activity |
| Tenders List | `/tenders` | Yes | Any authenticated | Browse and filter tenders |
| Tender Details | `/tenders/:id` | Yes | Any authenticated | View a tender, submit a proposal |
| Proposal Review | `/tenders/:id/proposals` | Yes | Organization (owner) | Review AI-analyzed proposals, accept/reject |
| Auctions List | `/auctions` | No | — | Browse active auctions |
| Auction Details | `/auctions/:id` | No (bidding requires login) | Individual (to bid) | View price, place bids |
| My Auctions | `/my-auctions` | Yes | Individual | Personal auction history |

**UI-1** All screens shall be styled using Tailwind CSS (constraint C-2).
**UI-2** Invalid form fields shall be visually distinguished and accompanied by an explanatory message.
**UI-3** Navigation between screens shall occur without a full page reload.
**UI-4** The layout shall be responsive, with mobile use treated as the primary target for the Individual role.

## 4.2 API Interface

Base URL: `http://localhost:8000` (configurable via environment)

| Method | Endpoint | Auth | Role | Success | Failure |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | No | — | 200 `{ user }` | 400 `{ errors }` |
| POST | `/api/auth/login` | No | — | 200 `{ user, token }` | 400 `{ error }` |
| GET | `/api/users/me` | Yes | Any | 200 `{ user }` | 401 |
| GET | `/api/admin/organizations/pending` | Yes | Admin | 200 `{ organizations }` | 401, 403 |
| PATCH | `/api/admin/organizations/:id/approve` | Yes | Admin | 200 `{ organization }` | 401, 403, 404 |
| PATCH | `/api/admin/organizations/:id/reject` | Yes | Admin | 200 `{ organization }` | 401, 403, 404 |
| POST | `/api/tenders` | Yes | Organization | 200 `{ tender }` | 400, 401, 403 |
| GET | `/api/tenders` | Yes | Any | 200 `{ tenders }` | 401 |
| GET | `/api/tenders/:id` | Yes | Any | 200 `{ tender }` | 401, 404 |
| PATCH | `/api/tenders/:id` | Yes | Owner | 200 `{ tender }` | 400, 401, 403, 404 |
| DELETE | `/api/tenders/:id` | Yes | Owner or Admin | 200 `{ message }` | 401, 403, 404 |
| POST | `/api/tenders/:id/proposals` | Yes | Organization | 200 `{ proposal }` | 400, 401, 403 |
| POST | `/api/proposals/:id/analyze` | Yes | Organization (submitter) | 200 `{ aiExtractedData }` | 401, 403, 502 (AI failure) |
| GET | `/api/proposals/:id` | Yes | Owner or Admin | 200 `{ proposal }` | 401, 403, 404 |
| PATCH | `/api/proposals/:id/status` | Yes | Organization (tender owner) | 200 `{ proposal }` | 400, 401, 403, 404 |
| POST | `/api/auctions` | Yes | Organization or Admin | 200 `{ auction }` | 400, 401, 403 |
| PATCH | `/api/admin/auctions/:id/approve` | Yes | Admin | 200 `{ auction }` | 401, 403, 404 |
| GET | `/api/auctions` | No | — | 200 `{ auctions }` | — |
| GET | `/api/auctions/:id` | No | — | 200 `{ auction }` | 404 |
| POST | `/api/auctions/:id/bid` | Yes | Individual | 200 `{ auction }` | 400, 401, 403, 404 |
| GET | `/api/users/me/auctions` | Yes | Individual | 200 `{ auctions }` | 401 |

**API-1** All request and response bodies shall use JSON.
**API-2** Every successful response body shall be an object with a named key, never a bare array or value.
**API-3** Validation failures shall return HTTP 400 with a per-field error map.
**API-4** Authentication failures shall return HTTP 401; authorization (wrong role) failures shall return HTTP 403.
**API-5** A request for a non-existent resource identifier shall return HTTP 404 rather than a 500 or a silent empty success.

## 4.3 Software Interfaces

| Dependency | Purpose |
|---|---|
| Express | HTTP routing and middleware |
| Mongoose | Schema definition, validation, database access |
| bcrypt | Password hashing and comparison |
| jsonwebtoken | Token signing and verification |
| cors | Cross-origin request policy |
| dotenv | Loading environment configuration |
| helmet | Baseline HTTP security headers |
| express-rate-limit | Basic rate limiting on sensitive endpoints |
| multer | Multipart file upload handling |
| @google/generative-ai | Gemini API client for proposal document analysis |
| React (Vite) | User interface rendering |
| React Router DOM | Client-side routing |
| Tailwind CSS | User interface styling |
| axios | HTTP requests from the client to the API |
| @emailjs/browser | Client-side email notifications |

---

# 5. Data Requirements

## 5.1 User Entity

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | Generated by the database |
| `name` | String | Required |
| `email` | String | Required, unique |
| `password` | String | Required, minimum 8 characters, stored hashed |
| `role` | String | Required, enum: `admin`, `organization`, `individual` |
| `companyName` | String | Required if `role = organization` |
| `commercialRegisterNo` | String | Required if `role = organization` |
| `proofDocumentUrl` | String | Required if `role = organization` |
| `nationalId` | String | Required if `role = individual` |
| `status` | String | Enum: `pending`, `approved`, `rejected`; defaults to `approved`, set to `pending` for new organizations |
| `createdAt` / `updatedAt` | Date | Generated |

## 5.2 Tender Entity

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | Generated by the database |
| `title` | String | Required |
| `description` | String | Required |
| `category` | String | Required |
| `budgetEstimate` | Number | Optional |
| `deadline` | Date | Required |
| `createdBy` | ObjectId (ref: User) | Required |
| `status` | String | Enum: `open`, `closed`, `cancelled`; defaults to `open` |
| `createdAt` / `updatedAt` | Date | Generated |

## 5.3 BidProposal Entity

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | Generated by the database |
| `tender` | ObjectId (ref: Tender) | Required |
| `submittedBy` | ObjectId (ref: User) | Required |
| `documentUrl` | String | Required |
| `aiExtractedData.extractedPrice` | Number | Optional (may be absent on AI failure) |
| `aiExtractedData.summary` | String | Optional |
| `aiExtractedData.confidenceScore` | Number | Optional, 0–100 |
| `finalPrice` | Number | Required |
| `status` | String | Enum: `submitted`, `under_review`, `accepted`, `rejected`; defaults to `submitted` |
| `createdAt` / `updatedAt` | Date | Generated |

## 5.4 Auction Entity

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | Generated by the database |
| `title` | String | Required |
| `description` | String | Required |
| `imageUrl` | String | Optional |
| `startingPrice` | Number | Required |
| `currentPrice` | Number | Required, defaults to `startingPrice` |
| `currentHighestBidder` | ObjectId (ref: User) | Optional |
| `createdBy` | ObjectId (ref: User) | Required |
| `endsAt` | Date | Required |
| `status` | String | Enum: `pending_approval`, `active`, `ended`, `cancelled`; defaults to `pending_approval` |
| `createdAt` / `updatedAt` | Date | Generated |

## 5.5 BidHistory Entity

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | Generated by the database |
| `auction` | ObjectId (ref: Auction) | Required |
| `bidder` | ObjectId (ref: User) | Required |
| `amount` | Number | Required |
| `createdAt` | Date | Generated |

## 5.6 Validation Rules

| Field | Rule | Message to user |
|---|---|---|
| email | Present, unique | Email is required / already registered |
| password | ≥ 8 characters | Password must be at least 8 characters |
| proofDocumentUrl | Present for organizations | A proof document is required |
| file upload (any) | Type in `jpg`, `jpeg`, `png`, `pdf`; ≤ 5MB | Unsupported file type or file too large |
| tender.title | Present | Tender title is required |
| tender.deadline | Present, in the future | Deadline must be a future date |
| proposal.finalPrice | Present, positive number | Please enter a valid price |
| proposal (duplicate) | One per Organization per tender | You have already submitted a proposal for this tender |
| auction.startingPrice | Present, positive number | Starting price must be greater than zero |
| bid.amount | Strictly greater than `currentPrice` | Your bid must be higher than the current price |

**DATA-1** These rules shall be enforced by the server on both creation and update.
**DATA-2** A validation failure shall prevent any write to the database.
**DATA-3** All applicable rules shall be evaluated together where practical, so that a single response reports every failing field rather than only the first.

---

# 6. Non-Functional Requirements

## 6.1 Security

| ID | Requirement |
|---|---|
| NFR-S1 | Passwords shall be hashed using bcrypt before storage |
| NFR-S2 | The plaintext password shall not be stored, logged, or returned in any response |
| NFR-S3 | The authentication token shall be a signed JWT; a token with an invalid signature shall be rejected |
| NFR-S4 | The signing secret and all third-party API keys (Gemini, EmailJS) shall be supplied via environment variables and shall not appear in source control |
| NFR-S5 | Cross-origin requests shall be accepted only from the configured client origin |
| NFR-S6 | Authorization (role) shall be re-derived server-side from the verified token on every request; a role value in the request body shall never be trusted (see FR-5.4) |
| NFR-S7 | Server-side validation shall be authoritative and shall not be bypassable by a client that skips its own checks |
| NFR-S8 | Uploaded files shall be validated server-side by MIME type, not by file extension alone |

## 6.2 Usability

| ID | Requirement |
|---|---|
| NFR-U1 | Validation messages shall identify the specific field at fault |
| NFR-U2 | A failed submission shall preserve the user's entered data |
| NFR-U3 | Operations lasting more than a moment (AI analysis, file upload) shall display a progress indication |
| NFR-U4 | Destructive actions (delete tender, reject organization) shall be visually distinguished from non-destructive ones |
| NFR-U5 | An empty data set (no tenders, no auctions, no proposals) shall produce an explanatory message rather than a blank region |
| NFR-U6 | The interface shall be usable on a mobile viewport without horizontal scrolling |

## 6.3 Performance

| ID | Requirement |
|---|---|
| NFR-P1 | Under normal conditions, a non-AI read request shall return within 2 seconds |
| NFR-P2 | Auction price polling shall occur no more often than every 3 seconds and no less often than every 5 seconds, balancing responsiveness against server load |
| NFR-P3 | Navigation between screens shall not trigger a full page reload |
| NFR-P4 | AI analysis latency is exempt from NFR-P1 but shall display progress feedback per NFR-U3 |

## 6.4 Reliability

| ID | Requirement |
|---|---|
| NFR-R1 | A failed or timed-out Gemini API call shall not block proposal submission; the user shall be able to proceed with manually entered data (see FR-10.4) |
| NFR-R2 | A failed EmailJS call shall not block, retry indefinitely, or reverse the state change that triggered it; the database record is the sole source of truth for status (see FR-16.3) |
| NFR-R3 | An auction's closing/winner determination shall be computed consistently from `endsAt` and stored bid data, not from a value cached at listing time |

## 6.5 Maintainability

| ID | Requirement |
|---|---|
| NFR-M1 | Routing definitions, business logic, and data schemas shall reside in separate modules |
| NFR-M2 | Environment-specific values shall be externalised to configuration |
| NFR-M3 | Validation rules shall be declared once, in the schema, rather than duplicated across controllers |
| NFR-M4 | All Gemini calls shall be isolated to one module (C-7); all EmailJS calls shall go through one shared helper (C-8) |
| NFR-M5 | A single global error-handling middleware shall format all thrown errors into a consistent response shape |

## 6.6 Portability

| ID | Requirement |
|---|---|
| NFR-PO1 | The system shall run against either a local MongoDB instance or a hosted Atlas cluster, distinguished only by configuration |
| NFR-PO2 | The system shall run on any platform supporting the required Node.js version |

---

# 7. Known Limitations

Recorded deliberately. These are acknowledged gaps against the current MVP baseline, not defects, and correspond to the *Out of scope* items in §1.2.

## 7.1 Security

| ID | Limitation | Consequence |
|---|---|---|
| L-1 | The authentication token carries no expiry in the MVP | A token remains valid indefinitely once issued |
| L-2 | Traffic is unencrypted over HTTP in development | Tokens and data are exposed in transit; HTTPS is required before any real deployment |
| L-3 | No rate limiting beyond a basic global policy | Login and bidding endpoints have limited protection against automated abuse |
| L-4 | Uploaded files are stored on local disk in the MVP | No redundancy or CDN distribution; not suitable for production scale |

## 7.2 Functional

| ID | Limitation | Consequence |
|---|---|---|
| L-5 | No formal audit trail | Admin actions (approvals, moderation) are not recorded in an immutable log |
| L-6 | No formal dispute/appeal workflow | A rejected proposal or organization has no in-system escalation path |
| L-7 | Payment is simulated, not processed through a real gateway | An auction "win" does not move real funds |
| L-8 | Live bidding uses polling, not push updates | Up to a 3–5 second delay before all viewers see the current price |
| L-9 | Single-currency support only | The platform cannot serve cross-currency transactions |
| L-10 | Phase 5 (negotiation chat, AI contract draft) is a stretch goal | May be absent from the delivered baseline entirely |

## 7.3 Candidate Enhancements

Ordered by the ratio of benefit to effort, for post-graduation iteration:

1. Add token expiry and a refresh mechanism — addresses L-1
2. Move to HTTPS with secure cookie/storage handling — addresses L-2
3. Add endpoint-specific rate limiting (login, bid, proposal submission) — addresses L-3
4. Migrate file storage to Cloudinary or equivalent — addresses L-4
5. Add an append-only audit log collection for admin actions — addresses L-5
6. Replace polling with Socket.io for live bidding — addresses L-8
7. Add multi-currency support — addresses L-9
8. Implement Phase 5 (negotiation + AI contract generation) — addresses L-10
9. Integrate a real payment gateway — addresses L-7

---

# 8. Requirements Traceability

| Requirement | Verified by |
|---|---|
| FR-1.1, FR-1.2 | Submit organization registration with a duplicate email, then with a short password. Both rejected with a specific message. |
| FR-1.4, NFR-S1 | Inspect the stored user document; the password field contains a bcrypt hash, not the submitted value. |
| FR-1.5, FR-3.4 | Register a new organization, then log in immediately; dashboard shows a pending-review notice and hides tender-creation actions. |
| FR-4.2, FR-4.4 | Approve a pending organization as Admin; verify `status` changes to `approved` and an EmailJS call is triggered. |
| FR-5.1, FR-5.3 | Call a protected endpoint with no token (expect 401); call an admin-only endpoint as an Organization (expect 403). |
| FR-5.4 | Attempt to register with `"role": "admin"` in the request body; verify the created account is not granted admin access. |
| FR-6.3 | Attempt tender creation as a `pending` organization; verify rejection. |
| FR-9.2, FR-9.3 | Attempt to submit a proposal on one's own tender (rejected); submit two proposals on the same tender as the same organization (second rejected). |
| FR-10.2, FR-10.4 | Upload a valid proposal document (expect extracted data + confidence score); simulate an AI failure (expect manual entry still succeeds). |
| FR-11.2, FR-11.3 | Accept a proposal as the tender owner; verify status change and a triggered notification email. |
| FR-12.2, FR-12.3 | Create an auction as an Organization (expect `pending_approval`, not publicly listed); approve as Admin (expect it becomes listed). |
| FR-13.2 | Submit a bid equal to or below the current price; expect rejection with a clear message. |
| FR-13.3, FR-13.4 | Place a valid bid; poll the auction endpoint from a second session and confirm the updated price appears within one polling interval. |
| FR-14.2, FR-14.3 | Let an auction's `endsAt` pass with a recorded highest bidder; verify the winner is correctly identified and notified. |
| DATA-1, DATA-2 | Submit invalid data via both create and update paths for tenders, proposals, and auctions; verify no database write occurs in either case. |
| NFR-R1 | Disable/mock the Gemini API key temporarily; verify proposal submission still completes via manual entry. |
| NFR-R2 | Disable/mock the EmailJS configuration temporarily; verify approval/rejection/decision actions still succeed and persist. |

---

*End of specification.*
