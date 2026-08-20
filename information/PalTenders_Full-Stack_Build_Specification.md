# PalTenders Full-Stack Build Specification

> **Purpose.** Use this document as the implementation contract when turning the existing PalTenders prototype into a production-oriented full-stack platform. Preserve the delivered **Civic Ledger** interface, Arabic-first RTL behavior, routes, information hierarchy, and visual assets. Add real data, authorization, workflows, notifications, uploads, and Node.js APIs behind the existing screens; do **not** replace the design with a generic dashboard.

| Document property | Required value |
| --- | --- |
| Product | **منافسات فلسطين / PalTenders** |
| Product type | Palestinian government tenders and procurement platform |
| Frontend | **React 19 + JSX + Vite + Wouter + Tailwind CSS** |
| Backend | **Node.js + Express + JavaScript** |
| Primary UI language | Arabic, `dir="rtl"` by default |
| Secondary UI language | English, `dir="ltr"` without layout breakage |
| Canonical visual direction | Civic Ledger / contemporary civic editorialism |
| Architecture style | REST API, relational database, role-based access control, object storage for documents |

---

## 1. Product Objective and Delivery Boundary

PalTenders is a national procurement discovery and supplier participation platform. The public experience allows anyone to discover tenders, announcements, government entities, and awarded results. The authenticated supplier experience allows a verified company to manage its profile, documents, saved tenders, submitted offers, and notifications. Government staff and platform administrators require protected workflows for publishing, reviewing, and awarding tenders.

The existing prototype establishes the visual system and the intended interactions. The full-stack implementation must convert its current sample content into database-backed data without changing the language, page hierarchy, visual tone, or interaction model. A future builder must treat the prototype as the **frontend design source of truth** and this document as the **backend and integration source of truth**.

### 1.1 Explicit Non-Goals for the First Backend Release

The first backend release should not attempt payment collection, legally binding e-signature, supplier scoring by AI, automated award decisions, or public chat. Add extension points for these capabilities only where necessary. Procurement decisions must remain attributable to authorized human users and auditable in the backend.

---

## 2. Preserve the Civic Ledger Design System

The design must communicate an official Palestinian public service: calm, precise, transparent, and modern. It is not a generic startup dashboard, a literal Palestinian flag composition, or a visual copy of another national procurement platform.

### 2.1 Design Principles

| Principle | Implementation rule |
| --- | --- |
| **Public trust is visible** | Present dates, references, statuses, entities, and decision history in predictable positions with explicit labels. |
| **Identity is embedded** | Use olive lattice, mineral surfaces, and restrained Palestinian color accents; do not apply flag imagery indiscriminately. |
| **One platform system** | Public pages, supplier workspace, and authentication must share typography, controls, status patterns, and spacing. |
| **Quiet confidence** | Prefer whitespace, subtle borders, data rails, and structured sections over heavy shadows, gradients, or decorative cards. |

### 2.2 Design Tokens

| Token | Value | Usage |
| --- | --- | --- |
| Registry Green | `#007A3D` | Primary actions, active navigation, positive progress, verified states, civic rule. |
| Green Dark | `#005D2F` | Hover states, emphasized green text. |
| Palestinian Red | `#CE1126` | Alerts, unread markers, critical calls, sparing selected indicators. |
| Ink | `#17202A` | Headings, structural text, dark workflow/footer surface. |
| Paper | `#F7F8FA` | Page background. |
| Surface | `#FFFFFF` | Cards, forms, panels, tables. |
| Border | `#E5E7EB` | Deliberate structural separation. |
| Secondary text | `#667085` | Supporting labels and metadata. |
| Success | `#16803C` | Positive completion state. |
| Warning | `#D97706` | Expiring or pending states. |
| Error | `#C62828` | Validation, cancellation, and destructive states. |

### 2.3 Typography, Spacing, and Motion

Use **IBM Plex Sans Arabic** for UI and body content. Use **Noto Kufi Arabic** only for display statements, high-priority headings, and large numeric moments. Keep the existing major scale: display `40–52px`, H1 `32–42px`, H2 `28–34px`, H3 `20–24px`, body `16px`, metadata `12–14px`. Reference identifiers and statistics should use tabular numerals where possible.

Use 12–16px radii, thin borders, restrained `10–30px` shadow blur, and the existing `160–220ms` motion duration. Respect `prefers-reduced-motion`. Button clicks, dropdowns, filters, bookmarks, and drawers must provide immediate confirmation. Never rely on color alone to express a status.

### 2.4 Signature Motifs That Must Continue

The **civic rule** is a 3px Registry Green rule that anchors primary headings and priority record cards. The **olive lattice** is a low-contrast repeatable texture used as a separator, masked record accent, or section backdrop. **Registry stamps** are compact outlined status or reference blocks that make tender information feel certified and traceable.

The application includes the following visual asset URLs. Keep them or replace them only with assets that perform the same design role.

| Asset role | Current asset URL | Placement |
| --- | --- | --- |
| Hero civic-network illustration | `/manus-storage/paltenders-hero-abstract_728276e0.png` | Landing hero, image on the left with RTL text-safe space on the right. |
| Olive lattice texture | `/manus-storage/paltenders-olive-lattice_2a95083b.png` | Section dividers, registry-card accent, subtle texture. |
| Supplier CTA illustration | `/manus-storage/paltenders-supplier-network_0847607a.png` | Supplier call-to-action. |
| Brand mark | `/manus-storage/paltenders-logo-mark_c11ee9f1.png` | Header, sidebar, authentication, favicon. |

---

## 3. Current Frontend Contract

### 3.1 Required Route Map

| Route | Audience | Screen purpose | Backend data required |
| --- | --- | --- | --- |
| `/` | Public | Landing page, search, statistics, categories, active tenders, announcements, entities, supplier CTA. | Public aggregate statistics, featured tenders, categories, announcements, entities. |
| `/tenders` | Public | Searchable, filterable tender result list with grid/list presentation. | Tender search endpoint, filter options, pagination, counts. |
| `/tenders/:reference` | Public / supplier | Tender record, details, documents, deadline, timeline, questions. | Tender detail, public documents, timeline, Q&A, permission-aware supplier actions. |
| `/announcements` | Public | Searchable public bulletin of notices and updates. | Announcement list, filters, detail endpoint. |
| `/entities` | Public | Searchable directory of government entities. | Entity list, counts, location metadata. |
| `/awards` | Public | Awarded tender records with transparent winner and award value. | Public awarded tender list and detail. |
| `/supplier` | Supplier | Company dashboard: metrics, matching opportunities, next actions. | Authenticated supplier summary, alerts, matching tenders, profile completion. |
| `/supplier/profile` | Supplier | Company profile, verification state, contacts, specialties. | Supplier organization profile and verification records. |
| `/supplier/tenders` | Supplier | Saved, followed, and eligible tenders. | Supplier tender matches, bookmarks, participation state. |
| `/supplier/offers` | Supplier | Submitted offers and their workflow status. | Supplier bid records and status history. |
| `/supplier/notifications` | Supplier | Notification center with unread state. | Authenticated notifications, read receipts. |
| `/supplier/documents` | Supplier | Company document management and review status. | Private document metadata and upload actions. |
| `/login` | Supplier / staff | Sign in state, error state, loading state. | Session creation endpoint. |
| `/register` | Supplier | Supplier account and organization registration. | Registration endpoint, email verification initiation. |
| `/forgot-password` | Supplier / staff | Password recovery request. | Password-reset request endpoint. |
| `/verify` | Supplier / staff | Email/account verification. | Verification confirmation endpoint. |

### 3.2 Current Component Architecture

Keep the existing page composition. Add an API client, query hooks, form schemas, and reusable state components around it rather than rewriting page layout.

```text
client/src/
├── components/
│   ├── PlatformShell.jsx        # Public header, footer, page intro
│   ├── SupplierShell.jsx        # Supplier sidebar, mobile drawer, workspace header
│   ├── ui/                      # Existing reusable primitives
│   ├── states/                  # Add: EmptyState, ErrorState, Skeleton, PermissionState
│   ├── tenders/                 # Add: TenderCard, TenderFilters, TenderTimeline, DeadlineCard
│   └── suppliers/               # Add: ProfileProgress, DocumentList, OfferStatus
├── pages/                       # Preserve all current route screens
├── lib/api/                     # Add: HTTP client and endpoint modules
├── hooks/                       # Add: auth, tenders, supplier, notifications query hooks
├── contexts/                    # Extend with AuthContext and LocaleContext
└── index.css                    # Preserve Civic Ledger tokens and global RTL rules
```

### 3.3 Frontend Integration Rules

Use a single API client that reads `VITE_API_BASE_URL`, automatically sends an access token, refreshes sessions once on `401`, and returns normalized errors. Use an explicit query state for every server-backed surface: **loading**, **success**, **empty**, **error**, **permission denied**, and **stale/refreshing**. Existing toast feedback should show the outcome of real server actions, not only local prototype state.

For forms, validate client-side before submitting and repeat all validation on the server. Preserve Arabic labels and server-provided error messaging. Do not expose internal stack traces, SQL errors, role identifiers, or storage credentials in the UI.

---

## 4. Recommended Node.js Backend Architecture

Use a modular Express application. This is intentionally straightforward: the platform needs clear auditability and maintainable domain modules more than a microservice architecture in its first production release.

```text
server/
├── index.js                     # HTTP bootstrap and graceful shutdown
├── app.js                       # Express app, middleware, route mounting
├── config/
│   ├── env.js                   # Environment parsing and required variable checks
│   └── database.js              # PostgreSQL pool / ORM client
├── middleware/
│   ├── requireAuth.js
│   ├── requireRole.js
│   ├── validate.js
│   ├── rateLimit.js
│   ├── requestId.js
│   ├── errorHandler.js
│   └── auditContext.js
├── modules/
│   ├── auth/
│   ├── users/
│   ├── suppliers/
│   ├── entities/
│   ├── tenders/
│   ├── offers/
│   ├── announcements/
│   ├── awards/
│   ├── documents/
│   ├── notifications/
│   └── reports/
├── jobs/                        # deadline notices, document expiry, digest jobs
├── storage/                     # signed-upload and signed-download service
└── db/
    ├── migrations/
    └── seeds/
```

### 4.1 Core Runtime Choices

| Concern | Recommended implementation |
| --- | --- |
| HTTP framework | Express with async route handlers and centralized error middleware. |
| Database | PostgreSQL for relational procurement records and transactional integrity. |
| Query layer | Prisma or Knex. Select one and keep database access inside module repositories. |
| Authentication | Short-lived access JWT plus rotating refresh token stored in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie. |
| Password storage | Argon2id or bcrypt with a current cost factor; never store plaintext passwords. |
| Validation | Zod or Joi schemas shared conceptually with client validations. |
| File storage | S3-compatible private bucket with signed upload/download URLs. |
| Emails | Provider abstraction for verification, reset, and deadline notifications. |
| Background jobs | Node worker/cron process with durable job records; no browser-triggered schedule logic. |
| Observability | JSON logs with request IDs, error tracking, audit logs, health endpoint. |

### 4.2 Required Environment Variables

```dotenv
NODE_ENV=development
PORT=3000
APP_ORIGIN=https://your-frontend-domain.example
DATABASE_URL=postgresql://user:password@host:5432/paltenders
JWT_ACCESS_SECRET=replace-with-high-entropy-secret
JWT_REFRESH_SECRET=replace-with-different-high-entropy-secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
S3_ENDPOINT=https://storage.example
S3_REGION=region
S3_BUCKET=paltenders-private
S3_ACCESS_KEY_ID=replace-me
S3_SECRET_ACCESS_KEY=replace-me
EMAIL_FROM=no-reply@paltenders.example
EMAIL_PROVIDER_API_KEY=replace-me
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

Do not commit this file. Store secrets in the deployment environment, rotate them, and use distinct credentials for development, staging, and production.

---

## 5. Roles and Authorization Contract

Authorization must be role-based and supplemented by ownership checks. Every privileged action must produce an audit record.

| Role | Public records | Supplier profile and offers | Tender publishing | Awarding | Platform configuration |
| --- | --- | --- | --- | --- | --- |
| `PUBLIC` | Read active tenders, announcements, entities, awards. | No access. | No access. | No access. | No access. |
| `SUPPLIER_USER` | Read public records. | Read/update own organization where permitted; submit and view own offers. | No access. | No access. | No access. |
| `SUPPLIER_ADMIN` | Same as supplier user. | Manage organization users, profile, documents, offers. | No access. | No access. | No access. |
| `ENTITY_PUBLISHER` | Read public records. | No supplier access unless separately assigned. | Create and edit drafts for assigned entity; submit for review. | No access. | No access. |
| `PROCUREMENT_REVIEWER` | Read public records. | No private supplier documents unless assigned. | Review and publish assigned entity tenders. | Review workflow only. | No access. |
| `PROCUREMENT_MANAGER` | Read public records. | Review permitted submissions. | Publish, amend, close, and manage tender timeline for assigned entity. | Record award decision for assigned entity. | No access. |
| `PLATFORM_ADMIN` | Full read access. | Support access only with reason and audit trail. | Cross-entity administration. | Cross-entity administration. | Users, roles, taxonomy, platform settings. |
| `AUDITOR` | Full read-only reporting access, including audit history as permitted. | Read-only. | Read-only. | Read-only. | No write actions. |

Never authorize by role alone for entity-scoped resources. For example, an `ENTITY_PUBLISHER` must also belong to the tender’s `entity_id`.

---

## 6. Data Model

Use UUID primary keys. Store timestamps in UTC and render them in Arabic-localized formats at the frontend. Keep immutable audit events separate from mutable operational tables.

### 6.1 Identity and Organization Tables

| Table | Essential fields | Notes |
| --- | --- | --- |
| `users` | `id`, `email`, `password_hash`, `first_name`, `last_name`, `locale`, `email_verified_at`, `status`, timestamps | One identity record per human user. |
| `roles` | `id`, `code`, `name_ar`, `name_en` | Controlled role catalog. |
| `user_roles` | `user_id`, `role_id`, `entity_id?`, `supplier_id?` | Scope roles to a supplier or government entity where relevant. |
| `refresh_tokens` | `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `user_agent`, `ip_address` | Support rotation and session revocation. |
| `government_entities` | `id`, `name_ar`, `name_en`, `code`, `entity_type`, `governorate`, `logo_document_id?`, `is_active` | Government purchasers and publishers. |
| `suppliers` | `id`, `legal_name_ar`, `legal_name_en?`, `registration_number`, `tax_id?`, `governorate`, `address`, `website?`, `verification_status`, timestamps | Supplier organization record. |
| `supplier_members` | `supplier_id`, `user_id`, `membership_role`, `is_primary_contact` | Supplier account membership. |
| `supplier_specialties` | `supplier_id`, `category_id`, `sub_category_id?` | Drives matching and eligibility. |

### 6.2 Procurement Tables

| Table | Essential fields | Notes |
| --- | --- | --- |
| `tenders` | `id`, `reference_number`, `tender_number`, `title_ar`, `description_ar`, `entity_id`, `status`, `procurement_type`, `category_id`, `governorate`, `document_price_amount`, `currency`, publication and deadline timestamps | Central tender record. `reference_number` must be unique and immutable after publication. |
| `tender_status_history` | `id`, `tender_id`, `from_status`, `to_status`, `reason`, `actor_user_id`, `created_at` | Immutable lifecycle history. |
| `tender_timelines` | `id`, `tender_id`, `event_type`, `starts_at?`, `ends_at?`, `label_ar`, `sort_order` | Publish, inquiries, submission deadline, opening, evaluation, award. |
| `tender_documents` | `id`, `tender_id`, `document_id`, `kind`, `visibility`, `version`, `published_at` | Link private storage document metadata to tender. |
| `tender_requirements` | `id`, `tender_id`, `requirement_type`, `label_ar`, `is_mandatory`, `sort_order` | Structured eligibility and submission requirements. |
| `tender_questions` | `id`, `tender_id`, `supplier_id`, `question_text`, `answer_text?`, `status`, timestamps | Allow moderation and public anonymized answers. |
| `tender_bookmarks` | `supplier_id`, `tender_id`, `created_at` | Unique composite key. |
| `tender_views` | `id`, `tender_id`, `viewer_hash?`, `user_id?`, `created_at` | Aggregate carefully; do not expose personal visitor data publicly. |

### 6.3 Offer, Award, and Notification Tables

| Table | Essential fields | Notes |
| --- | --- | --- |
| `offers` | `id`, `tender_id`, `supplier_id`, `submitted_by_user_id`, `status`, `submitted_at`, `withdrawn_at?`, `total_amount?`, `currency` | A tender may set `max_offers_per_supplier`; default should be one active offer. |
| `offer_documents` | `id`, `offer_id`, `document_id`, `kind`, `is_required`, `uploaded_at` | Private to supplier and authorized evaluators. |
| `offer_status_history` | `id`, `offer_id`, `from_status`, `to_status`, `reason`, `actor_user_id`, `created_at` | Immutable operational history. |
| `awards` | `id`, `tender_id`, `winner_supplier_id`, `award_amount`, `currency`, `awarded_at`, `decision_summary_ar`, `published_at`, `status` | Public after `published_at`; avoid exposing protected evaluation data. |
| `announcements` | `id`, `entity_id?`, `tender_id?`, `type`, `title_ar`, `body_ar`, `published_at`, `deadline_at?`, `status` | Public bulletin. |
| `notifications` | `id`, `user_id`, `type`, `title_ar`, `body_ar`, `action_url`, `read_at?`, `created_at` | In-app supplier/staff notification center. |
| `documents` | `id`, `storage_key`, `original_filename`, `mime_type`, `size_bytes`, `sha256`, `uploaded_by_user_id`, `scan_status`, `created_at` | Private metadata only; no public bucket listing. |
| `audit_logs` | `id`, `actor_user_id?`, `action`, `resource_type`, `resource_id`, `entity_id?`, `supplier_id?`, `before_json?`, `after_json?`, `request_id`, `ip_address`, `created_at` | Append-only; never expose directly to public UI. |

### 6.4 Key Status Enumerations

| Domain | Allowed values |
| --- | --- |
| Tender status | `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `INQUIRY_OPEN`, `SUBMISSION_OPEN`, `EXPIRING_SOON`, `SUBMISSION_CLOSED`, `OPENING`, `EVALUATION`, `AWARDED`, `CANCELLED`, `ARCHIVED` |
| Offer status | `DRAFT`, `SUBMITTED`, `WITHDRAWN`, `UNDER_REVIEW`, `CLARIFICATION_REQUIRED`, `ACCEPTED`, `REJECTED`, `AWARDED` |
| Supplier verification | `UNVERIFIED`, `PENDING_REVIEW`, `VERIFIED`, `SUSPENDED`, `REJECTED`, `EXPIRED` |
| Document review | `PENDING`, `VERIFIED`, `REJECTED`, `EXPIRED`, `MALWARE_FLAGGED` |
| Announcement status | `DRAFT`, `PUBLISHED`, `EXPIRED`, `CANCELLED` |

---

## 7. Business Workflow Rules

### 7.1 Tender Lifecycle

```text
DRAFT
  → PENDING_REVIEW
  → PUBLISHED / INQUIRY_OPEN / SUBMISSION_OPEN
  → EXPIRING_SOON
  → SUBMISSION_CLOSED
  → OPENING
  → EVALUATION
  → AWARDED

Any pre-award state → CANCELLED
AWARDED → ARCHIVED
```

The backend must calculate `EXPIRING_SOON` from a configurable threshold, such as 72 hours before `submission_deadline_at`, instead of trusting a frontend label. `SUBMISSION_CLOSED` must be enforced by server time. Publishing or changing a tender’s deadline must create an audit event and optionally send notifications to followers and eligible suppliers.

### 7.2 Supplier and Offer Rules

1. A supplier must have `VERIFIED` status before creating or submitting an offer.
2. A supplier may view public tender documents, but private offer documents are visible only to authorized organization members and assigned procurement evaluators.
3. An offer may be edited while `DRAFT` and until the submission deadline. Submitted offers may be withdrawn before the deadline if policy permits; the withdrawal must be auditable.
4. The server must validate tender status, supplier verification, required documents, requirements, duplicate-offer policy, and deadline before accepting a submission.
5. Award publication must generate an award record, update the tender status, send relevant notifications, and make only the approved public award data visible.

### 7.3 Document Rules

Upload files through short-lived signed URLs. The backend must create a pending document record before upload, validate MIME type and size, queue malware scanning, and mark the document `VERIFIED` only after the scan and any staff review pass. Download links must be short-lived and access-controlled. Do not accept executable files or rely on client-side file extension validation.

---

## 8. REST API Contract

All endpoints use JSON except signed upload/download operations. Return machine-readable errors using the following baseline shape.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "تعذر حفظ العرض. تحقق من الحقول المطلوبة.",
    "fields": {
      "submissionDeadline": "انتهى موعد التقديم."
    },
    "requestId": "req_..."
  }
}
```

### 8.1 Authentication and Session Endpoints

| Method | Endpoint | Access | Required behavior |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Public | Create user and supplier registration request, queue verification email. |
| `POST` | `/api/v1/auth/login` | Public | Verify credentials, issue access token, set rotating refresh cookie. |
| `POST` | `/api/v1/auth/refresh` | Refresh cookie | Rotate refresh token and issue new access token. |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke current refresh token and clear cookie. |
| `POST` | `/api/v1/auth/verify-email` | Public | Verify one-time email code/token. |
| `POST` | `/api/v1/auth/forgot-password` | Public | Queue a reset message without revealing account existence. |
| `POST` | `/api/v1/auth/reset-password` | Public | Validate one-time reset token and replace password. |
| `GET` | `/api/v1/auth/me` | Authenticated | Return user, roles, scoped entity/supplier membership, and locale. |

### 8.2 Public Procurement Endpoints

| Method | Endpoint | Query/body | Response purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/public/home` | — | Landing statistics, featured tenders, latest announcements, entities, categories. |
| `GET` | `/api/v1/tenders` | `q`, `status`, `entityId`, `governorate`, `categoryId`, `publishedFrom`, `publishedTo`, `deadlineFrom`, `deadlineTo`, `sort`, `page`, `pageSize` | Paginated tender search and counts. |
| `GET` | `/api/v1/tenders/:reference` | — | Public tender record, documents, visible timeline, status, questions, award if published. |
| `GET` | `/api/v1/tenders/:reference/questions` | `page`, `pageSize` | Published anonymized questions and answers. |
| `GET` | `/api/v1/announcements` | `q`, `type`, `entityId`, `publishedFrom`, `publishedTo`, `page` | Public announcements. |
| `GET` | `/api/v1/entities` | `q`, `governorate`, `type`, `page` | Entity directory and public tender counts. |
| `GET` | `/api/v1/entities/:id` | — | Entity profile and public tenders. |
| `GET` | `/api/v1/awards` | `q`, `entityId`, `categoryId`, `dateFrom`, `dateTo`, `page` | Public award registry. |

### 8.3 Supplier Endpoints

| Method | Endpoint | Access | Required behavior |
| --- | --- | --- | --- |
| `GET` | `/api/v1/supplier/dashboard` | Supplier | Return metrics, tasks, matching tenders, and recent activity. |
| `GET` / `PATCH` | `/api/v1/supplier/profile` | Supplier admin/member | Read/update the caller’s organization profile within role limits. |
| `GET` / `POST` | `/api/v1/supplier/documents` | Supplier | List documents or create upload intent. |
| `POST` | `/api/v1/supplier/documents/:id/complete` | Supplier | Confirm upload; queue scan/review. |
| `GET` | `/api/v1/supplier/tenders` | Supplier | Saved, followed, eligible, and in-progress tender records. |
| `POST` / `DELETE` | `/api/v1/tenders/:reference/bookmark` | Supplier | Add or remove a tender bookmark. |
| `GET` / `POST` | `/api/v1/tenders/:reference/offers` | Supplier | List caller’s tender offers or create a draft. |
| `GET` / `PATCH` | `/api/v1/offers/:id` | Supplier owner | Read/update an offer draft. |
| `POST` | `/api/v1/offers/:id/submit` | Verified supplier | Run final eligibility checks and make offer immutable for the deadline state. |
| `POST` | `/api/v1/offers/:id/withdraw` | Supplier owner | Withdraw under defined policy and log the action. |
| `GET` | `/api/v1/notifications` | Authenticated | Paginated notification center. |
| `POST` | `/api/v1/notifications/read` | Authenticated | Mark selected or all notifications read. |

### 8.4 Government Staff and Administration Endpoints

| Method | Endpoint | Access | Required behavior |
| --- | --- | --- | --- |
| `POST` | `/api/v1/admin/tenders` | Publisher | Create a draft tender scoped to caller entity. |
| `PATCH` | `/api/v1/admin/tenders/:id` | Publisher / manager | Edit a draft or permitted amendment. |
| `POST` | `/api/v1/admin/tenders/:id/submit-review` | Publisher | Move draft to `PENDING_REVIEW`. |
| `POST` | `/api/v1/admin/tenders/:id/publish` | Reviewer / manager | Validate and publish tender with audit event. |
| `POST` | `/api/v1/admin/tenders/:id/cancel` | Manager | Cancel with required reason and notifications. |
| `GET` | `/api/v1/admin/tenders/:id/offers` | Reviewer / manager | View authorized offer metadata and documents. |
| `POST` | `/api/v1/admin/tenders/:id/award` | Manager | Record award, publish allowed public result, notify suppliers. |
| `POST` | `/api/v1/admin/announcements` | Scoped staff | Create public announcement. |
| `GET` | `/api/v1/admin/audit-logs` | Admin / auditor | Filtered immutable audit search. |

### 8.5 API Conventions

Paginated list responses should use this stable shape:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 2371,
    "totalPages": 119
  },
  "meta": {
    "requestId": "req_..."
  }
}
```

Use ISO 8601 timestamps in transport, UUIDs internally, and reference numbers such as `PAL-2026-001245` for public tender URLs and visual display. All write endpoints need request validation, authorization, audit logging, and structured error responses.

---

## 9. Frontend-to-Backend Binding Plan

### 9.1 Replace Prototype Data Deliberately

The current JSX files contain realistic static examples. Replace them module by module rather than performing a broad visual rewrite.

| Existing screen area | Replace static content with | Interaction result |
| --- | --- | --- |
| Landing statistics | `GET /public/home` | Values and supporting text update from current data. |
| Landing active tender cards | Featured tender collection | Cards retain layout; buttons route by returned `referenceNumber`. |
| Tender filters | Filter metadata plus `GET /tenders` | Query parameters mirror the selected fields and update the list. |
| Bookmark control | Bookmark endpoints | Optimistic UI update with rollback toast on failure. |
| Tender deadline card | Server timestamps and status | Countdown calculates in client but server remains source of truth. |
| Tender documents | Signed download endpoint | Permission-aware action and explicit unavailable/expired state. |
| Supplier dashboard | `/supplier/dashboard` | Replace hardcoded metrics, tasks, and opportunities. |
| Supplier profile/documents | Supplier endpoints | Save status, verification badges, document review states. |
| Offers | Offer list/detail endpoints | Display immutable status history and contextual action permissions. |
| Login and registration | Auth endpoints | Replace mock navigation delays with actual session handling. |

### 9.2 Client State and Error Handling

Use request hooks such as `useTenders`, `useTender`, `useSupplierDashboard`, `useNotifications`, and `useAuth`. Every hook must expose `{ data, isLoading, isRefreshing, error, refetch }`. Do not encode server state only in local component state. Keep local state for UI-only behavior: mobile menus, selected view style, advanced filter visibility, and uncontrolled form inputs before submission.

For authorization failure, direct unauthenticated users to `/login` with a safe `returnTo` path. For authenticated but unauthorized users, show a Civic Ledger permission state with an explanation and a path back to a permitted screen. Never silently hide a failed submission; retain field values and present the server response in Arabic.

---

## 10. Security, Privacy, and Reliability Requirements

| Area | Minimum implementation requirement |
| --- | --- |
| Transport | HTTPS only in deployed environments. |
| Session safety | Secure, `HttpOnly` refresh cookie; short access token; refresh rotation; server-side revocation records. |
| Authorization | Middleware that verifies session, role, resource ownership, and entity scope. |
| Input handling | Validate body, query, params, content type, and uploaded file metadata on the server. |
| File safety | Private storage, signed URLs, type/size allowlist, malware scan, expiry, audit download events. |
| Abuse protection | Rate limit login, reset, verification, question, upload-intent, and search endpoints. |
| Data protection | Do not include password hashes, token hashes, internal notes, private bids, or sensitive supplier records in public responses. |
| Auditability | Append audit records for tender publication, amendment, cancellation, offer submit/withdraw, document review, award, role change, and administrative access. |
| Logging | Use request IDs. Log error class, route, actor ID where safe, and elapsed time; redact secrets and personally sensitive fields. |
| Backups | Schedule database backups, test restoration, and version migrations. |

The public award registry must only publish the information approved for public disclosure. Supplier offer contents, evaluation notes, and private organization documents need explicit permission gates.

---

## 11. Background Jobs and Notifications

Use a server-side job runner. The frontend must never be responsible for deadline monitoring or sending notices.

| Job | Trigger | Audience | Action |
| --- | --- | --- |
| Tender opening notice | Tender published | Suppliers matching configured specialties | In-app notification; optional email. |
| Expiring tender reminder | Threshold before deadline | Suppliers with bookmark/draft offer | Notify according to 72h/24h policy. |
| Document expiry reminder | Configured time before expiry | Supplier admins | Ask user to refresh document. |
| Verification review reminder | Supplier pending review too long | Assigned staff | Create internal task/notification. |
| Award notice | Award published | Winning and participating supplier users | Send decision notification; respect disclosure policy. |
| Daily audit health check | Scheduled | Platform administrators | Flag failed jobs, unscanned uploads, or invalid lifecycle data. |

Store every queued job’s status, retry count, and last failure reason. Make notification sending idempotent so a job retry cannot create duplicate user alerts.

---

## 12. Implementation Sequence

1. **Prepare infrastructure.** Set up PostgreSQL, private object storage, environment secrets, Node.js service configuration, migrations, and a staging environment.
2. **Implement identity and authorization.** Build users, suppliers, roles, sessions, verification, reset, request context, audit log, and protected route middleware before offer or publishing workflows.
3. **Implement public read APIs.** Build entities, categories, tenders, tender detail, announcements, and awards. Bind the landing page and public pages to these APIs while preserving their existing JSX structure.
4. **Implement supplier onboarding.** Add supplier profile, verification review, specialties, documents, upload workflow, supplier dashboard, bookmarks, and notifications.
5. **Implement offers.** Add draft, upload, validation, submission, withdrawal, status history, and supplier offer screens.
6. **Implement staff workflows.** Add tender drafting, review, publication, amendment, cancellation, Q&A moderation, evaluation access, awards, and audit reporting.
7. **Harden and verify.** Add tests, rate limiting, scan flows, audit checks, error monitoring, accessibility checks, language testing, backups, and load testing.

### 12.1 Acceptance Criteria

| Area | Completion condition |
| --- | --- |
| Design fidelity | Existing routes remain visually consistent with the delivered Civic Ledger prototype at desktop, tablet, and mobile widths. |
| Public discovery | Search, filters, pagination, tender detail, entities, announcements, and awards read real API data. |
| Supplier security | A user sees only their supplier organization’s profile, documents, offers, and notifications. |
| Tender integrity | Submission is rejected server-side after the deadline or when supplier verification/required documents fail. |
| Publishing integrity | Tender lifecycle transitions are role-checked and audit-logged. |
| Document safety | Uploads use private storage, scan state, and short-lived authorized downloads. |
| Accessibility | Keyboard navigation, labels, focus states, contrast, RTL layout, and non-color status descriptions remain intact. |
| Reliability | Production build, migrations, health checks, structured logs, backup procedure, and error handling operate successfully. |

---

## 13. Instructions for a Future Builder

When this file is uploaded to another build session, use the following operating constraints.

> **Build instruction:** Extend the existing PalTenders React JSX project with a modular Node.js and Express backend. Preserve the exact Civic Ledger visual language, route map, Arabic-first RTL behavior, generated asset roles, and current responsive layout. Treat the frontend pages as finished visual designs. Replace only mock data and prototype-only actions with real API integration. Implement the REST contract, PostgreSQL data model, RBAC, file upload safety, audit logging, verification, notification jobs, and tender/offer workflows described in this document. Do not redesign screens, change brand colors, replace the Arabic typography, or introduce generic dashboard styling.

If an implementation decision is not explicitly described here, prefer the option that improves auditability, clear user feedback, least-privilege authorization, accessibility, and the existing public-record visual language.

---

## References

[1] [Current Civic Ledger design direction](./ideas.md)

[2] [Current JSX route map](./client/src/App.jsx)

[3] [Current Node.js server entry point](./server/index.js)
