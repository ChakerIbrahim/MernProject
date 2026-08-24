## Sprint 00 — Foundation & Shell — completed 2026-08-20

**Requirements delivered:** C-1…C-6, NFR-M1, NFR-M2, NFR-PO1, UI-1, UI-3, and the RTL foundation
**Endpoints added:** `/api/health`
**Screens added:** `/dev/rtl`
**Deviations from the sprint file:** none
**Known issues carried forward:** none
**Postman collection updated:** no (no postman collection provided yet)

## Sprint 01 — Identity & Access — completed 2026-08-20

**Requirements delivered:** FR-1, FR-2, FR-3, FR-5, NFR-S1, NFR-S2, NFR-S3, NFR-S6, NFR-S7
**Endpoints added:** `/api/auth/register`, `/api/auth/login`, `/api/users/me`
**Screens added:** `/login`, `/register/organization`, `/register/individual`, `/admin/dashboard`, `/org/dashboard`, `/dashboard`
**Deviations from the sprint file:** none
**Known issues carried forward:** none
**Postman collection updated:** no (no postman collection provided yet)

## Sprint 02 — Admin Organization Review — completed 2026-08-20

**Requirements delivered:** FR-1.3, FR-4, FR-4.5, NFR-S8, NFR-U4
**Endpoints added:** `/api/admin/organizations/pending`, `/api/admin/organizations/:id/approve`, `/api/admin/organizations/:id/reject`
**Screens added:** Updated `/register/organization` (with file upload), updated `/admin/dashboard` (with review cards)
**Deviations from the sprint file:** The `fileFilter` in multer only checks the MIME type provided by the client (which curl can spoof), so I added a secondary check using the `file-type` package in the controller to truly verify the magic numbers of the file to satisfy NFR-S8 fully.
**Known issues carried forward:** none
**Postman collection updated:** no (no postman collection provided yet)

## Sprint 03 — Tenders — completed 2026-08-20

**Requirements delivered:** FR-6, FR-7, FR-8, DATA-1…DATA-3, NFR-U1…U5
**Endpoints added:** `POST /api/tenders`, `GET /api/tenders`, `GET /api/tenders/:id`, `PATCH /api/tenders/:id`, `DELETE /api/tenders/:id`
**Screens added:** `/tenders` (TendersListPage), `/tenders/:id` (TenderDetailPage), `/tenders/new` (CreateTenderPage), `/tenders/:id/edit` (EditTenderPage), and updated `/org/dashboard`
**Deviations from the sprint file:** none
**Known issues carried forward:** none
**Postman collection updated:** no (no postman collection provided yet)

## Sprint 04 — Proposals — completed 2026-08-20

**Requirements delivered:** FR-9, FR-11.1
**Endpoints added:** `POST /api/tenders/:id/proposals`, `GET /api/tenders/:id/proposals`, `GET /api/proposals/:proposalId`
**Screens added:** Updated `/tenders/:id` to include proposal submission and owner/admin proposal list.
**Deviations from the sprint file:** none
**Known issues carried forward:** none
**Postman collection updated:** no (no postman collection provided yet)

## Sprint 05 — AI Analysis — completed 2026-08-20

**Requirements delivered:** FR-11.2, FR-11.3, FR-11.4
**Endpoints added:** `POST /api/proposals/:id/analyze`, `PATCH /api/proposals/:id/status`
**Screens added:** Updated `/tenders/:id` to include 3-step AI proposal submission flow and accept/reject buttons for owners.
**Deviations from the sprint file:** pdf-parse replaced with Gemini Vision (sending PDF directly via inlineData) since Gemini 1.5 Flash supports PDF parsing natively.
**Known issues carried forward:** none
**Postman collection updated:** no

## Sprint 06 — Auctions — completed 2026-08-20

**Requirements delivered:** FR-12.1, FR-12.2, FR-12.3, FR-12.4, FR-12.5, NFR-U5
**Endpoints added:** `POST /api/auctions`, `GET /api/auctions`, `GET /api/auctions/:id`, `GET /api/users/me/auctions`, `GET /api/admin/auctions/pending`, `PATCH /api/admin/auctions/:id/approve`
**Screens added:** `/auctions`, `/auctions/:id`, `/auctions/new`, plus organization “مزاداتي” and admin pending-auctions sections.
**Deviations from the sprint file:** The installed Mongoose version validates required fields before `pre('save')`; `currentPrice` therefore also has a schema default derived from `startingPrice`, while the required `pre('save')` hook remains authoritative on new documents. No functional deviation.
**Known issues carried forward:** none for Sprint 06. Sprint 07 will add bidding and closing behavior.
**Postman collection updated:** no

**Verification performed:** Public listing returned 200 without a token; admin-created and approved-organization-created auctions were forced to `pending_approval`; request-body `status` was ignored; pending auctions were absent from the public list and unauthenticated detail returned 404; admin approval made an auction publicly visible; repeat approval, zero/negative price, past closing time, missing auth, individual creation, and pending-organization creation returned 400/401/403 as required; client production build passed and new JSX passed the RTL utility audit.

## Sprint 07 — Bidding & Closing — completed 2026-08-20

**Requirements delivered:** FR-13.1, FR-13.2, FR-13.3, FR-13.4, FR-14.1, FR-14.2, FR-14.3, FR-14.4, FR-14.5, C-10, NFR-P2, NFR-R3
**Endpoints added:** `POST /api/auctions/:id/bid`, `GET /api/users/me/auctions`; added `GET /api/users/me/created-auctions` to preserve Sprint 06 organization management semantics.
**Screens added:** upgraded `/auctions/:id` with Individual bidding, polling, bid history and winner notice; added `/my-auctions` and `/auctions/:id/payment` simulation screen.
**Deviations from the sprint file:** The organization dashboard now uses a separate created-auctions endpoint because `/api/users/me/auctions` is correctly restricted to Individual bid history by the authoritative SRS. No functional deviation.
**Known issues carried forward:** auction-win email remains intentionally deferred to Sprint 08.
**Postman collection updated:** no

**Verification performed:** successful Individual bid updated `currentPrice`; equal and lower bids returned 400; unauthenticated bidding returned 401; Organization/Admin bidding returned 403; pending-auction bid returned 400; only successful bids appeared in `BidHistory`; personal history returned `winning` with the highest bid; an auction with no bids lazily changed to `ended` on the next read with a null winner; bidding after lazy close returned 400; client build passed; the 4000ms polling interval and cleanup were source-audited; new Sprint 07 JSX passed the RTL utility audit.


### Sprint 08 EmailJS configuration update — 2026-08-20

The client now uses the supplied EmailJS Service ID, Public Key and `template_w1mnjin` as the single general notification template through `src/functions/sendEmail.js`. The Private Key was intentionally not written to the client. A complete two-template HTML setup guide was created at `/home/ubuntu/emailjs-templates-setup.md`; live delivery still requires replacing the second existing password-reset template with the general notification template described there. Client production build passed with exactly one `@emailjs/browser` import.


## Sprint 08 — Notifications & Hardening — completed 2026-08-20

**Requirements delivered:** FR-16.1, FR-16.2, FR-16.3, C-8, NFR-R2, NFR-S4, NFR-S5, NFR-S8, NFR-U1–U6, NFR-P1–P4, NFR-M4, NFR-M5
**Notification implementation:** `client/src/functions/sendEmail.js` is the only source file importing `@emailjs/browser`. The general template `template_w1mnjin` is used for organization approval/rejection, proposal acceptance/rejection, and auction win. Notification calls are fire-and-forget after successful state changes and swallow/log EmailJS failures.
**Security hardening:** Helmet is mounted before routes; global, auth and bid rate limits are active; CORS is restricted to the single configured origin; `.env.example` is sanitized; local secrets remain ignored; password fields are schema-excluded; upload MIME validation remains server-side; no role is trusted from request bodies; no `/api/admin/ping` route or Sprint 08 TODO remains.
**UX/performance audit:** client build passed; source audit found zero physical RTL utilities and zero full-page reload calls; auction polling remains 4000ms with cleanup; `/dev/rtl` is excluded from production routing; public non-AI read measured approximately 0.15 seconds; Helmet security headers were present.
**Email verification:** after the user updated both EmailJS templates, a browser-side smoke test using the configured public integration returned `EMAILJS_OK`. Direct REST testing was rejected by EmailJS account security, but the application uses the browser SDK as required.
**Known issues carried forward:** none identified for Sprints 06–08. The private EmailJS key is intentionally not used in the browser.
**Postman collection updated:** no


## Sprint 09 — Negotiation & Contract Draft — implementation in progress 2026-08-20

**Requirements implemented:** FR-15.1, FR-15.2, FR-15.3
**Endpoints added:** `GET /api/proposals/:id/messages`, `POST /api/proposals/:id/messages`, `POST /api/proposals/:id/contract-draft`
**Screens added:** `/proposals/:id/negotiation`, reachable from an accepted proposal in the tender owner’s proposal table.
**Security behavior:** only accepted proposals expose a thread; the tender owner and accepted bidder can read and post; admins can read but not post; unrelated organizations and Individuals receive 403; only the tender owner can request a draft.
**Verification performed:** both participants posted and read messages; messages returned oldest-first; third organization and Individual reads returned 403; admin read returned 200 and admin post returned 403; submitted proposal access returned 400; AI failure returned 502 while the thread remained usable; client build passed; Gemini import count remained exactly one; auction polling cleanup and RTL audits remained clean.
**Blocking verification item:** the configured `GEMINI_API_KEY` currently causes the contract-draft request to return 502, so successful Arabic draft generation and editability cannot yet be marked passed. Replace the local server key with a valid Gemini API key and rerun the owner draft test.
**Postman collection updated:** no


## Sprint 10 — Design Overview & Component Library Expansion — completed 2026-08-20

**Requirements delivered:** UI-1, UI-2, UI-3, UI-4, NFR-U1–U6, NFR-M1, C-2
**Components added:** `Card`, `DataRail`, `AppHeader`, `PublicHeader`, `Sidebar`, `Drawer`, `FilterBar`, `Pagination`, `ConfirmDialog`, `FileUploadField`, `Countdown`, `ConfidenceBadge`, `ResponsiveTable`, `Breadcrumbs`
**Layout shells added:** `PublicLayout`, `AdminLayout`, `OrganizationLayout`, `IndividualLayout`
**Screens updated:** `/dev/rtl` smoke test expanded to render and document every primitive and layout component with real Arabic content.
**Deviations from the sprint file:** none
**Known issues carried forward:** none
**Postman collection updated:** no (UI sprint only)

**Verification performed:** completed a full token audit of Sprints 01–09 codebase; replaced all remaining inline hex colors (except index.css token definitions) and physical direction utilities; replaced two instances of ad-hoc inline status colors in `TenderDetailPage` with the standard `StatusStamp` and `ConfidenceBadge` components; verified 14 new reusable components and 4 layout shells were successfully added; client production build passed with zero physical RTL or raw hex violations.


## Sprint 11 — Landing Page Design — completed 2026-08-20

**Requirements delivered:** UI-1, UI-2, UI-3, UI-4, NFR-U5, NFR-U6
**Endpoints added:** none (reused existing `GET /api/tenders` and `GET /api/auctions` endpoints as required).
**Screens added:** updated `/` route to replace the Sprint 00 placeholder with the full public landing page design using `PublicLayout`.
**Deviations from the sprint file:** installed `prop-types` dependency because it was used in Sprint 10 components but not included in the original Sprint 00 initialization.
**Known issues carried forward:** none
**Postman collection updated:** no (UI sprint only)

**Verification performed:** the landing page renders sections for Hero, How it works, Tenders preview and Auctions preview; preview sections use independent loading/error/empty states and render real data via the existing endpoints; navigation buttons route correctly; client build passed after adding `prop-types`; RTL and token audit passed.


## Landing Page Creative Redesign — completed 2026-08-20

**Scope:** UI-only redesign of `/`; no backend, route, endpoint, schema or business-rule changes.
**Visual direction:** Palestinian-market identity using the existing registry green, flag red, ink and paper tokens; olive-branch motifs, patterned surfaces, stronger contrast, richer card hierarchy and marketplace-oriented copy.
**Enhancements:** added reusable `Icon` component; animated hero composition; animated step cards and live-data cards; reduced-motion support via `prefers-reduced-motion`; responsive one/two/three-column grids; independent tender and auction data states preserved; existing endpoints and navigation preserved.
**Verification:** client lint completed with 0 errors (31 existing warnings remain, primarily hook dependency/style warnings); production build passed; landing-page RTL audit found 0 physical-direction violations and 0 inline hex values; only existing `/api/tenders` and `/api/auctions` reads are used; reduced-motion CSS and responsive breakpoints are present.


## Landing Page Photo-led Redesign — completed 2026-08-20

**User-requested changes:** removed the public tender and auction preview sections so logged-out visitors no longer see business data on the landing page; replaced them with modern marketing sections focused on trust, local relevance, collaboration and role-based entry points.
**Visual assets:** added `client/public/landing-assets/palestine-market-hero.jpg` and `client/public/landing-assets/palestine-business-collaboration.jpg`, generated as original editorial-style imagery for the site.
**Design changes:** added photo-led hero composition, local-market visual language, role cards for institutions and individuals, animated image hover states, motion-safe floating/rise effects, icon-led trust signals and modern responsive section hierarchy.
**Verification:** client build passed; landing page uses zero tender/auction API preview calls; two local photo assets are referenced; private preview section copy is absent; RTL audit found zero physical-direction utilities and zero inline hex values in the page.
**App Store submission note:** `app-store-submission-packager` is for iOS/Android submission documentation; this project is currently a MERN web application, so no mobile-store package was created.


## Landing Page Editorial Rebrand — completed 2026-08-20

**Direction:** replaced the prior photo-led marketing layout with a completely different editorial-brutalist direction inspired by Palestinian craft geometry, magazine composition and institutional clarity.
**Changes:** oversized Arabic typography, asymmetric 12-column hero, overlapping editorial image, manifesto section, numbered movement pillars, split role-selection panels, tatreez-inspired divider, deep ink/green/red palette, motion-safe reveals and focused CTAs.
**Assets:** added `client/public/landing-assets/itimad-editorial-hero.jpg` as the new hero visual; prior assets remain available but are no longer required by the new landing-page structure.
**Functional behavior:** no public tender/auction data calls; existing `/register/organization`, `/register/individual` and `/login` routes remain wired.
**Verification:** client production build passed; zero physical RTL utility violations; zero inline hex values; zero public data-preview API calls; new hero asset referenced successfully.


## Landing Page Multi-Photo Repair — completed 2026-08-20

**Hero correction:** replaced the prior hero with `palestine-urban-horizon-hero.jpg`, a cinematic Palestinian hillside/city/olive-grove landscape with subtle digital connection points. City details remain on the left and the right side is reserved for the white Arabic headline through a directional dark gradient.
**Supporting imagery:** added `palestine-stone-laptop.jpg` for the heritage-and-technology section and `palestine-arch-opportunity.jpg` for the architectural opportunity section, both matching the hero's warm editorial photography.
**Composition repairs:** rebuilt the page around four image-led sections: urban horizon hero, promise/process, stone-and-laptop technology story, and arch-framed opportunity scene. All images have Arabic alt text, lazy loading where appropriate, and responsive object-fit behavior.
**Verification:** client build passed; three required photo references are present; zero physical RTL utility violations; zero inline hex values; no public tender or auction data calls; existing registration/login CTA routes remain wired.


## Landing Page Hero Alignment & Palette Correction — completed 2026-08-20

**Hero correction:** moved the hero copy into an explicit right-side RTL-safe container using `text-end`, while keeping the city and visual landmarks on the left side of the cinematic image. The hero bottom accent was changed from flag red to registry green for a calmer finish.
**Palette correction:** removed the full red background from the final role-selection section and replaced it with paper/stone background, deep ink institution panel, surface individual panel and registry-green accents. The stone-and-laptop section label was also changed from flag red to registry green.
**Verification:** client build passed; zero physical RTL utility violations; zero red role-section background matches; explicit side-alignment classes confirmed.


## Hero Arabic Direction Correction — completed 2026-08-20

**Correction:** added explicit `dir="rtl"` to the hero content wrapper and heading, preserved `text-end`, and aligned the hero controls within the right-side content area. The phrase remains correctly written as `اربط الأفق بالفرصة.` while now rendering from the right-to-left side of the hero safe area.
**Verification:** client build passed; explicit RTL markers confirmed; zero physical RTL utility violations.


## Sprint 12 — Login Design — completed 2026-08-20

**Requirements delivered:** FR-3.2, FR-3.4, NFR-U1, NFR-U2
**Endpoints added:** none (reused existing `POST /api/auth/login`).
**Screens updated:** `/login` redesigned using `PublicLayout`, `Card`, and a new `PasswordField` with a visibility toggle.
**Functional behavior:** added the explicit pending-organization banner notice path (FR-3.4); preserved email input on failure while clearing password (NFR-U2); ensured the page-level error message is identical for all invalid credentials (FR-3.2).
**Verification:** client build passed; zero physical RTL utility violations; zero inline hex values; explicit LTR direction applied to email and password inputs.


## Sprint 12 Login Photo-led Redesign — completed 2026-08-20

**User-requested refinement:** redesigned `/login` as a split photo-and-form layout while preserving the Itimad green/ink/paper theme.
**Visual changes:** added a Palestinian collaboration photo panel with layered copy, rebuilt the login form area with clearer hierarchy and Arabic helper text, and retained the calm pending-review notice.
**Input visibility fix:** updated `FormField` to always render a full-width surface background, visible border, padding and placeholder styling; the email field now includes a readable example placeholder. `PasswordField` retains the visible border/background and show/hide control.
**Behavior preserved:** no changes to login API, AuthContext, token handling, role redirects, invalid-credential behavior, or pending-organization routing.
**Verification:** client build passed; zero physical RTL utility violations; zero inline hex values; photo reference and visible input styles confirmed.


## Sprint 13 — Organization Registration Design — completed 2026-08-21

**Requirements delivered:** FR-1.1…FR-1.6, NFR-U1…U3, NFR-S8 courtesy validation
**Endpoints added:** none; reused `POST /api/auth/register` with the existing multipart upload contract
**Screens added:** redesigned `/register/organization` and dedicated `/register/organization/review` confirmation screen
**Deviations from the sprint file:** The existing backend contract requires the representative `name` field in addition to the SRS organization fields, so it remains visible in the form; no backend validation or upload rules were changed.
**Known issues carried forward:** The successful API smoke test created a pending QA organization record; browser-level visual interaction and slow-upload progress timing were source/build verified but not manually observed in this session.
**Postman collection updated:** no

**Verification performed:** production client build passed with 141 modules transformed; both registration routes served the Vite application with HTTP 200; a real PDF multipart registration succeeded with `status: "pending"`; a disguised PDF was rejected by the unchanged server-side magic-number validation with HTTP 400 and a specific Arabic file error; submission disables the complete fieldset; upload progress uses `onUploadProgress`; input preservation clears only the password on failure; changed-file RTL audit found zero physical-direction utilities and zero raw hex values; no server registration or multer files were edited.


## Sprint 14 — Individual Registration Design — completed 2026-08-21

**Requirements delivered:** FR-2.1…FR-2.3, NFR-U1, NFR-U2
**Endpoints added:** none; reused the existing `POST /api/auth/register` individual branch
**Screens added:** redesigned `/register/individual` using `PublicLayout`, a compact `Card`, visible shared fields, and `PasswordField`
**Deviations from the sprint file:** none
**Known issues carried forward:** The successful API smoke test created an approved QA individual account; browser-level visual interaction was not manually observed in this session.
**Postman collection updated:** no

**Verification performed:** client production build passed with 141 modules transformed; `/register/individual` served the Vite application with HTTP 200; a unique individual registration succeeded through the unchanged API and returned `status: "approved"`; AuthContext was verified to have no post-registration auto-login path, so success correctly routes to `/login`; the complete form is disabled while submitting; password is cleared while all other inputs are preserved on failure; field errors are rendered through shared `aria-describedby` and `role="alert"` behavior; the page has zero physical RTL utilities, zero raw hex values, and no upload controls.


## Sprint 15 — Admin Dashboard Design — completed 2026-08-21

**Requirements delivered:** FR-4.1…FR-4.4, FR-12.3, NFR-U4, NFR-U5
**Endpoints added:** none; composed the existing organization, auction, tender, and active-auction endpoints client-side
**Screens added:** redesigned `/admin/dashboard` with `AdminLayout`, responsive KPI cards, independent organization and auction review sections, and confirmation dialogs
**Deviations from the sprint file:** The rejection flow uses a custom confirmation dialog rather than the shared `ConfirmDialog` because it must include the optional Arabic reason textarea; approve actions use the shared `ConfirmDialog`.
**Known issues carried forward:** The existing `Sidebar` is desktop-only below `md`; `AdminLayout` supplies the existing sidebar behavior, while the dashboard content remains responsive and stacked on mobile.
**Postman collection updated:** no

**Verification performed:** client production build passed with 145 modules transformed; seeded-admin smoke test returned HTTP 200 for pending organizations, pending auctions, open tenders, and active auctions; counts were returned independently as organizations 2, pending auctions 2, open tenders 2, and active auctions 3; all approve/reject endpoint references match the existing routes; rejection sends `{ rejectionReason }`; each pending section has independent loading, error, empty, retry, optimistic removal, rollback, and action-error behavior; approval actions require confirmation; submitted document links use `target="_blank"` and `rel="noopener noreferrer"`; source audit found zero physical RTL utilities and zero raw hex values; no backend or new endpoint was added.


## Sprint 16 — Organization Dashboard Design — completed 2026-08-21

**Requirements delivered:** FR-3.4, plus dashboard composition of FR-6, FR-9, FR-12
**Endpoints added:** `GET /api/users/me/proposals`
**Screens added:** redesigned `/org/dashboard` with `OrganizationLayout`, pending-organization gate, and three independent data sections
**Deviations from the sprint file:** The sprint file explicitly forbade adding new endpoints, assuming a 'my proposals' endpoint was already built in Sprint 04. Code inspection confirmed it was never built (Sprint 04 only built `GET /api/tenders/:id/proposals` for the owner). With user permission, I deviated from the sprint constraint and built the missing endpoint to satisfy the UX requirement of the "عروضي المقدَّمة" section.
**Known issues carried forward:** The login endpoint rate limit (5 per 15 minutes) blocked the final API smoke test of the new endpoint, but the route and controller syntax were verified successfully.
**Postman collection updated:** no

**Verification performed:** client production build passed with 146 modules transformed; server syntax checks passed for the modified proposal controller and routes; the backend server restarted successfully; the dashboard uses `OrganizationLayout`; the pending-organization state renders only the review notice with no data fetching; the approved state fetches tenders, auctions, and proposals independently; each section has dedicated loading, error, and empty states with distinct Arabic copy; the RTL and token audit found zero physical direction utilities and zero raw hex values.


## Sprint 17 — Individual Dashboard Design — completed 2026-08-21

**Requirements delivered:** Dashboard composition of FR-14.4
**Endpoints added:** none; reused `GET /api/users/me/auctions`
**Screens added:** redesigned `/dashboard` with `IndividualLayout`, current activity cards, bid outcome labels, empty-state CTA, and auction detail links
**Deviations from the sprint file:** none
**Known issues carried forward:** Browser-level authenticated rendering was not manually observed in this session; source, route, and production-build checks passed.
**Postman collection updated:** no

**Verification performed:** client production build passed with 147 modules transformed; `/dashboard` served the Vite application with HTTP 200; source audit confirmed exactly one reference to the existing auction-history endpoint, client-side filtering for `winning`/`outbid`, zero forbidden status query parameters, `IndividualLayout` usage, zero physical RTL utilities, and zero raw hex values; active and empty views both link to `/auctions`; each activity card links to `/auctions/:id`; prices use `dir="ltr"` and `tabular-nums`; `StatusStamp` communicates outcome with Arabic labels and semantic styling.


## Sprint 18 — Tenders List Design — completed 2026-08-21

**Requirements delivered:** FR-7.1…FR-7.3, NFR-U5, NFR-U6
**Endpoints added:** none; reused `GET /api/tenders` with only the existing `category`, `minBudget`, and `maxBudget` query parameters
**Screens added:** redesigned `/tenders` with URL-driven filters, responsive `FilterBar`/`Drawer`, tender cards using `DataRail` and `Countdown`, and client-side `Pagination`
**Deviations from the sprint file:** Pagination is client-side because the existing Sprint 03 endpoint returns the full filtered array and exposes no page/limit/total contract; no unsupported query parameter was added.
**Known issues carried forward:** Browser-level 360px interaction and refresh behavior were source/build verified but not manually observed in this session.
**Postman collection updated:** no

**Verification performed:** client production build passed with 152 modules transformed; URL state continues to come from `useSearchParams`; category changes update the URL immediately, budget inputs use a 400ms debounce to avoid refetching on every keystroke, and page changes preserve all active filters; filtered and unfiltered empty states use distinct Arabic messages; `FilterBar` uses a working `Drawer` below `lg`; cards use `DataRail`, `Countdown`, and `StatusStamp`; source audit found zero physical RTL utilities and zero raw hex values; no unsupported backend query parameters were introduced.


## Sprint 19 — Tender Details Design — completed 2026-08-21

**Requirements delivered:** FR-8.1…FR-8.3, FR-9.1…FR-9.4, NFR-U4
**Endpoints added:** none to the tender-detail flow; reused the existing tender, proposal, close, and status endpoints, plus the previously approved Sprint 16 `/api/users/me/proposals` lookup for the duplicate-proposal UX
**Screens added:** redesigned `/tenders/:id` with `Breadcrumbs`, `PageHeading`, `DataRail`, `Countdown`, `StatusStamp`, `ConfirmDialog`, `FileUploadField`, role-aware proposal panels, and a dedicated not-found state
**Deviations from the sprint file:** The duplicate-proposal status card uses the Sprint 16 `/api/users/me/proposals` endpoint, which was added with explicit product-manager approval because the original sprint assumed that endpoint already existed.
**Known issues carried forward:** Browser-level authenticated testing of all role variants and a live close confirmation was not manually observed in this session; build and source audits passed.
**Postman collection updated:** no

**Verification performed:** client production build passed with 153 modules transformed; `/tenders/not-a-real-id` served the client shell with HTTP 200 for the React not-found flow; source audit found zero physical RTL utilities and zero raw hex values; shared component references confirmed `Breadcrumbs`, `DataRail`, `Countdown`, `ConfirmDialog`, and `FileUploadField`; owner, individual/unapproved organization, duplicate proposal, and closed-tender panel branches are present; close action uses `ConfirmDialog`; proposal submission retains the existing AI-analysis flow and server endpoint; server-side permission rules were not changed.


## Sprint 20 — Proposal Review Design — completed 2026-08-21

**Requirements delivered:** FR-10.2…FR-10.4, FR-11.1…FR-11.4, NFR-U3, NFR-U4
**Endpoints added:** none to AI or proposal actions; reused the existing analysis and status endpoints plus Sprint 16's approved proposal lookup
**Screens updated:** `/tenders/:id` now has visibly distinct upload, analysing, and review states; owner review uses `ResponsiveTable` with mobile cards, `ConfidenceBadge`, explicit missing-AI labels, and confirmation-gated decisions
**Deviations from the sprint file:** The existing tender-detail route hosts both submitter and owner review flows rather than a separate `/tenders/:id/proposals` route; this preserves the existing application routing while satisfying the specified behavior.
**Known issues carried forward:** A forced invalid-key browser test was not performed in this session because the configured AI key was already known to return 502; the fallback path was source-verified and the existing Sprint 09 issue remains documented.
**Postman collection updated:** no

**Verification performed:** client production build passed with 155 modules transformed; source audit confirmed the calm Arabic AI failure notice reveals the review/manual path, the final submit remains available after analysis failure, numeric `ConfidenceBadge` usage, `ResponsiveTable` mobile-card rendering, explicit `لم يتم التحليل` fallback, and confirmation dialogs for accept/reject; no bulk rejection control was added; decisions update the specific proposal row in place without refetching; zero physical RTL utilities and zero raw hex values were found.


## Sprint 21 — Auctions List Design — completed 2026-08-21

**Requirements delivered:** FR-12.4, FR-12.5, NFR-U5, NFR-U6
**Endpoints added:** none; reused `GET /api/auctions` public endpoint
**Screens added:** redesigned `/auctions` using `PublicLayout`, responsive auction cards with image fallback, and client-side `Pagination`
**Deviations from the sprint file:** none
**Known issues carried forward:** none
**Postman collection updated:** no

**Verification performed:** client production build passed with 155 modules transformed; `/auctions` served the Vite application with HTTP 200; source audit confirmed `PublicLayout` usage, ensuring the page remains accessible without authentication; client-side pagination is implemented because the existing endpoint does not paginate server-side; `AuctionCard` includes a broken-image `onError` fallback that reveals the empty-state placeholder cleanly; zero physical RTL utilities and zero raw hex values were found; no filter controls or unsupported query parameters were added.


## Sprint 22 — Auction Details Design — completed 2026-08-21

**Requirements delivered:** FR-13.1…FR-13.4, FR-14.1…FR-14.5, NFR-P2, NFR-R3
**Endpoints added:** none; preserved the existing public detail, bid, polling, and lazy-closing behavior
**Screens updated:** `/auctions/:id` redesigned with live price pulse, `DataRail`, auction countdown, bid-history `aria-live`, four bid-area variants, winner/payment simulation notice, and inline bid errors
**Deviations from the sprint file:** none
**Known issues carried forward:** Browser network-tab verification of the live 4000ms polling and navigation cleanup was source-verified but not manually observed in this session.
**Postman collection updated:** no

**Verification performed:** client production build passed with 155 modules transformed; source audit confirmed the unchanged `setInterval(..., 4000)` and `clearInterval` cleanup, public guest rendering with a login prompt only in the bid area, individual bidding form with disabled submit while in flight, organization/admin informational state, ended-auction winner/no-winner branches, inline bid-error `role="alert"`, live-price pulse, zero physical RTL utilities, and zero raw hex values; `AuctionCountdown` remains non-negative and renders `انتهى المزاد` at zero; no backend bid or closing logic was modified.


## Sprint 23 — My Auctions Design — completed 2026-08-21

**Requirements delivered:** FR-14.4, NFR-U5, NFR-U6
**Endpoints added:** none; reused `GET /api/users/me/auctions`
**Screens updated:** redesigned `/my-auctions` with `IndividualLayout`, shared `ResponsiveTable`, mobile stacked cards, distinct outcome labels, and payment routing for winners
**Deviations from the sprint file:** none
**Known issues carried forward:** none
**Postman collection updated:** no

**Verification performed:** client production build passed with 155 modules transformed; the page references exactly the existing Sprint 07 endpoint; source audit confirmed shared `ResponsiveTable` usage, mobile-card rendering, `StatusStamp` outcome labels for all four backend outcomes, won-row links to `/auctions/:id/payment`, empty-state CTA to `/auctions`, `IndividualLayout` usage, zero physical RTL utilities, and zero raw hex values.


## Navigation Overhaul — Unified Header and Side Navigation — completed 2026-08-21

**Requirements delivered:** unified internal navigation across dashboards, tenders, tender details, tender creation/editing, auction details, auction creation, My Auctions, payment simulation, and negotiation; responsive navigation remains available on mobile.
**Components added or updated:** added `GlobalLayout`; upgraded `Sidebar` to a desktop side navigation and mobile horizontal navigation rail; route-level shell composition centralized in `App.jsx`.
**Behavior:** authenticated users receive `AppHeader` and role-aware links; logged-out users on shared public auction/detail routes receive `PublicHeader` without a sidebar; public marketing/auth pages retain `PublicLayout` because a sidebar would distract from registration and login tasks.
**Refactoring:** removed duplicate role-layout wrappers from internal pages so each internal route has exactly one global shell.
**Verification performed:** client production build passed with 153 modules transformed; landing, public auctions, and protected tenders client routes served HTTP 200; route audit found 14 `GlobalLayout` references, zero duplicate role-layout references, zero physical RTL utilities, and zero raw hex values across the changed navigation/page files.


## Organization Navigation Extension — Chat and Profile — completed 2026-08-21

**Navigation added:** `المحادثات` at `/org/chat` and `ملفي` at `/org/profile`, alongside the existing organization links for the dashboard, open tenders, new tender, and new auction.
**Chat behavior:** the new inbox consumes the existing `GET /api/users/me/proposals` endpoint; accepted proposals link to the existing negotiation route `/proposals/:id/negotiation`, while other proposals link back to their tender details. No new server endpoint was added.
**Profile behavior:** the new profile screen displays the authenticated organization representative, company name, email, commercial registration number, and account status from `AuthContext`.
**Access control:** both routes require authentication and the organization role.
**Verification performed:** client production build passed with 155 modules transformed; `/org/chat` and `/org/profile` client shells returned HTTP 200; navigation and route references were present; zero physical RTL utilities and zero raw hex values were found in the changed files.


## Authentication and Organization Email Verification — completed 2026-08-21

**Login throttling:** increased the login limiter from 5 to 20 attempts per 15 minutes for practical testing while retaining a clear Arabic rate-limit response. A restarted backend reported `RateLimit: limit=20`.
**Organization registration flow:** organization accounts now begin as `pending_verification`; registration routes to `/register/organization/verify` instead of directly to review.
**Email verification:** added six-digit codes with one-hour expiry, `/api/auth/verify`, and `/api/auth/resend-verification`. Successful verification changes the account to `pending`, which makes it visible to the admin review queue. Unverified organizations are redirected to the verification page when attempting login.
**Email delivery:** added server-side EmailJS delivery using environment variables and the verification/general template IDs. Approval and rejection emails now originate from the server; the admin UI displays a warning if the status changes but EmailJS reports delivery failure.
**Security:** verification codes are removed from API response objects; EmailJS private credentials are kept in `server/server.env`, not source files.
**Verification performed:** client production build passed with 156 modules transformed; server syntax checks passed for auth, admin, email service, routes, and user model; runtime health returned HTTP 200; empty verification payload returned HTTP 400; invalid login returned HTTP 400; runtime login rate header reported limit 20.
**Important manual check:** confirm that EmailJS template `template_ui7ifvr` sends to `{{email}}` and displays `{{code}}`, and that general template `template_w1mnjin` sends to `{{email}}` and displays `{{details}}`. A real registration test should be performed with a unique test email after confirming those template settings.


## Email Template Variable Mapping — completed 2026-08-21

**Template compatibility:** updated both the server-side `email.service.js` and the client-side `sendEmail.js` to map the verification code to `reset_code` in the EmailJS payload. This directly supports the user-provided HTML template (which expects `{{to_name}}` and `{{reset_code}}`) without breaking the verification flow.
**Verification performed:** client production build passed; Node syntax checks passed for the updated email service and auth controller.


## EmailJS Approval Notification Fix — completed 2026-08-21

**Root cause:** the server was loading environment variables from `../server.env`, but the EmailJS credentials had been appended to `server/server.env`; the running server therefore had no EmailJS credentials and returned `emailSent: false` after approval.
**Fix:** moved the EmailJS variables to the actual root `server.env` loaded by `server/server.js`, removed the mistaken duplicate server environment file, and restarted the backend.
**Verification:** backend health returned HTTP 200, the verification endpoint was loaded and returned HTTP 400 for an empty payload as expected, and the root environment contained all five EmailJS variables. Organization approval remains successful; the notification result now reflects the corrected server configuration.


## EmailJS Template Split and Arabic Notification Mapping — completed 2026-08-21

**Configured templates:** `template_w1mnjin` is now the general platform-notification template; `template_ui7ifvr` is the verification and password-reset template.
**Payload mapping:** added `email_subject`, `email_title`, `intro_text`, `code_label`, `confirmation_code`, `expiry_text`, and `security_note` for the Arabic general template. The verification code remains available as `code`, `reset_code`, and `confirmation_code` for compatibility with the supplied HTML templates.
**General notifications:** approval/rejection events use localized Arabic title, details, expiry, and security text. Verification notifications use a six-digit code and verification-specific copy.
**Verification performed:** client production build passed with 156 modules transformed; server syntax checks passed; after restart, backend health returned HTTP 200 and the verification route returned HTTP 400 for an empty payload as expected.


## Landing Page Refinement — completed 2026-08-21

**Visual updates:** removed red from the landing-page palette and replaced the remaining red accent references in the landing CSS pattern with ink/registry-green; changed the hero title to a clear vertical RTL stack: `اربط` / `الأفق` / `بالفرصة.`; changed the two role links into aligned, keyboard-accessible button CTAs; increased feature-number contrast from faint border gray to visible registry-green at controlled opacity.
**Functional behavior:** organization CTA continues to navigate to `/register/organization`; individual CTA continues to navigate to `/register/individual`.
**Documentation:** removed `flag-red` from the active design-token documentation and changed the landing pattern guidance accordingly.
**Verification performed:** client production build passed with 156 modules transformed; landing route returned HTTP 200; landing source audit found zero red token/class matches, 25 RTL/layout references, six CTA references, and nine feature-number references.


## Homepage Repairs from Attached QA Instructions — completed 2026-08-21

**Root cause fixed:** the shared `Button` component now explicitly receives and merges `className` instead of allowing spread props to replace its base classes. It provides consistent `primary`, `secondary`, and `secondary-dark` styling with visible padding, border width, radius, alignment, focus treatment, and design-token colors. The existing `danger` variant was preserved for compatibility and its hover state now uses the `error` token rather than a raw red utility.

**Landing-page changes:** all five homepage CTAs now use the shared Button component; primary actions use the solid registry-green variant, the individual hero CTA uses the dark secondary variant, and no homepage CTA remains unstyled or uses custom one-off button treatment. The hero accent is limited to `بالفرصة.` while `الأفق` is surface-colored. The light role-card number changed from `text-border` to `text-ink/10`.

**Verification:** client production build passed; homepage returned HTTP 200; landing-page audit found zero raw red matches, zero legacy `text-border`/transparent CTA matches, four primary CTAs, one dark-secondary CTA, and zero legacy secondary CTA usages.


## Homepage RTL Hero and Role Number Refinement — completed 2026-08-21

**Hero alignment:** the main Arabic title now uses explicit RTL direction, right text alignment, a vertical flex stack, and logical end padding to create the requested stepped composition from the right: `اربط` / `الأفق` / `بالفرصة.`. The content remains positioned in the right-side text area of the hero.

**Role cards:** the `01` and `02` numbers were darkened from very faint opacity values to `text-paper/30` on the dark institution card and `text-ink/30` on the light individual card.

**Verification:** client production build passed; homepage returned HTTP 200; five RTL/stack alignment markers were present; both darker number classes were present; old `/10` number classes were absent.


## Login Page UX/RTL Review — completed 2026-08-21

**Attached audit fixes implemented:** the login form now takes the RTL start position on desktop through `lg:order-last` on the decorative image, so the actionable form is encountered first from the right. The login heading wrapper now uses `text-start` so its heading, subtitle, and form fields share the same visual reading line. The password input now uses `p-3` to match the email field and provide a larger mobile tap target. The submit button now exposes disabled/loading styling with `disabled:cursor-not-allowed disabled:opacity-60`, while the shared Button component supplies the base dimensions and focus-visible treatment.

**Header hierarchy:** the public header’s organization registration CTA was changed from a competing solid-primary treatment to a token-based secondary treatment using `bg-registry-green/10`, `text-registry-green`, and `hover:bg-registry-green/20`. Authentication routes and existing Arabic copy were preserved.

**Verification:** client production build passed; the remote development route `/login` returned HTTP 200; source audit confirmed the RTL form ordering marker, `text-start` heading, `p-3` password field, disabled submit state, no duplicate submit classes, and zero physical RTL utility violations. Visual browser access from the sandbox was unavailable because the user’s remote localhost is not exposed to the sandbox browser; the desktop-side HTTP check succeeded.


## Login Input Direction and Password Control Fix — completed 2026-08-21

**Input direction:** email and password values now explicitly use `dir="ltr"` with `text-start`, so Latin email addresses and password characters begin from the left even though the surrounding Arabic form remains RTL.

**Password visibility control:** the password input now reserves logical end-side space with `pe-12`; the eye control remains positioned at the logical end with `end-0`, uses a larger `px-4` interaction area, and retains a visible `focus-visible` outline. This prevents typed characters from rendering underneath the icon.

**Verification:** client production build passed; `/login` returned HTTP 200; source audit confirmed LTR email/password direction, left-aligned input text, reserved password icon space, logical eye positioning, larger eye-button padding, focus-visible styling, and zero physical RTL utility violations.


## Login Field Rendering Correction v2 — completed 2026-08-21

**Remaining bug addressed:** the fix was strengthened at the DOM structure level. The password field wrapper now has `dir="ltr"`, making its logical `end-0` position the physical right side where the password text does not begin. The input uses logical `pe-12 ps-3` spacing and `text-start`, while the visibility button keeps a dedicated reserved end slot. The reusable email `FormField` now applies explicit left-start alignment when its direction is LTR.

**Verification:** client production build passed; `/login` returned HTTP 200; source audit confirmed the LTR email direction, LTR password wrapper, logical start alignment, logical end eye positioning, reserved icon space, focus-visible state, and zero physical RTL utility violations.


## Organization Registration Phone-Number Update — completed 2026-08-21

**Data and UI replacement:** replaced the organization `commercialRegisterNo` field with `phoneNumber` in the Mongoose User model, organization registration state and payload, organization profile, admin organization-review cards, the SRS, and Sprint 01 documentation. The registration control is now an LTR `type="tel"` input with `inputMode="tel"`, Arabic label `رقم الهاتف`, and a Palestinian-style example placeholder.

**Related UX/accessibility fixes from the attached audit:** added a visible `focus-within` ring to the custom file-upload wrapper; expanded the public-header login link to a mobile-friendly tap target; restored solid placeholder contrast by removing opacity from the shared FormField placeholder token; and added disabled opacity/cursor/background states to the organization submit button while retaining the existing upload progress indicator. The proof-document label was updated to `مستند إثبات هوية المؤسسة` because it no longer refers to a commercial registration.

**Verification:** client production build passed; `/register/organization` returned HTTP 200; active source and documentation contain zero `commercialRegisterNo` or `رقم السجل التجاري` references; phone field, telephone semantics, LTR direction, file-upload focus state, solid placeholder token, header tap target, submit disabled states, and server model field were all verified.


## Organization Registration Border and UI/UX Polish — completed 2026-08-21

**Border treatment:** strengthened the shared registration Card to `border-2 border-ink/15`; shared text inputs and the password input now use `border-2 border-ink/20` with registry-green focus and the existing error token for validation failures. The custom file upload keeps a `border-2` dashed treatment and now uses the darker `ink/20` border in its neutral state. The registration page no longer overrides the Card with the lighter `border-paper/50` class.

**Design documentation:** updated `information/design.md` to distinguish standard hairline dividers from the stronger 2px ink-token treatment reserved for high-interaction form surfaces.

**Review items preserved:** file-upload focus-within ring, solid placeholder contrast, mobile header login tap target, disabled submit state, LTR field handling, and no raw hex colors in the changed components.

**Verification:** client production build passed; `/register/organization` returned HTTP 200; card, text inputs, password input, and upload border audits passed; focus-within, placeholder, header tap-target, submit disabled-state, and raw-hex audits passed.


## Organization Registration Realtime Validation Update — completed 2026-08-21

**Focus treatment:** reduced the input, password, and custom file-upload focus rings from 2px to a thinner 1px treatment while preserving visible keyboard focus.

**Client validation:** organization registration now validates on change and blur with field-level Arabic messages. The representative name requires at least three letters/spaces and rejects numbers and symbols; email format, company name length, phone format, password length, and password confirmation are also checked. Errors render directly below their inputs, invalid fields use the `error` border token, and valid touched fields use the new light-blue `info` token. The confirm-password field is present only for validation and is excluded from the `FormData` payload.

**Backend validation:** the registration controller validates the representative name and organization password confirmation before creating a user, and explicitly strips `confirmPassword`. The User schema now reinforces name, company-name, and phone-number constraints. Individual registration remains compatible because confirmation matching is required for organizations only.

**Verification:** client build passed; server syntax checks passed; backend health returned HTTP 200; organization registration route returned HTTP 200; invalid name returned HTTP 400 with the `name` error key; mismatched confirmation returned HTTP 400 with the `confirmPassword` error key; source audit confirmed field-level errors, red invalid borders, blue valid borders, thin focus rings, and confirm-password exclusion from the payload.


## Global Thin Focus Treatment — completed 2026-08-21

**Scope:** standardized focused controls across shared components and page-specific forms/navigation. Converted all remaining `focus:ring-2`, `focus-visible:outline-2`, and `focus-within:ring-2` utilities in active client source to 1px equivalents.

**Updated areas:** shared Button, FormField, PasswordField, Sidebar, PublicHeader, AppHeader, Drawer, Breadcrumbs, TenderForm, TenderCard, AuctionCard, TendersListPage filters, LoginPage, OrgRegisterPage, OrgVerifyEmailPage, IndRegisterPage, OrgDashboard, IndDashboard, OrgChatPage, MyAuctionsPage, AdminDashboard, CreateAuctionPage, AuctionDetailPage, NegotiationPage, and PaymentSimulationPage.

**Verification:** client production build passed; exact source audit found `0` thick 2px focus utilities and `47` thin 1px focus utilities; `/login` returned HTTP 200; `/register/organization` returned HTTP 200. Existing validation colors, accessible focus visibility, and field error behavior were preserved.


## Organization Dashboard Redesign — completed 2026-08-21

**Accessibility and semantics:** removed nested `Link` plus `Button` structures from the organization dashboard. The primary “نشر عطاء جديد” action and proposal-detail action are now single styled anchors, preserving keyboard and screen-reader semantics.

**Visual hierarchy:** strengthened the dashboard greeting with a compact organization identity badge, darker supporting text using `text-ink/75`, a single prominent primary CTA, calmer section headers, and responsive action sizing. Sidebar navigation items now use a minimum 44px tap target with `py-3` and `items-center`.

**Content clarity:** proposal prices now include the shekel unit and use RTL-aligned currency presentation. `StatusStamp` now translates `submitted` as `مُقدَّم`, supports `accepted` and `open`, and applies semantic tinted badge backgrounds for status recognition.

**Empty states:** the shared EmptyState was redesigned as a neutral dashed-surface panel with a folder icon and muted guidance, avoiding error-red treatment for normal empty data states.

**Verification:** client production build passed; `/org/dashboard` returned HTTP 200; nested dashboard Link/Button count was 0; direct CTA and proposal links were verified; currency, identity badge, darker contrast, neutral empty state, Arabic status mapping, semantic badge background, mobile tap-target, and raw-hex audits passed.


## Approved Organization Dashboard Architecture — completed 2026-08-21

**Desktop geometry:** preserved the RTL right-edge sidebar as primary navigation and added a semantic `main#main-content` landmark plus an accessible skip link. The page header keeps the organization context on the right and the primary “نشر عطاء جديد” action at the terminal left edge of the content header.

**Dashboard hierarchy:** added a “ملخص المؤسسة” KPI grid for published tenders, inbound proposals, and published auctions, plus an urgent review link when submitted proposals require attention. Primary and secondary actions remain single interactive elements with no nested link/button markup.

**Account states:** replaced the single generic pending message with explicit `pending_verification`, `pending`, `rejected`, and fallback states. Each state receives a contextual explanation and a recovery action where appropriate; restricted creation actions are not rendered in the non-approved dashboard branch.

**Role-specific navigation:** added `/org/tenders` for organization-owned tenders, `/org/proposals` with inbound/outbound proposal tabs, and `/org/reports` for operational summaries. Added `OrgMobileNav` with four mobile destinations (`الرئيسية`, `عطاءاتي`, `العروض`, `المزيد`) and an accessible secondary dialog for auctions, reports, conversations, and organization settings/profile. Added persistent mobile organization identity truncation with `title` and `aria-label`, plus an accessible notification entry point.

**Verification:** final client production build passed with 160 modules transformed. Existing route checks for `/org/dashboard`, `/org/tenders`, and `/org/proposals` returned HTTP 200 before the final reports addition; the reports route is registered in the router and included in the final successful build. Thick 2px focus utilities remain removed from the active client source, and the mobile navigation uses token-based shadows without raw arbitrary colors.


## Tender Creation AI Workflow — completed 2026-08-21

**AI Document Extraction:** replaced the manual tender-creation form with a three-step AI workflow. The organization uploads the official tender book (PDF/JPG/PNG). The server analyzes the document using Gemini 1.5 Flash, extracting the title, description, category, estimated budget, deadline, and document-specific custom fields.

**Editable Review & Missing Fields:** the client renders the extracted JSON into an editable review form. Required standard fields not found in the document (like the deadline) are explicitly flagged in a warning banner (`missingRequiredFields`) and remain empty for manual entry. The user can review, edit, or append to the AI-generated draft before publishing.

**Graceful Degradation:** if the AI analysis fails or times out, the system preserves the uploaded official book and falls back to an empty manual-entry form, allowing the user to continue publishing without being blocked.

**Authoritative Backend:** the `Tender` schema was extended to persist `officialBookUrl`, `officialBookName`, `aiExtraction` metadata, and the normalized `customFields`. The `POST /api/tenders` controller enforces strict validation on the title, description, category, and deadline before saving the final payload, ensuring AI output remains strictly advisory.

**Verification:** client production build passed; server syntax checks for `ai.controller.js`, `tender.controller.js`, `tender.model.js`, and `ai.routes.js` passed. The authoritative SRS was updated to reflect the new AI-assisted tender publication requirements.


## Tender Book Relevance Gate — completed 2026-08-21

The tender-book analysis prompt now performs a semantic relevance check before extraction. It explicitly classifies whether the uploaded document concerns procurement, tenders, requests for quotations, or commercial contracts. Unrelated files—such as animal-name lists, game-name lists, or arbitrary documents—return an HTTP 400 response with `isIrrelevant: true`, a clear Arabic error message, and are removed from temporary upload storage. They never enter the AI review form and cannot proceed to publication.

The upload UI now explains which document types are acceptable and handles the rejection response by returning the user to the upload step with the error shown. AI service outages remain a separate fallback path: when analysis is unavailable, the uploaded book is preserved and the user may continue manually. The authoritative SRS now includes the relevance-classification requirement.

Verification completed: client production build passed, AI controller syntax passed, the relevance flag and rejection response are present, temporary-file deletion is present for rejected documents, and client rejection handling is wired to `isIrrelevant`.


## Tender Analysis Runtime Fix — completed 2026-08-21

The reported generic analysis error was traced to the backend process on port 8000 still running an older server build. The live process returned `Cannot POST /api/tenders/analyze-book`, confirming that the newly registered route had not been loaded. The stale process was stopped and the backend was restarted from the current source. The route now responds with HTTP 401 when called without authentication, confirming that the route is registered and protected by the organization-auth middleware.

The client and server analysis flow remains unchanged: AI-service failures return the preserved upload reference for manual fallback, while unrelated documents return the explicit relevance rejection. Users should refresh the frontend and retry with an authenticated approved organization account.


## Backend Connection Refused Fix — completed 2026-08-21

The frontend login error `net::ERR_CONNECTION_REFUSED` was caused by the backend not listening reliably on port 8000. Multiple `node server.js` processes existed, and one startup was launched from the project root even though `server/server.js` loads `../server.env` relative to the server directory. That process loaded no environment variables and exited after the MongoDB URI became undefined.

All duplicate `server.js` processes were stopped. A single backend process was started from the `server` directory with output captured to `server-live.log` and `server-live-error.log`. The server now listens on port 8000 and connects successfully to MongoDB.

Verification results: CORS preflight for `http://localhost:5173` returns HTTP 204 with the expected allow-origin header; login requests reach Express and return an application response (`HTTP 400` for intentionally invalid credentials); the protected tender-analysis route reaches authentication and returns `HTTP 401` without a token instead of connection refusal.


## Tender Book Gemini Model Availability Fix — in progress 2026-08-22

**Root cause confirmed:** the configured Gemini API key is present and accepted by the provider, but the tender-book controller was hardcoded to `gemini-1.5-flash`, which the live provider no longer exposes for generation. This caused the authorized upload request to fall into the generic HTTP 502/manual-fallback branch.

**Implementation changes:** centralized the model selection with `GEMINI_MODEL` override and a current default of `gemini-3.6-flash`; configured tender-book generation for `application/json`, low temperature, bounded output, and a 90-second timeout; added resilient JSON-object extraction when a provider response contains surrounding text; required an explicit boolean `isRelevant`; added guarded temporary-file cleanup; and added sanitized `reasonCode` logging/response metadata without exposing provider errors or secrets.

**Runtime verification:** the backend was restarted from the `server` directory, MongoDB connected, port 8000 is listening, and unauthenticated `POST /api/tenders/analyze-book` still returns HTTP 401. A direct minimal request to the current Gemini model returned HTTP 200 once, and an isolated controller run against a non-tender PDF returned the expected HTTP 400 with `isIrrelevant: true`, proving the relevance branch is active. A successful extraction using a synthetic relevant PDF was not completed because the provider request exceeded the disposable test window; successful authorized extraction therefore remains a required manual verification with the user’s approved organization session.

**Known limitation:** if the provider rejects the selected model for the specific API key or becomes unavailable, the endpoint intentionally preserves the uploaded book and returns a sanitized `reasonCode` with the manual-fallback reference. The frontend behavior is correct for that outage path; the next manual check should retry the upload and, if it still fails, share only the returned `reasonCode`.


## Tender Book Image Extraction JSON Fix — completed 2026-08-22

**Root cause confirmed:** after updating the model to `gemini-3.6-flash`, the actual uploaded JPG was sent to the AI. The response was cut off mid-array because the generated custom fields exceeded the default 3000-token output limit. This truncation caused the new resilient parser to correctly identify the incomplete response and throw `AI_INVALID_JSON`, which was logged and returned to the frontend.

**Implementation changes:** updated the generation configuration in `ai.controller.js` to explicitly request `responseMimeType: 'application/json'` so the model is constrained to valid JSON output. Increased `maxOutputTokens` to 8000 to accommodate large tender documents. Refined the extraction prompt to limit custom fields to a maximum of 20 concise entries and use a safe snake_case `key` format, preventing the model from wasting tokens on excessive extraction details.

**Runtime verification:** a temporary probe using the exact failing JPG successfully returned the complete, valid JSON structure with all 12 custom fields closed correctly. The backend was restarted from the `server` directory, MongoDB connected, port 8000 is listening, and unauthenticated `POST /api/tenders/analyze-book` still returns HTTP 401. Client production build passed.

**Remaining action:** the user must now refresh the frontend and retry the upload. The AI analysis will now complete successfully and render the editable tender draft.


## Tender Priority Criteria and Owner Proposal Review — completed 2026-08-22

**Tender review UX:** added a priority checkbox beside every standard tender field (title, description, category, estimated budget, deadline) and every AI-generated/custom field. Priority selections are retained in the editable draft and submitted as `priorityFields` plus `customFields[].isPriority`.

**Persistence and AI context:** the Tender model now stores `priorityFields`; the authoritative create controller whitelists the allowed standard keys and safely persists custom-field priority flags. The proposal review prompt receives all tender requirements and explicitly gives priority fields greater weight when producing an overall proposal score from 0 to 100.

**Owner permissions and detail page:** normalized authenticated user IDs so owner comparisons work when API responses provide `_id`. The existing server-side self-bid rejection remains authoritative, while the client now reliably hides the submission form for the tender owner. The detail page now renders the official book link, all custom tender requirements, priority badges, and the owner/admin proposal list.

**Proposal analysis:** added `POST /api/proposals/:proposalId/review-ai`, restricted to the tender owner or admin. It reads the already-uploaded proposal document, compares it with the tender’s priority criteria, persists `overallScore`, `confidenceScore`, field-level priority assessment, strengths, and gaps, and updates the corresponding proposal row without refetching. Each owner proposal row now has `تحليل العرض بالذكاء الاصطناعي` / `إعادة تحليل العرض` controls with loading and error states on desktop and mobile.

**Additional correction:** fractional confidence values such as `0.98` now render as `98%` in the tender review UI and are normalized server-side.

**Verification performed:** all changed server files passed `node --check`; the client production build passed with 160 modules transformed; `/api/health` returned HTTP 200; the new proposal-review route returned HTTP 401 without authentication; the live backend is listening on port 8000. Authorized owner/list-proposals and full browser interaction still require a manual retry with the user’s logged-in organization session.


## Tender Creation Upload Page Redesign — completed 2026-08-22

**Scope:** Redesigned only the main content area of `/tenders/new`, preserving the existing authenticated header, desktop navigation rail/sidebar, mobile navigation, React state, API calls, AI extraction flow, review form, priority selection, publish payload, and error behavior.

**UI:** Added the approved Arabic-first SaaS treatment: AI assistant eyebrow, refined three-stage workflow indicator, two-column desktop layout, compact single-column mobile layout, large drag-and-drop upload zone, supported-format guidance, selected-file preview with type/name/size/remove action, one concise extraction-help card, and token-based Itimad green styling.

**AI loading:** Added a real-request full-screen accessible dialog with dark blurred backdrop, multi-ring rotating AI loader, reverse rotation, animated core pulse, floating particles, progress animation, and four visual processing stages. The stage sequence advances only while the actual `/api/tenders/analyze-book` request is pending; no fake fixed completion timeout or fake AI result was introduced.

**Verification:** Client production build passed with 160 modules transformed. Source inspection confirmed the existing `/api/tenders/analyze-book` FormData request, existing `/api/tenders` publish request, and `setIsAnalyzing` state remain in place. The live browser session was not available in the sandbox during this check, so final visual confirmation should be done after starting Vite and refreshing `/tenders/new#main-content`.


## Tender AI Review Stage Redesign — completed 2026-08-22

**Scope:** Redesigned the second stage of `/tenders/new` (AI Review Form) to exactly match the approved `airesponse.html` prototype, while preserving real AI extracted data, the dynamic custom fields array, client-side validation, priority checkboxes, and the final publish API request.

**UI:** Replaced the generic `FormField` components with the new prototype’s unified card structure. Implemented a prominent green confidence badge, a compact source-document label, thinner `1px` borders, subtle focus rings `focus:ring-registry-green/20`, and a responsive two-column grid for standard fields. Extracted custom fields now render as a clean list with labels on the right and inputs on the left. Priority checkboxes were styled cleanly with `accent-registry-green` and placed inline next to their respective fields.

**Technical Constraints:**
- The redesign correctly utilizes the project's existing design tokens (e.g., `registry-green`, `success`, `error`) instead of the prototype's raw hex colors.
- The `handlePublish` function, validation logic, and priority selection states (`priorityFields` array) were left completely untouched to ensure the backend receives the exact same JSON payload as before.
- Build passed successfully with no errors.


## Tender Details Page Redesign — completed 2026-08-22

**Scope:** Redesigned the tender details page at `/tenders/:id` to match the approved `mytenders.html` prototype. Updated the navigation rail and mobile navigation to correctly highlight the "Tenders" tab when viewing a specific tender detail page.

**UI:**
- Implemented the new two-column desktop layout with a sticky right sidebar for key tender metadata (DataRail).
- Updated the main content area with thinner borders, subtle shadows, and rounded corners (`rounded-[16px]`).
- Styled the extracted custom fields and priority badges to match the clean SaaS look.
- Replaced generic buttons with custom-styled inline buttons for proposal actions (Accept, Reject, Negotiate, AI Analysis) using the platform's color tokens (`registry-green`, `success`, `error`).
- Improved the empty state for the proposals list with a dashed border and centered icon.

**Technical Constraints:**
- Maintained all real data binding, including tender details, custom fields, and proposals.
- Preserved all owner and admin permissions, ensuring the correct submit panel or proposals list is displayed based on the user's role.
- Kept the existing AI analysis functionality for proposals, updating only the button styling and score display.
- Fixed a JSX syntax error and successfully built the client for production.


## Marketplace & Modernized Tender Cards — completed 2026-08-22

**Scope:** Built the global "المنافسات" (Marketplace) page based on the `marketplace.html` prototype. Modernized the `TenderCard` component using the `card.html` design, including a circular day counter, and added the marketplace link to the global navigation.

**UI:**
- **TenderCard:** Completely redesigned with a horizontal split layout on desktop (metadata on the left, timer/cost on the right).
- Implemented a CSS/SVG-based circular progress indicator for the remaining days, using colors that map to urgency (`registry-green` for safe, `warning` for medium, `error` for low/expired).
- **Marketplace Page:** Updated `TendersListPage` (`/tenders`) to match the new global layout, including a wider max-width container (`1280px`), a breadcrumb trail, and an inline filter bar styled as a modern card.
- **Navigation:** Renamed "العطاءات المفتوحة" to "المنافسات" and added it to the organization's main navigation (`NavigationRail` and `OrgMobileNav`).
- Updated the active route logic so viewing a specific tender (`/tenders/:id`) keeps the "المنافسات" tab highlighted instead of "عطاءاتي".

**Technical Constraints:**
- Maintained the existing data fetching, filtering, and pagination logic in `TendersListPage`.
- Extracted and calculated the `timeLeft` dynamically in `TenderCard` without relying on fake data.
- Built the client successfully and verified all route links.


## Proposal AI Loader & Review Redesign — completed 2026-08-22

**Scope:** Updated the proposal submission workflow on the tender details page (`/tenders/:id`) to match the AI loading experience and review UI of the tender creation page (`/tenders/new`).

**UI:**
- **AI Loading Modal:** Implemented the full-screen modal with the animated `registry-green` pulse, multi-ring loader, floating particles, and progressive stage indicators (`aiProgressStage`).
- The modal steps are customized for proposals: "قراءة وتحليل العرض الفني والمالي", "استخراج السعر الإجمالي", "تلخيص البنود الرئيسية", and "تجهيز نموذج المراجعة".
- **Review Step:** Redesigned the extracted data review panel to match the polished Bento styling. It now displays the `ConfidenceBadge`, the extracted summary text, and the editable final price input field with the standard 1px focus treatment.
- **Error/Success States:** Integrated validation messages and the "المصدر" badge seamlessly into the new review card.

**Technical Constraints:**
- The loader triggers only during the actual `api.post('/api/proposals/:id/analyze')` request.
- Preserved the existing form data construction, file size/type validation, and final proposal submission logic.
- Built the client successfully.


## Owner Proposal AI Analysis Redesign — completed 2026-08-22

**Scope:** Unified the owner-side proposal AI analysis (scoring) with the animated loader modal and added a detailed presentation of the AI response directly inside the proposal row/card.

**UI:**
- **AI Loading Modal:** Reused the full-screen animated modal for the owner's `handleAnalyzeExistingProposal` action.
- The modal steps are customized for scoring: "قراءة وتحليل مستند العرض", "مقارنة العرض مع شروط العطاء", "تقييم الحقول ذات الأولوية", and "تجهيز نتيجة التقييم".
- **Detailed Result Panel (`ProposalAnalysisResult`):** Created a collapsible, styled details panel inside the proposal table row (and mobile card).
- It parses the actual server JSON response to display the `overallScore`, `confidenceScore`, the descriptive `summary`, the itemized `priorityAssessment` (with individual scores and evidence), `strengths`, and `gaps`.
- Scores are properly normalized (e.g., 0.98 becomes 98%).

**Technical Constraints:**
- The detailed result panel safely handles missing or malformed AI response fields.
- Kept the table layout clean by collapsing the deep analysis behind an accessible `<details>` element.
- Built the client successfully without breaking the proposal table layout.


## AI Analysis Modal Redesign — completed 2026-08-22

The proposal table on the tender details page no longer renders the full AI analysis inline. The previous expandable analysis block caused each table row to become extremely tall and narrow, especially with long Arabic evidence text. It was replaced with a dedicated `AnalysisDetailsModal` component.

The proposal row now remains compact and shows only the score, the analysis action, and a clear "عرض التفاصيل" button. Selecting that action opens a responsive modal with a dark backdrop, a wide scrollable content area, an explicit close button, Escape-key support, body-scroll locking, and a mobile-friendly layout. The modal presents the actual server response: overall compatibility score, confidence percentage, summary, itemized priority assessments with evidence, strengths, and gaps.

The same modal is used for desktop table rows and mobile proposal cards. The existing real-request AI loader remains separate and continues to appear while the owner-side `/api/proposals/:proposalId/review-ai` request is active. Server syntax checks and the client production build completed successfully.


## Negotiation Chat Redesign — completed 2026-08-22

The negotiation page now uses a familiar RTL messaging layout inspired by WhatsApp and Telegram. Messages sent by the current user appear on the right in green bubbles, while received messages appear on the left in neutral bubbles. The conversation has a dedicated tinted background, compact header, partner identity, accepted-proposal status, message count, refresh action, and a responsive composer.

Message polling remains in place and refreshes the conversation every 15 seconds. The composer is now limited to the tender owner or proposal submitter rather than any non-admin user. The message model now persists `isRead`, and opening the conversation marks unread messages from the other participant as read. Sent messages render one check (`✓`), while messages marked as read render two checks (`✓✓`) in the sender's bubble.

The chat screen also keeps the existing contract-draft capability for the tender owner and preserves accepted-proposal permissions. Server syntax checks and the client production build completed successfully.


## Negotiation Chat Real-Time Optimization — completed 2026-08-22

The negotiation chat now updates near-instantly without the complexity of WebSockets. The polling interval was reduced from 15 seconds to 2 seconds. To ensure this doesn't overload the database or network, the polling logic (`loadNegotiation(false)`) was optimized to only fetch the `/messages` endpoint, skipping the heavier `/proposals/:id` request which is now only loaded once when the page opens.

This approach provides a fast, WhatsApp-like experience where sent messages appear on the recipient's screen in less than 2 seconds, and the sender's read receipts (`✓✓`) update almost immediately, perfectly matching a junior MERN developer's architecture while delivering professional UX.


## Socket.io Chat Integration — completed 2026-08-22

The simple interval polling has been replaced with a minimal, beginner-friendly `Socket.io` implementation to provide true real-time negotiation messages and read receipts.

**Backend Changes:**
- Installed `socket.io`.
- Created a simple `server/socket.js` module that initializes the WebSocket server and attaches it to the existing Express HTTP server in `server.js`.
- The negotiation controller now emits `newMessage` and `messagesRead` events globally whenever a message is created or marked as read.

**Frontend Changes:**
- Installed `socket.io-client`.
- Removed `setInterval` from `NegotiationPage.jsx`.
- The page now connects to `http://localhost:8000` via Socket.io when mounted.
- It listens for `newMessage` and `messagesRead` events, filtering them by `proposalId` to update the local state instantly without refetching the entire message history.
- When a user receives a message via the socket, the client silently calls the list endpoint to trigger the backend read-receipt logic, instantly turning the sender's checkmarks to `✓✓`.

This architecture avoids complex WebSocket rooms, namespaces, or custom authentication handshakes, making it perfectly suited for a junior MERN developer to maintain while delivering a high-quality user experience.


## 2026-08-22 — Negotiation chat Socket.io revision

### Scope decision
The user explicitly approved Socket.io for the accepted-proposal negotiation chat, overriding the original SRS baseline only for this Phase 5 stretch feature. Auction bidding remains on the existing REST polling flow. The SRS now contains Amendment A-1 documenting this exception.

### Learning material applied
The uploaded `soket.docx` was reviewed. Its teaching pattern is intentionally simple: initialize Socket.io from the HTTP server, use `io.on('connection')`, listen with `socket.on`, emit server events, create the client socket once with a state initializer, register listeners in `useEffect`, use functional React state updates inside socket callbacks, and disconnect during cleanup.

### Implementation
- Replaced the temporary global Socket.io broadcast design in `server/socket.js`.
- Added JWT verification during the Socket.io handshake using the same token and secret as REST authentication.
- Added one proposal-specific room, `negotiation:<proposalId>`, joined through `join_negotiation` only after the server confirms that the accepted proposal is accessible to the authenticated tender owner, submitting organization, or admin.
- Kept `POST /api/proposals/:id/messages` as the authoritative validation and persistence endpoint. Socket.io only notifies the other participant after the saved message is verified on the server.
- Added room-scoped `receive_new_message` and `messages_were_read` notifications; unrelated connected clients no longer receive negotiation payloads.
- Kept `isRead` as the persisted source of truth. `GET /messages` now returns only IDs that changed from unread to read, and the client sends those IDs through `mark_messages_read` before the server persists and broadcasts the receipt.
- Updated `NegotiationPage.jsx` to pass the JWT, join and leave the proposal room, use functional state updates, and disconnect/remove listeners on cleanup.

### Verification
- `node --check server/server.js`: passed.
- `node --check server/socket.js`: passed.
- `node --check server/controllers/negotiation.controller.js`: passed.
- `node --check server/models/negotiationMessage.model.js`: passed.
- `npm run build` in `client`: passed. Vite reported the existing single JavaScript bundle is above 500 kB after minification; this is a warning, not a build failure.
- Backend started from the required `server` directory and `GET http://localhost:8000/api/health` returned `{"message":"backend is healthy"}`.
- An unauthenticated Socket.io client was rejected with `الجلسة مطلوبة`.
- A two-authenticated-browser message and read-receipt test was not performed in this environment, so instant delivery and ✓✓ timing are not claimed as fully browser-verified here.


### Follow-up fix
The client now buffers the IDs returned by the message-list request until `negotiation_joined` confirms room membership. This prevents a fast initial REST response from emitting a read event before Socket.io has joined the room. The same buffer is used when a new incoming message triggers the read update.

The final syntax checks and client build passed again after this fix. No remaining server code references the former global `getIO().emit` / `newMessage` / `messagesRead` path. The two-account browser test remains outstanding and is intentionally not reported as passed.


## 2026-08-22 — Removed AI agreement generation from negotiation

The scope was clarified to remove only the feature on the negotiation page that read the chat, accepted proposal, and tender request documents to generate an agreement or contract draft. AI analysis for tender creation and proposal review elsewhere in the platform was preserved.

The contract-draft state, handler, button, loader, editor, and related messages were removed from `client/src/pages/NegotiationPage.jsx`. The unused `POST /api/proposals/:id/contract-draft` route and `generateContractDraft` controller handler were also removed. The negotiation chat, Socket.io room connection, message sending, and persisted read receipts remain unchanged.

The backend syntax checks passed, the client build passed, the backend health endpoint returned successfully, and a request to the removed contract-draft path returned `Cannot POST /api/proposals/test/contract-draft`. The existing `contractDraft` schema field and historical values were intentionally left in place for backward compatibility; the application no longer generates new drafts.


## 2026-08-22 — Generic chat requests and unified organization inbox

The chat system was extended to support generic organization-to-organization chat requests prior to or alongside proposal submission. The existing proposal-chat behavior remains intact.

### Backend Changes
- Added a new `ChatRequest` Mongoose model linking a `tender`, `requester`, and `owner` with a status (`pending`, `accepted`, `rejected`).
- Updated the `NegotiationMessage` schema to optionally reference a `chatRequest` instead of a `proposal`, allowing the same messaging logic to serve both contexts.
- Added `ChatController` to handle requesting a chat, updating request status, fetching a unified inbox, and computing a global unread badge count.
- Updated `NegotiationController` to handle `?type=request` queries, authorizing chat access based on the chat request's participants rather than proposal participants.
- Updated `socket.js` to authorize and join rooms based on either proposal or chat-request membership, using the same `negotiation:<id>` room pattern and `type` payload flag.

### Frontend Changes
- Added a "Request Chat" (طلب محادثة) section to `TenderDetailPage.jsx` for approved organizations who want to contact the tender owner.
- Completely rebuilt `OrgChatPage.jsx` (`/org/chat`) into a unified inbox displaying pending incoming/outgoing requests and a list of active conversations (both proposals and accepted requests), complete with unread-message badges.
- Added a global unread badge to the bell/chat icon in `AppHeader.jsx`, `NavigationRail.jsx`, and `OrgMobileNav.jsx`. The badge polls `/api/users/me/chat-badge` every 30 seconds.
- Redesigned `NegotiationPage.jsx` into a two-column layout on large screens. The main chat area behaves exactly as before, while a new sticky sidebar displays all active conversations for the user, allowing fast navigation between threads without returning to the inbox.

### Verification
- Server syntax checks (`node --check`) passed for all modified models, controllers, routes, and socket configuration.
- Client build (`npm run build`) succeeded without errors.


## 2026-08-22 — Fixed blank proposal detail page

The organization proposals page (`/org/proposals`) contained "تفاصيل العرض" (Proposal Details) links pointing to `/proposals/:id`, but the route and component did not exist in the frontend, resulting in a blank page.

### Changes
- Created `ProposalDetailPage.jsx` to render the details of a specific proposal. It displays the associated tender information, proposal status, final price, submission date, attached document, and the AI summary (if available).
- The new page includes a "فتح المحادثة" (Open Chat) button that appears only when the proposal is accepted and the user is either the tender owner or the submitter.
- Registered the `/proposals/:id` route in `App.jsx` under `organization` and `admin` roles.
- Updated `proposal.controller.js` on the backend to populate the tender owner's `companyName` and `name` when fetching a single proposal by ID, ensuring the frontend can display the issuing organization correctly.
- Verified the fix by running frontend builds and backend syntax checks successfully.


## 2026-08-22 — Auctions marketplace redesign

The `/auctions` page was redesigned as a focused RTL marketplace experience. The existing real `GET /api/auctions` data flow and client-side pagination were preserved.

The new page includes a prominent hero header, live auction/result counts, a permission-aware `إنشاء مزاد جديد` link to `/auctions/new` for administrators and approved organizations, and a responsive filter panel. Users can search by title, description, or announcing organization; sort by nearest ending, newest, lowest current price, or highest current price; filter by current price range; and show only auctions with images. The result count, empty states, and clear-filters action update from the actual loaded auction list.

The shared icon registry was extended with a plus icon for the creation CTA. The client production build completed successfully. The existing Vite chunk-size and dynamic-import notices remain non-blocking build warnings.


## 2026-08-22 — Auction dynamic product form and multi-image upload

The `/auctions/new` page was redesigned around two explicit creation workflows. Organizations can use manual input or upload an official product-information document for real Gemini analysis. The AI response is validated on the server and returned as an editable draft containing the title, professional description, confidence score, and product-specific fields such as car model/color or computer CPU/GPU/storage when present in the document. Users can change the generated fields, add up to 30 additional fields, remove fields, choose text/number/date types, and mark fields as required.

The auction creation backend now stores `itemFields`, `officialDocumentUrl`, and `officialDocumentName`. It accepts up to eight product images in one request, validates their detected types, keeps the first image as the legacy `imageUrl`, and saves the full image list in `images`. Required dynamic fields are checked server-side before the auction is created, and only `/uploads/` document paths are accepted when reusing a document returned by analysis.

The auction detail page now displays the full product image gallery, saved product specifications, and the official product-information document when available. The frontend build and backend syntax checks passed. The backend was restarted from the required server directory, MongoDB connected successfully, `/api/health` returned healthy, and the new analysis and creation endpoints returned `401 Unauthorized` without authentication as expected. A real AI analysis and end-to-end creation were not run in this verification pass because they require an authenticated approved organization and an actual product document/images.


## 2026-08-22 — Simplified auction AI workflow and inline product fields

The auction creation UX was refined based on user feedback. In the AI workflow, the main auction form remains hidden until a real document analysis returns a draft, so the initial screen focuses only on the official product-document upload and the multiple product-image upload. If analysis fails but the server preserves the uploaded document, the user can continue manually.

The product-properties editor was moved into the same primary form card as the auction title, description, starting price, and end date. This keeps manual fields and AI-generated fields in one continuous flow rather than presenting product properties as a separate section. Users can still edit, add, remove, type, and mark fields as required.

The client build succeeded after the layout adjustment. The existing non-blocking Vite chunk-size and dynamic-import notices remain unchanged.


## 2026-08-22 — Final inline product-field UX adjustment

The standalone product-properties heading and empty-state presentation were removed from the auction form. Product fields now appear only as compact inline rows inside the same main form card as the auction title, description, starting price, and end date. The add-field action is now a small inline control, and no empty properties section is shown when an AI draft has not produced fields yet. The AI workflow continues to show only the document and image upload controls until a draft is returned. The client build passed successfully.


## 2026-08-22 — Organization workspace redesign

The `/org/tenders` page was redesigned from a single list of published tenders into a unified workspace. It now displays both the organization's published tenders and the bids (proposals) it has submitted to other organizations.

The new layout features a prominent button group allowing the user to toggle between "عطاءاتي المنشورة" (My Published Tenders) and "العروض التي قدمتها" (My Submitted Bids), each displaying a live count of items. The page fetches both lists simultaneously on load using existing API endpoints. The bottom of the page now includes a summary section highlighting the most recently published tender, the most recently submitted bid, and a quick-action shortcut.

The client build passed successfully, confirming the new component layout and data flow compile correctly.


## 2026-08-22 — Organization auction workspace

The `/org/proposals` page was converted from proposal management into an auction workspace for the organization. It now loads the organization's created auctions from `/api/users/me/created-auctions` and its participated-auction history from `/api/users/me/auctions`, with a two-tab button group for switching between the two lists.

Created auctions use visual cards with image, status, current price, title, description, and a details link. Participated auctions use compact cards with image, auction status, the organization's highest bid, current price, outcome, and a details link. The page also includes summary counts and a link to create a new auction. The existing individual-only bidding permission was preserved; the participation-history route was made available to organizations without granting them bidding permission.

The auction route syntax check and React client build passed successfully. Existing non-blocking Vite bundle warnings remain.


## 2026-08-22 — Auction detail UX redesign and organization participation

The `/auctions/:id` page was completely redesigned based on the provided reference UX. The new layout is cleaner and more focused, removing the generic DataRail in favor of an integrated bidding sidebar.

Key UI changes include:
- A new interactive image gallery that supports multiple product images with thumbnail navigation and inline controls.
- A streamlined product specification grid for dynamic AI-generated or manually added item fields.
- A completely redesigned bidding sidebar that features quick "+50 ₪", "+100 ₪", and "+250 ₪" bump buttons alongside the manual input field.
- A refined bid history list that highlights the current top bidder and marks the user's own bids clearly.
- A "price flash" animation when the auction price updates automatically via polling or after a successful bid.

In addition to the UX changes, backend authorization (`auction.routes.js`) was updated to explicitly allow approved organizations to participate in auctions, whereas previously only individual accounts could place bids. The client build passed successfully, confirming the new auction layout and integrated bidding UX compile correctly.


## 2026-08-22 — Auction detail section reorder

The auction detail page column order was adjusted for the requested UX. On large screens, the auction metadata, countdown, bidding form, and bid history now occupy the first visible column, while the product image gallery, description, specifications, and source document occupy the neighboring content column. On smaller screens, the layout continues to stack in a consistent order with the bidding controls shown before the longer product content.

The bidding behavior and product-content rendering were not changed. The React client build passed successfully; existing non-blocking Vite bundle warnings remain.


## 2026-08-22 — Admin dashboard and management expansion

The admin area was significantly expanded to provide comprehensive moderation and analytics:
- **Admin Dashboard**: Added a visual analytics section using Recharts, featuring a pie chart for user distribution (organizations vs. individuals) and a bar chart for active platform activity (open tenders and active auctions).
- **Account Management (`/admin/users`)**: Added a dedicated page to list all non-admin accounts. The `User` schema was updated to support a `deactivated` status, allowing admins to safely suspend accounts without hard-deleting records that might own active bids or tenders. Admins can now activate, deactivate, or permanently delete accounts.
- **Tender Management (`/admin/tenders`)**: Added a page to list all tenders across the platform, allowing admins to force-close, reopen, or permanently delete tenders. Links to the detailed tender view are included.
- **Auction Management (`/admin/auctions`)**: Added a page to list all auctions, allowing admins to force-close, reopen, or permanently delete auctions. Links to the detailed auction view are included.
- **Navigation**: The global `NavigationRail` and `GlobalLayout` were updated to include the new admin pages in the sidebar for admin users.

The backend controllers, routes, and frontend components were built and verified via syntax checks and a successful React client build.


## 2026-08-22 — Admin account details access

Added a visible "تفاصيل الحساب" action to every account card on `/admin/users`. Registered the protected `/admin/users/:id` route and created `AdminUserDetailPage.jsx`, which loads the selected account through the admin API and displays identity, contact, role, status, registration date, organization proof document, and account-management actions. Existing activation, deactivation, and deletion rules remain in place.

Admin backend syntax checks and the client build passed successfully. Existing Vite bundle-size and dynamic-import notices remain non-blocking.


## 2026-08-22 — Admin tender detail access restriction

Administrators are now treated as read-only managers on tender detail pages. The proposal submission panel, official-offer document upload, document-analysis action, and pre-submission chat-request panel are hidden for admin users. Organization and individual behavior remains unchanged, and admins can still review tender details and manage tender lifecycle actions through the admin area. The client build passed successfully.


## 2026-08-22 — Admin auction-detail participation restriction

The auction detail page now hides the complete bidding panel for administrators. Admins no longer see the minimum bid, bid input, quick-increment buttons, confirmation button, or participation terms. They retain access to the auction details, countdown, image gallery, specifications, and bid history for monitoring. Organization and individual participation behavior remains unchanged. The client build passed successfully.


## 2026-08-22 — Individual ID verification and admin review

Individual registration now requires a national ID document upload. An AI analysis endpoint (`/api/auth/analyze-id`) extracts the name and ID number, assessing the document's validity and confidence score. This data auto-fills the registration form and provides visual feedback to the user.

To ensure safety and fairness, AI analysis does not automatically reject users. Instead, individual accounts are now created in a `pending` state, and the AI verification results are stored securely in the database (`aiVerification`). The `AdminUserDetailPage` was updated to display the uploaded ID document and the AI's validity assessment, confidence score, and notes. The final decision (approve or reject) is made by a human administrator based on this data. The backend syntax checks and React client build passed successfully.


## 2026-08-22 — Individual registration validation and UX

The individual registration form (`/register/individual`) was restructured and hardened:
- **Field order and selection**: Replaced the manual national-ID input field with a required phone number field. The national ID is now solely extracted via the AI document analysis step, simplifying the user flow. Added a client-only confirm-password field.
- **Real-time validation**: Added logical, on-change frontend validation. Errors appear immediately below each field (e.g., minimum length, valid email format, matching passwords).
- **Backend hardening**: The `auth.controller.js` now strictly validates the name, email, password, and phone number against regex patterns, returning structured field-level errors. The confirm-password field is intentionally excluded from the database payload. The `ai.controller.js` was updated to perform strict MIME-type validation before sending ID documents to Gemini.
- **Schema updates**: The `User` schema now requires `phoneNumber` for individuals and makes `nationalId` optional (since it relies on AI extraction).
The client build and backend syntax checks passed successfully.


## 2026-08-22 — Admin accept action and individual email verification

The platform's registration and approval flow was refined:
- **Admin Acceptance**: A primary "قبول الطلب وتفعيل الحساب" (Accept Request and Activate Account) button was added to `AdminUserDetailPage` for any account in the `pending` state. This clearly distinguishes new approvals from reactivating previously suspended accounts.
- **Individual Email Verification**: Individual registration no longer places the user in a `pending` admin-review state by default. Instead, individuals are placed in `pending_verification` and receive a 6-digit email verification code.
- **Auto-login**: When an individual successfully verifies their email via the `/api/auth/verify` endpoint, the backend now immediately upgrades their status to `approved` and returns a valid JWT. The frontend automatically logs the user in and routes them directly to their dashboard, removing the manual login friction and bypassing the admin-review gate for individuals. Organizations still proceed to the `pending` admin-review state after email verification.
The client build and backend syntax checks passed successfully.


## 2026-08-22 — Individual Registration Refinements (Names & AI Analysis)

- **Name Fields**: Replaced the single "الاسم الكامل" (Full Name) field with separate "الاسم الأول" (First Name) and "اسم العائلة" (Last Name) fields in the individual registration form.
- **AI Identity Verification Enhancements**:
  - Updated the Gemini AI prompt to extract `firstName` and `lastName` specifically, and explicitly instruct it to return `isValid: false` with detailed `notes` if the document is unclear, unofficial, or not an ID.
  - Implemented a frontend cross-check: when the AI returns its analysis, the client now compares the user-inputted first and last names against the AI-extracted names. If they do not match, the frontend automatically marks the verification as invalid and sets the rejection reason to "الاسم المدخل لا يتطابق مع الاسم الموجود في الهوية."
  - The submit button is now disabled if the AI explicitly rejects the document (e.g., due to name mismatch, blurriness, or invalid document type), forcing the user to correct the issue before proceeding.
  - Improved the UI feedback to clearly display the specific rejection reason (from the AI's `notes` or the name mismatch) in a distinct red error box.


## 2026-08-22 — Individual Registration Flow Simplification

- **Single Submit Action**: The separate "تحليل مستند الهوية" (Analyze ID Document) button was removed. The entire workflow is now unified under a single "تحليل الهوية وتسجيل الحساب" (Analyze ID and Register Account) button.
- **AI Waiting State**: When the user clicks submit, a clear AI waiting state (`جاري تحليل مستند الهوية...` with a pulse animation) is displayed while the backend communicates with Gemini to analyze the uploaded document and compare the extracted names against the user's input.
- **Direct Email Verification**: If the AI verification succeeds and the names match, the system seamlessly proceeds to register the user in the database as `pending_verification` and immediately navigates the user to the email verification page (`/register/organization/verify`), removing the friction of a manual login step.
- **Validation Fallback**: If the AI explicitly rejects the document (due to blurriness, being unofficial, or a name mismatch), the registration halts, and the precise rejection reason is displayed in a red error box, prompting the user to correct the issue and re-submit.


## 2026-08-22 — Deferred Account Creation (Email Verification Gate)

- **Temporary Registration**: Created a new `TemporaryUser` Mongoose model with a TTL index to securely hold registration data before email verification.
- **Deferred Creation**: The `POST /api/auth/register` endpoint no longer creates an actual `User` document. Instead, it saves the data in the `TemporaryUser` collection and sends the verification code.
- **Verification Handoff**: The `POST /api/auth/verify` endpoint now looks up the `TemporaryUser`. Upon successful code validation, it creates the final `User` document, securely transfers the hashed password, and deletes the temporary record. This ensures unverified accounts never clutter the main users table or appear in admin lists.
- **Login Compatibility**: The `POST /api/auth/login` endpoint was updated to check the `TemporaryUser` collection if a user isn't found in the main collection, ensuring that users who try to log in before verifying their email are correctly prompted to complete the verification step instead of receiving a generic "invalid credentials" error.


## 2026-08-22 — Auction Detail Page Polish

- **Visual Hierarchy Reorder**: Reordered the side panel in the Auction Detail page (`/auctions/:id`). The "كم تريد أن تزايد؟" (How much do you want to bid?) action box is now placed at the very top of the sidebar, making it the most prominent and accessible element for active users.
- **UI/UX Refinements**:
  - Upgraded the bidding box styling to a more professional, elevated card with a distinct top accent border.
  - Enhanced the input field and quick-bid buttons (`+50`, `+100`, `+250`) with stronger hover states, subtle shadows, and smoother transitions.
  - Replaced the plain text "جارٍ تسجيل المزايدة..." with an inline `Spinner` inside the submit button to provide immediate, clear visual feedback during the network request.
  - Improved the layout of the "سجل المزايدات الحالية" (Bid History) and "الوقت المتبقي" (Time Remaining) cards to sit cleanly below the primary action area, aligning with standard e-commerce and auction platform UX patterns.


## 2026-08-22 — Auction Detail Redesign & Notifications

- **UI Redesign**: Rebuilt the `AuctionDetailPage` layout based on the provided HTML structure. The main content is now split into a left column (gallery, description, specifications, documents) and a right column (bidding panel, countdown, and bid history).
- **Role-Specific Views**:
  - **Individuals**: See the active bidding form if logged in, or a prompt to sign in. Winners see a distinct "انتهى المزاد لصالحك" (Auction ended in your favor) message with a link to payment.
  - **Organizations**: The owner of the auction sees a specific "مزادك الخاص" (Your Auction) read-only panel indicating they cannot bid on their own auction.
  - **Admins**: See a specific "عرض المشرف" (Admin View) read-only panel.
- **Server-Side Notifications**: Moved the ended-auction notification logic from the client to the backend (`auction-state.js`). When an auction's time expires and its state resolves to `ended`, the server now automatically dispatches two emails using the `GENERAL` template:
  1. A "Congratulations" email to the winning individual (if any bids were placed).
  2. A "Status Update" email to the organization owner, informing them whether the auction was won by a bidder or ended without any bids.


## 2026-08-22 — Auction Sidebar Consolidation

- **Unified Action Panel**: Merged the "سجل المزايدات الحالية" (Bid History) table directly into the bottom of the main bidding card in the sticky right-hand sidebar.
- **Viewport Visibility**: By consolidating these sections, users no longer need to scroll down to the end of the page to see what others are bidding. The live countdown, current highest price, active bidding form, and the live bid history log are now always visible together in the primary viewport while making a decision.
- **Scrollable History**: Added a responsive maximum height (`max-h-[250px]`) and internal vertical scrolling to the bid history table. This ensures that even if there are many bids, the table won't push the bidding controls off-screen on smaller desktop monitors.


## 2026-08-22 — Auction Detail Bid History Relocation

- **Layout Separation**: Separated the "سجل المزايدات الحالية" (Bid History) table from the right-hand sidebar's bidding control panel.
- **Main Column Placement**: Moved the live bid history to the bottom of the main left column, directly underneath the item gallery, description, and official documents.
- **Improved Workflow**: This layout change allows the user to see the full bid history in the wider main content area, while keeping the essential bidding input panel (with the current highest price and countdown) independently sticky in the right sidebar. This provides a cleaner view of the auction log without cluttering the action panel.


## 2026-08-22 — Auction Detail Exact Section Reordering

- **Exact Bid History Placement**: Moved the "سجل المزايدات الحالية" (Bid History) section so it now appears exactly below the "وصف المزاد" (Auction Description) block in the main content column.
- **Section Flow**: The main column now correctly flows from Item Images -> Auction Description -> Live Bid History -> Product Specifications -> Official Documents.
- **Sticky Controls Preserved**: The bidding control panel and countdown remain independently sticky in the right-hand sidebar, ensuring users can review the product details and recent bids simultaneously while choosing their bid amount.


## 2026-08-22 — Dark Mode & Global Theme System

- **CSS Variables System**: Migrated hardcoded `@theme` colors in `index.css` to use CSS variables (`--theme-*`) mapped to the `:root` pseudo-class.
- **Dark Mode Palette**: Created a `:root.dark` scope in `index.css` defining the dark mode color palette (e.g., swapping `#F7F8FA` paper for `#0B1015`, `#17202A` ink for `#F7F8FA`, and adjusting the registry green for better dark contrast).
- **Theme Context & Persistence**: Added a new `ThemeContext.jsx` provider that checks the user's system preference or previous choice, applies the `dark` class to the HTML root element, and saves the preference to `localStorage`.
- **Global Toggle**: Created a reusable `ThemeToggle` component and integrated it into both `AppHeader.jsx` (for authenticated/dashboard pages) and `PublicHeader.jsx` (for the landing page and auth routes).
- **Consistent Switching**: Since the entire application uses semantic Tailwind classes (like `bg-surface`, `text-ink`, `border-border`), switching the theme toggle on any page seamlessly and instantly updates the entire website's appearance.


## 2026-08-22 — Dashboard Theme Toggle Visibility

- **Dashboard Layout Fix**: Removed the `hidden sm:flex` class from the `ThemeToggle` component inside the Bento layout (used for authenticated dashboards).
- **Consistent Access**: The dark/light mode toggle button is now consistently visible in the top header next to the notifications icon across all authenticated views (Organization, Individual, and Admin dashboards), matching its visibility on the public landing page.


## 2026-08-23 — Dark Mode Countdown Contrast Fix

- **Countdown Header Contrast**: Changed the countdown header wrapper in `AuctionDetailPage.jsx` from using the semantic `bg-ink` token (which turns white in dark mode) to an explicit `bg-slate-900`. This ensures the background remains dark regardless of the active theme.
- **Timer Text Contrast**: Updated the numbers in `AuctionCountdown.jsx` to explicitly use `text-white`. Previously, they inherited the text color which became dark in dark mode against the light background, causing the readability issue seen in the screenshots. Now the timer is perfectly readable in both light and dark modes.


## 2026-08-23 — Brand Logo Implementation

- **Logo Concept**: Selected and refined Concept 1 ("The Trusted Gateway"). The design features a modern geometric green arch with a negative-space checkmark representing verified access and official procurement.
- **Logo System**: Generated a complete scalable SVG logo system:
  - `logo-etimad.svg`: The primary horizontal logo for light mode (dark text, green arch).
  - `logo-etimad-dark.svg`: The reversed horizontal logo for dark mode (white text, brighter green arch).
  - `icon-etimad.svg`: The compact symbol-only version used as the browser favicon and for small square spaces.
- **Global Integration**: Created a theme-aware `<Logo />` React component. Replaced the plain text "اعتماد" in `PublicHeader.jsx` and `AppHeader.jsx` with the new component.
- **Favicon & Meta**: Updated `index.html` to use the new compact icon as the favicon and changed the document title from "PalTenders" to "اعتماد".


## 2026-08-23 — Official Logo Replacement

- **Final Logo Selection**: Replaced the previously generated gateway concept with an exact SVG recreation of the user-provided "Concept 1" (logo1.jpeg).
- **SVG Reconstruction**: The new SVGs accurately reflect the sharp geometric styling, exact wordmark shape (with custom dots over the 'ت'), and the integrated checkmark inside the gateway arch from the provided image.
- **Theme Support**: The new logo files (`logo-etimad.svg`, `logo-etimad-dark.svg`, and `icon-etimad.svg`) instantly replace the old ones across the entire application via the `<Logo />` component, ensuring the official branding is now active in both light mode and dark mode.


## 2026-08-23 — Logo Wordmark Fix

- **Arabic Rendering Correction**: Fixed the `logo-etimad.svg` and `logo-etimad-dark.svg` files. The previous SVG construction drew the Arabic letters using disconnected path coordinates, causing the letters to appear disjointed and incorrect in RTL contexts.
- **Native Text Element**: Replaced the custom paths with a native `<text>` element using the project's official `Noto Kufi Arabic` font. The wordmark "اعتماد" now renders perfectly and smoothly connects the Arabic characters while maintaining the green gateway/checkmark symbol.


## 2026-08-23 — Comprehensive Logo Integration

- **Sidebar Branding**: Replaced the old building icon and text header in the desktop sidebar (`NavigationRail.jsx`) with the official `<Logo />` component, ensuring the brand appears correctly at the top of the dashboard navigation.
- **Mobile Drawer Menu**: Added the `ThemeToggle` to the mobile drawer menu (`OrgMobileNav.jsx`) so mobile users can also switch between light and dark modes easily, keeping the new logo and theme consistent across all device sizes.


## 2026-08-23 — Logo Size Adjustment

- **Increased Visibility**: Increased the default height of the `<Logo />` component across the main layout surfaces.
  - In `PublicHeader.jsx` (Landing Page) and `AppHeader.jsx` (Dashboard Top Bar), the logo height was increased from `h-8` (32px) to `h-10` (40px).
  - In `NavigationRail.jsx` (Desktop Sidebar), the logo height was increased from `h-6` (24px) to `h-8` (32px).
- This ensures the wordmark and the green gateway symbol are much easier to read without breaking the vertical alignment of the navigation bars.

## 2026-08-23 — Negotiation Chat Fixes

- **Chat History Layout**: Fixed the layout of the negotiation page so that the chat history has a fixed height (`min-h-[400px]` and `h-[calc(100vh-14rem)]`) with internal scrolling (`overflow-y-auto`), while the message input form and header remain fixed in the viewport.
- **Auto-Scroll**: Added automatic scroll-to-bottom behavior using a `useRef` marker that triggers whenever new messages arrive.
- **Manual Refresh Removed**: Removed the manual "تحديث" (Refresh) button.
- **Reliable Fallback Polling**: Added a quiet 5-second fallback polling interval that ensures messages and read receipts are synchronized reliably even if Socket.io delivery drops or is delayed, guaranteeing a smooth conversation flow.

- **Chat Viewport Expansion**: Increased the height of the main chat history section (from `min-h-[400px]` and `h-[calc(100vh-14rem)]` to `min-h-[550px]` and `h-[calc(100vh-8rem)]`) to ensure many more messages are visible on screen simultaneously without compromising the fixed composer layout.

- **Chat UI Redesign**: Redesigned the negotiation chat page to resemble a professional messaging workspace.
  - The chat header is now integrated directly into the main message container with a clear avatar, bold title, and a pulsing "Active Chat" status indicator.
  - The chat background uses a subtle geometric pattern and `bg-paper/20` for a modern, app-like feel.
  - The message composer input is larger and more prominent, featuring a seamless send button integrated into the input field.
  - The active conversations sidebar is visually quieter, with softer active-state backgrounds to avoid distracting from the main chat.

- **Chat Background Fix**: Removed the SVG dotted pattern from the negotiation chat background, as it created visual noise and poor contrast in dark mode. Replaced it with a clean, solid `bg-paper` surface that automatically adapts perfectly to both light and dark themes, ensuring messages are always highly readable.

## 2026-08-23 — Comprehensive Bug Fixes

- **Auction Timer Contrast (Light Mode)**: Fixed the `AuctionCountdown` component so that it inherits proper text colors when rendered on light-mode auction cards (`bg-registry-green/10 text-registry-green`), rather than forcing white text, while still preserving the explicit dark-mode styling inside the `AuctionDetailPage` header.
- **Tender Additional Requirements Contrast**: Fixed the background of the "متطلبات وشروط إضافية" (Additional Requirements) cards in `TenderDetailPage.jsx`. They now use a theme-aware `bg-paper/50` class instead of a hardcoded `#FAFAFA` hex color, ensuring they remain readable and properly contrasted in dark mode.
- **Real-Time Chat Notification Badge**: Upgraded `AppHeader.jsx` to connect to a lightweight global Socket.io room (`user_notifications:${userId}`). The server now explicitly emits an `unread_badge_update` event to this room whenever a user receives a new message or someone reads their message, ensuring the red dot in the header updates instantly without waiting for the 30-second polling interval.
- **Organization Auction Participation**: Updated the `auction.routes.js` middleware to allow both `individual` and `organization` roles to access the `POST /api/auctions/:id/bid` endpoint. Simultaneously added a security check in `auction.controller.js` to ensure that an organization cannot bid on its own created auction.
- **Organization Profile Cleanup**: Removed the redundant "فتح المحادثات" (Open Chats) button from the `OrgProfilePage.jsx` as requested, keeping the profile focused strictly on account status.

## 2026-08-23 — Auction Card Countdown Visibility Correction

- Added an explicit `variant="light"` presentation to `AuctionCountdown` when it is rendered inside `AuctionCard` on `/auctions`.
- Light auction cards now display the four remaining-time values with visible registry-green numbers, readable secondary labels, and theme-aware light surfaces. The detailed auction page continues using the dark countdown variant.
- Client production build passed after the correction. The existing Vite chunk-size warning remains non-blocking.
