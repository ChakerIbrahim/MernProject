# Sprint 17: Email Integration

**Prerequisite:** Read every document in `/information` before starting.

## Goal
Integrate EmailJS to handle transactional emails (verification, notifications).

## Tasks
1. Configure the `EmailJS_Templates_Guide.md` settings in the client environment (`.env`).
2. Implement the email sending utility for Verification codes.
3. Implement the email sending utility for general platform notifications (e.g., account approved, auction won).
4. Ensure graceful degradation (app works even if EmailJS fails).

## Acceptance Criteria
- [ ] Registration triggers a verification email.
- [ ] Admin approval triggers a notification email.
- [ ] Email templates use the project's color scheme and branding.
