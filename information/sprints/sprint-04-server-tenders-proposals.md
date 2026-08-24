# Sprint 04: Tenders & Proposals API

**Prerequisite:** Read every document in `/information` before starting.

## Goal
Build the backend logic for managing procurement tenders and supplier proposals.

## Tasks
1. Build CRUD endpoints for Tenders (create, read, list, update).
2. Implement the AI analysis endpoint for tender official documents using Gemini.
3. Build endpoints for organizations to submit Proposals to open Tenders.
4. Implement AI analysis for incoming proposals.
5. Ensure tender owners cannot bid on their own tenders.

## Acceptance Criteria
- [ ] Tenders can be created with or without AI assistance.
- [ ] Proposals are linked to specific tenders and users.
- [ ] Role-based access ensures only approved organizations can create tenders or submit proposals.
