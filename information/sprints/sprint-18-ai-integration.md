# Sprint 18: AI Integration

**Prerequisite:** Read every document in `/information` before starting.

## Goal
Integrate Gemini AI for document parsing and validation.

## Tasks
1. Implement AI extraction for Tender official books (`analyze-book`).
2. Implement AI extraction for Auction product specs (`analyze-auction-doc`).
3. Implement AI validation for Individual National IDs during registration.
4. Ensure the UI handles AI loading states (spinners, modals) and errors gracefully.

## Acceptance Criteria
- [ ] Uploading a tender document auto-fills the creation form.
- [ ] Uploading a national ID validates the image and user data.
- [ ] If AI fails or returns invalid JSON, the user can continue manually.
