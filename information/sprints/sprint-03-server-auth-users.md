# Sprint 03: Authentication & User Management API

**Prerequisite:** Read every document in `/information` before starting.

## Goal
Implement secure user registration, login, and profile management endpoints.

## Tasks
1. Implement JWT generation and verification middleware (`isAuth`, `isRole`).
2. Build registration endpoints for Organizations and Individuals, routing them through `TemporaryUser`.
3. Build the email verification endpoint to move users from `TemporaryUser` to `User`.
4. Build the login endpoint returning `{ user, token }`.
5. Build admin endpoints to approve/reject pending organizations.

## Acceptance Criteria
- [ ] Passwords are hashed using `bcrypt`.
- [ ] Protected routes correctly reject requests without a valid token (401) or insufficient role (403).
- [ ] Registration requires email verification before account creation.
