# Etemad API reference

The API is served by the Express backend. In local development the base URL is `http://localhost:8000`; in production the browser uses the same public origin through Nginx. Protected requests send the JWT in the `Authorization: Bearer <token>` header.

## Authentication and access

The backend applies authentication, role, and organization-approval middleware in the route layer. A missing or invalid token is rejected before controller logic runs. Role-restricted routes return a forbidden response when the authenticated user does not have the required role.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register an organization or individual; organization and identity registrations may include a document |
| POST | `/api/auth/login` | Public | Authenticate and return the user and JWT |
| POST | `/api/auth/verify-email` | Public | Verify an email code |
| POST | `/api/auth/resend-verification` | Public | Request another verification code |
| POST | `/api/auth/forgot-password` | Public | Request a password-reset code |
| POST | `/api/auth/reset-password` | Public | Set a new password with a valid code |
| GET | `/api/users/me` | Authenticated | Return the current user |
| GET | `/api/users/me/chat-badge` | Authenticated | Return the current unread chat count |

## Administration

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/admin/organizations/pending` | Admin | List organizations waiting for review |
| PATCH | `/api/admin/organizations/:id/approve` | Admin | Approve a pending organization and trigger its notification |
| PATCH | `/api/admin/organizations/:id/reject` | Admin | Reject a pending organization and optionally store a reason |
| GET | `/api/admin/users` | Admin | List users with optional role or status filters |
| PATCH | `/api/admin/users/:id/status` | Admin | Update user status |

## Tenders and proposals

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/tenders` | Authenticated | Browse tenders with optional filters |
| GET | `/api/tenders/:id` | Authenticated | View tender details |
| POST | `/api/tenders` | Approved organization | Create a tender |
| PATCH | `/api/tenders/:id` | Tender owner | Edit an open tender |
| DELETE | `/api/tenders/:id` | Owner or admin | Close or cancel a tender |
| POST | `/api/tenders/:id/proposals` | Approved organization | Submit one proposal with a document |
| GET | `/api/tenders/:id/proposals` | Tender owner or admin | Review proposals for a tender |
| GET | `/api/proposals/:proposalId` | Submitter, owner, or admin | View one authorized proposal |
| PATCH | `/api/proposals/:id/status` | Tender owner | Accept or reject a proposal |
| PATCH | `/api/proposals/:id/price` | Authorized proposal owner | Update a proposal price when permitted |

## AI document analysis

AI routes use multipart form-data and validate the file before sending it to Gemini. The expected upload field names are important.

| Method | Path | File field | Access | Purpose |
|---|---|---|---|---|
| POST | `/api/auth/analyze-id` | `idDocument` | Public registration flow | Verify or extract identity-document information |
| POST | `/api/tenders/analyze-book` | `officialBook` | Approved organization | Extract a tender draft from an official book |
| POST | `/api/proposals/:id/analyze` | `document` | Approved organization | Analyze a proposal against tender requirements |
| POST | `/api/auctions/analyze-item` | `officialDocument` | Approved organization | Extract auction-item information |
| POST | `/api/proposals/:proposalId/review-ai` | Organization owner or admin | Re-analyze an existing proposal |

## Auctions and bids

Auction creation uses multipart form-data for images and optional official documents. The backend validates file signatures, ownership, status, timing, and bid rules.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/auctions` | Authenticated | Browse visible auctions |
| GET | `/api/auctions/:id` | Authenticated | View auction details and remaining time |
| POST | `/api/auctions` | Approved organization | Create an auction pending review |
| PATCH | `/api/auctions/:id` | Owner or admin | Update auction details or status |
| POST | `/api/auctions/:id/bid` | Authorized participant | Place a valid bid |
| GET | `/api/auctions/:id/bids` | Authorized participant | View bid history |

## Chat and negotiation

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/chat/requests` | Authenticated | List chat requests and conversations |
| POST | `/api/chat/requests` | Authorized participant | Request negotiation access |
| PATCH | `/api/chat/requests/:id` | Recipient | Approve or reject a request |
| GET | `/api/chat/messages/:proposalId` | Conversation participant | Load persisted messages |
| POST | `/api/chat/messages` | Conversation participant | Persist a new message |

Socket.IO then provides immediate room events for `join_negotiation`, `send_new_message`, `receive_new_message`, `mark_messages_read`, and `messages_were_read`. The database remains the source of truth.

## Health and static files

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Confirm that the Express process is reachable |
| GET | `/uploads/:filename` | Serve an uploaded document or image through the configured static path |

## Response and error conventions

Successful collection responses use named keys such as `{ tenders }`, `{ auctions }`, or `{ proposals }`. Expected failures use structured JSON rather than Express’s default HTML error page. The shared formatter in `server/config/error-response.js` maps malformed input to 400, invalid identifiers to 404, and unexpected failures to a generic 500 response while logging server details.
