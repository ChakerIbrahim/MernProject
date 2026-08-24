# Requirements Document — Procurement & Auction Platform (MVP)

This document defines the functional and non-functional requirements for the "Etimad" (اعتماد) platform, based on the authoritative Software Requirements Specification (SRS) and reflecting the actual implemented product architecture (including Socket.io for chat, dynamic AI forms, and email verification).

---

## 1. Functional Requirements (FR)

### FR-1: Identity, Access & Onboarding

| ID | Requirement | Role |
|---|---|---|
| FR-1.1 | Users can register as an Organization or Individual using email, password, and required proof documents. | Org / Ind |
| FR-1.2 | Registration routes through a `TemporaryUser` state; users must verify their email via a code sent by EmailJS before the final account is created. | Org / Ind |
| FR-1.3 | Individual accounts require a National ID upload. AI analyzes the ID to ensure it matches the provided name and is a valid document. | Individual |
| FR-1.4 | Organization accounts require a commercial register document and remain in a `pending` state until reviewed by an Admin. | Organization |
| FR-1.5 | Admins can view a list of pending organizations, inspect their proof documents, and approve or reject them. | Admin |
| FR-1.6 | Upon approval or rejection, an automated email is sent to the organization via EmailJS. | System |
| FR-1.7 | Users can log in with valid credentials and receive a JWT for authentication. | All |
| FR-1.8 | Passwords must be hashed using `bcrypt` before storage. | System |

### FR-2: Tenders & Proposals

| ID | Requirement | Role |
|---|---|---|
| FR-2.1 | Approved Organizations can create a new tender by uploading an official book (document). | Organization |
| FR-2.2 | AI analyzes the official book to extract key tender information and pre-fills a dynamic form for the user to review/edit before publishing. | System |
| FR-2.3 | Any registered user can browse open tenders. | Registered |
| FR-2.4 | Approved Organizations can submit a proposal to an open tender by uploading a technical/financial document. | Organization |
| FR-2.5 | Users cannot submit a proposal to their own tender. | System |
| FR-2.6 | Tender owners can view all received proposals. | Org (Owner) |
| FR-2.7 | Tender owners can trigger AI analysis on received proposals to extract the final price and a summary for easier comparison. | Org (Owner) |
| FR-2.8 | Admins can close or remove any tender for moderation purposes. | Admin |

### FR-3: Auctions & Bidding

| ID | Requirement | Role |
|---|---|---|
| FR-3.1 | Approved Organizations can create an auction by uploading a product specification document. | Organization |
| FR-3.2 | AI analyzes the product document to generate dynamic product properties (e.g., model, color, condition) for the auction listing. | System |
| FR-3.3 | Auctions display a real-time countdown timer. | All |
| FR-3.4 | Both approved Individuals and Organizations can place bids on active auctions. | Ind / Org |
| FR-3.5 | A new bid must be strictly higher than the current highest bid plus any minimum increment. | System |
| FR-3.6 | Auction owners cannot bid on their own auctions. Admins cannot bid on any auction. | System |
| FR-3.7 | When the countdown expires, the auction closes automatically, and the highest bidder is recorded. | System |

### FR-4: Real-time Chat & Negotiation

| ID | Requirement | Role |
|---|---|---|
| FR-4.1 | Organizations can request a chat with a tender owner, or owners can initiate chat after accepting a proposal. | Organization |
| FR-4.2 | Chat utilizes Socket.io for real-time, instant message delivery without manual page refreshing. | System |
| FR-4.3 | Chat interfaces feature an internally scrollable message history that auto-scrolls to the newest message. | All |
| FR-4.4 | The system maintains a global unread message count, displaying a badge in the application header. | System |
| FR-4.5 | Socket.io emits global notifications to update the unread badge instantly when a user receives a message. | System |

---

## 2. Non-Functional Requirements (NFR)

| Category | Requirement |
|---|---|
| **Security (NFR-S)** | All protected endpoints must verify the JWT via middleware (`isAuth`). Roles are checked via a separate middleware (`isRole`). Passwords are never stored in plain text. API keys (Gemini, EmailJS) exist only in `.env`. Rate limiting and Helmet are applied to the Express server. |
| **Performance (NFR-P)** | API responses should generally return within 2 seconds, excluding AI processing times. Socket.io is used for chat to prevent heavy HTTP polling overhead. |
| **Usability (NFR-U)** | The user interface is strictly Arabic (RTL). Error messages must be user-friendly (e.g., "كلمة المرور غير صحيحة" rather than raw stack traces). The design must be fully responsive, ensuring no horizontal scrolling on mobile devices (360px width). |
| **Resilience (NFR-R)** | Graceful Degradation: If AI extraction fails (network error, invalid JSON), the system must allow the user to continue by entering the data manually. If EmailJS fails, the core database transaction (e.g., user registration) must still succeed. |
| **Architecture (NFR-A)** | The frontend utilizes Tailwind CSS v4 semantic tokens (`bg-paper`, `text-ink`) to support a seamless global Dark Mode. AI logic is isolated in specific controllers. EmailJS logic is isolated in a helper utility. |
| **Compatibility (NFR-C)** | The application requires Node.js 18+ and MongoDB 6+. It must run on modern versions of Chrome, Safari, and Firefox. |

---

## 3. Out of Scope (MVP)

The following features are explicitly excluded from the MVP scope:
- Multi-currency support or live currency conversion.
- Complex multi-tier pre-qualification workflows.
- Formal legal dispute or appeal workflows.
- Immutable blockchain-style audit trails.
- Real payment gateway integration (bidding represents a commitment, but payment occurs outside the platform).
- SMS or Push notifications (EmailJS and in-app socket notifications are used instead).
- English localization (The MVP is strictly Arabic RTL).

---

## 4. Definition of Done (DoD)

A sprint or feature is only considered "Done" when the following criteria are met:

1. **Functionality:** Every functional requirement listed in the sprint works end-to-end (no mockups or stubs).
2. **API Testing:** Endpoints have been tested (via UI or Postman) for both success and expected failure cases.
3. **Error Handling:** Expected failures return correct HTTP status codes (`400` Validation, `401` Unauthorized, `403` Forbidden, `404` Not Found), not generic `500` errors.
4. **Integration:** The React frontend is wired to the real Express API. No hardcoded mock data remains.
5. **UI States:** All data-fetching screens handle four states: Loading, Error, Empty, and Data.
6. **RTL Compliance:** CSS uses logical properties (`ps-`, `me-`) instead of physical properties (`pl-`, `mr-`).
7. **Localization:** All user-facing text is in Arabic.
8. **Responsiveness:** The layout does not break or overflow horizontally on mobile viewports.
