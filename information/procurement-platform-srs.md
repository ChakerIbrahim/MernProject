# Software Requirements Specification
## Procurement & Auction Platform "Etimad" (اعتماد)

| | |
|---|---|
| **Version** | 2.0 |
| **Date** | 23 August 2026 |
| **Status** | Final Baseline |
| **Standard** | Based on IEEE 830 |

---

# 1. Introduction

## 1.1 Purpose

This document specifies the functional and non-functional requirements for "Etimad" (اعتماد), a comprehensive web platform that enables organizations to publish and bid on procurement tenders, and allows individuals and organizations to bid on public auctions. The platform heavily integrates AI (Google Gemini) to automate data extraction from official documents, validate identities, and generate dynamic forms. It also features real-time chat via Socket.io and automated email notifications.

It is intended for developers, maintainers, and stakeholders. It describes **what** the system does and reflects the implemented MVP scope of the project.

## 1.2 Scope

The system is a full-stack MERN application serving three user classes: Admin, Organization, and Individual.

**In scope:**
- Registration and authentication for three roles, utilizing a `TemporaryUser` state and EmailJS for email verification.
- AI-powered National ID validation for Individual accounts.
- Admin review and approval/rejection of Organization accounts.
- Full CRUD operations on procurement tenders.
- Submission of proposals against open tenders, including document upload.
- AI-assisted extraction of data from tender requests and submitted proposals.
- Creation of auctions with AI-generated dynamic product specifications and multi-image galleries.
- Near-real-time bidding on auctions (client-side polling).
- Real-time negotiation chat between organizations via Socket.io.
- Automated email notifications for approvals, decisions, and auction results via EmailJS.
- Server-side validation, role-based access control, and a fully responsive RTL Arabic interface with Dark Mode support.

**Out of scope (MVP):**
- Multi-currency support and real-time currency conversion.
- Formal multi-tier pre-qualification for large organizations.
- A formal, multi-stage legal dispute/appeal system.
- A complete, immutable blockchain-style audit trail.
- A real payment gateway (simulated confirmation screens are used).
- Real SMS or push notifications (in-app Socket.io notices and EmailJS are used instead).
- AI Contract Generation (explicitly removed per user request).

## 1.3 Definitions and Abbreviations

| Term | Meaning |
|---|---|
| **Admin** | The system-administrator role; approves organizations and moderates listings |
| **API** | Application Programming Interface — the server's HTTP endpoints |
| **Auction** | A listed asset that users bid on until a closing time |
| **Confidence Score** | A 0–100 value indicating how certain the AI is about its extracted data |
| **Gemini** | Google's generative AI API, used for document analysis and ID validation |
| **Individual** | A natural-person account restricted to participating in auctions |
| **JWT** | JSON Web Token — a signed token carrying claims about the authenticated user |
| **MERN** | MongoDB, Express, React, Node.js |
| **Organization** | A company/institution account that publishes/bids on tenders and lists auctions |
| **Proposal** | A document-backed offer an Organization submits against another Organization's tender |

---

# 2. Overall Description

## 2.1 Product Perspective

The system follows a three-tier architecture with external AI and Email dependencies.

```
┌─────────────────────────┐
│   PRESENTATION TIER     │   React (Vite) SPA, Tailwind CSS v4 (Dark Mode)
│   Browser, port 5173    │   Polling for auctions, Socket.io for chat
└───────────┬─────────────┘
            │  HTTP + JSON, JWT attached
            ▼
┌─────────────────────────┐        ┌──────────────────────┐
│   APPLICATION TIER      │ ─────▶ │  Gemini API (AI)      │
│   Node.js / Express     │        │  Document & ID checks │
└───────────┬─────────────┘        └──────────────────────┘
            │  Mongoose ODM
            ▼
┌─────────────────────────┐        ┌──────────────────────┐
│      DATA TIER          │        │  EmailJS (client)     │
│   MongoDB               │        │  Notifications & OTPs │
└─────────────────────────┘        └──────────────────────┘
```

## 2.2 Product Functions

At a high level the system shall allow:
1. An Organization or Individual to register an account (including AI-based ID validation for Individuals).
2. Any registered user to verify their email address to finalize account creation.
3. Any registered user to log in and log out.
4. An Admin to review, approve, or reject Organization registrations.
5. An Organization to publish, edit, and close a tender using AI document extraction.
6. Any registered user to browse and filter open tenders.
7. An Organization to submit a document-backed proposal on another Organization's tender.
8. The system to analyze a submitted proposal document with AI and present extracted data.
9. An Organization to accept or reject a proposal.
10. An Organization or Admin to publish an auction (with AI dynamic fields), subject to Admin approval.
11. An Individual or Organization to browse public auctions and place bids.
12. The system to close an auction automatically at its deadline and determine the winner.
13. Organizations to chat in real-time regarding tenders and proposals via Socket.io.
14. The system to send automated email notifications for key status changes.

## 2.3 User Characteristics

| Class | Description | Technical knowledge assumed |
|---|---|---|
| **Admin** | Operates the platform; approves organizations, moderates listings | Comfortable with a web dashboard |
| **Organization** | A company or institution; publishes/bids on tenders, lists auctions | Basic web browsing |
| **Individual** | A natural person; participates in auctions | Basic web/mobile browsing |

## 2.4 Design and Implementation Constraints

| ID | Constraint |
|---|---|
| C-1 | The system shall be implemented using the MERN stack. |
| C-2 | All user interface components shall be styled using Tailwind CSS v4, supporting RTL and Dark Mode. |
| C-3 | All validation shall be enforced on the server; client-side checks are advisory only. |
| C-4 | Secrets (JWT, Gemini, EmailJS) shall be read from environment variables, never hard-coded. |
| C-5 | Passwords shall be hashed using bcrypt. |
| C-6 | All Gemini API calls shall be isolated in a single AI-handling module. |
| C-7 | Uploaded files shall be restricted server-side to `jpg`, `jpeg`, `png`, and `pdf`, with a 5MB maximum size. |

---

# 3. Functional Requirements

## 3.1 Authentication & Onboarding

### FR-1: Organization Registration
**FR-1.1** The system shall allow a visitor to register an Organization by supplying a company name, email, password, phone number, and a proof document.
**FR-1.2** On successful form submission, the system shall create a `TemporaryUser` and send a 6-digit verification code via EmailJS.
**FR-1.3** Upon successful email verification, the final account shall be created with `status: "pending"` and await Admin review.

### FR-2: Individual Registration
**FR-2.1** The system shall allow a visitor to register an Individual account with a name, email, phone number, password, and a National ID image upload.
**FR-2.2** The system shall use AI (Gemini) to analyze the uploaded National ID, verifying it is a valid document and matches the provided name.
**FR-2.3** If the AI approves the ID, the system shall create a `TemporaryUser` and send an email verification code. Upon verification, the account is activated immediately (`status: "approved"`).

### FR-3: Login & Admin Review
**FR-3.1** The system shall allow a registered user to authenticate and receive a signed JWT.
**FR-3.2** The system shall allow an Admin to list all `pending` Organizations, review their proof documents, and approve or reject them.
**FR-3.3** On approval or rejection, an automated email is sent to the Organization via EmailJS.

## 3.2 Tenders & Proposals

### FR-4: Tender Management
**FR-4.1** An approved Organization can create a tender by uploading an official book (PDF/Image).
**FR-4.2** The system shall use AI to extract key tender information and pre-fill a dynamic form for review before publishing.
**FR-4.3** Any authenticated user can browse and filter open tenders.
**FR-4.4** Admins can close or delete any tender for moderation purposes.

### FR-5: Proposal Submission
**FR-5.1** An approved Organization can submit a proposal to an open tender by uploading a document and entering a final price.
**FR-5.2** The system shall reject a proposal submitted by the tender's owner.
**FR-5.3** The tender owner can trigger AI analysis on received proposals to extract the final price and a summary for easier comparison.
**FR-5.4** The tender owner can accept or reject a proposal, triggering an EmailJS notification to the submitter.

## 3.3 Auctions & Bidding

### FR-6: Auction Management
**FR-6.1** An approved Organization or Admin can create an auction by uploading a product specification document and up to 8 images.
**FR-6.2** The system shall use AI to analyze the document and generate dynamic product properties (e.g., model, color, condition) for the listing.
**FR-6.3** Auctions created by Organizations default to `pending_approval` until an Admin approves them.
**FR-6.4** Auctions display a real-time countdown timer.

### FR-7: Bidding
**FR-7.1** Approved Individuals and Organizations can submit bids on active auctions.
**FR-7.2** A new bid must be strictly greater than the current highest bid plus any minimum increment.
**FR-7.3** Auction owners cannot bid on their own auctions. Admins cannot bid on any auction.
**FR-7.4** The client shall poll the auction detail endpoint every 3–5 seconds to reflect the current price to all viewers.
**FR-7.5** When the countdown expires, the auction closes automatically, the winner is recorded, and an EmailJS notification is sent.

## 3.4 Real-time Chat & Negotiation

### FR-8: Socket.io Chat
**FR-8.1** The system shall provide a real-time message thread between a tender owner and an Organization (either via an accepted proposal or a general chat request).
**FR-8.2** The chat shall utilize Socket.io for instant message delivery without requiring a manual page refresh.
**FR-8.3** The system shall track unread messages globally and display an unread badge in the application header, updated in real-time via Socket.io.
**FR-8.4** The message history UI shall be internally scrollable and automatically scroll to the bottom when new messages arrive.

---

# 4. Data Requirements

## 4.1 Core Entities

| Entity | Description | Key Fields |
|---|---|---|
| **User** | Core account record | `email`, `password` (hashed), `role`, `status`, `proofDocumentUrl`, `nationalId` |
| **TemporaryUser** | OTP holding area | `email`, `password` (hashed), `verificationCode`, `userData`, `createdAt` (TTL) |
| **Tender** | Procurement request | `title`, `description`, `deadline`, `status`, `createdBy` |
| **BidProposal** | Offer on a tender | `tender`, `submittedBy`, `documentUrl`, `finalPrice`, `aiExtractedData`, `status` |
| **Auction** | Listed asset for sale | `title`, `images`, `itemFields` (dynamic), `startingPrice`, `currentPrice`, `endsAt` |
| **BidHistory** | Log of auction bids | `auction`, `bidder`, `amount`, `createdAt` |
| **Message** | Chat message | `sender`, `receiver`, `content`, `contextId` (proposal or request), `isRead` |

---

# 5. Non-Functional Requirements

## 5.1 Security (NFR-S)
- Passwords must be hashed using bcrypt.
- JWTs must be verified via middleware (`isAuth`) on all protected routes.
- Role checks (`isRole`) must be enforced server-side based on the JWT payload.
- File uploads must be validated by MIME type, not just extension.

## 5.2 Usability (NFR-U)
- The interface must be strictly Arabic (RTL).
- Error messages must be user-friendly.
- The design must be fully responsive, ensuring no horizontal scrolling on mobile devices.
- The application must support a seamless global Dark Mode using semantic CSS variables.

## 5.3 Reliability (NFR-R)
- **Graceful Degradation:** If AI extraction fails (network error, invalid JSON), the system must allow the user to continue by entering data manually.
- If EmailJS fails, the core database transaction (e.g., user registration, proposal decision) must still succeed.

---

# 6. Known Limitations (MVP)

| ID | Limitation | Consequence |
|---|---|---|
| L-1 | Token carries no expiry | A token remains valid indefinitely once issued |
| L-2 | Unencrypted HTTP | Tokens are exposed in transit; HTTPS is required for production |
| L-3 | Live bidding uses polling | Socket.io is used for chat, but auction bidding relies on 3-5s polling to avoid excess websocket overhead for anonymous viewers |
| L-4 | Single-currency | The platform cannot serve cross-currency transactions |
| L-5 | Local file storage | Uploaded files are stored on local disk, requiring migration to cloud storage (e.g., S3) for production scale |

---
*End of specification.*
