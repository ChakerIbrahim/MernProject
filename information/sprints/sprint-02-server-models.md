# Sprint 02: Database Models

**Prerequisite:** Read every document in `/information` before starting.

## Goal
Define the Mongoose schemas for all major entities in the platform.

## Tasks
1. Create `User` model (admin, organization, individual) with role-based fields.
2. Create `TemporaryUser` model for the email verification flow.
3. Create `Tender` and `Proposal` models.
4. Create `Auction` and `Bid` models.
5. Create `Message` model for chat/negotiation.

## Acceptance Criteria
- [ ] Schemas enforce required fields and data types.
- [ ] Relationships between models (e.g., Tender -> User) use `ObjectId` references.
- [ ] Validation rules align with the SRS requirements.
