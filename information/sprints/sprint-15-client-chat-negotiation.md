# Sprint 15: Client Chat & Negotiation

**Prerequisite:** Read every document in `/information` before starting.

## Goal
Build the real-time chat interface for tender negotiations and inquiries.

## Tasks
1. Build `NegotiationPage` with a fixed-height, internally scrollable message history.
2. Connect the chat UI to Socket.io for instant message delivery and read receipts.
3. Integrate the global unread message badge into the `AppHeader`.
4. Build `OrgChatPage` to list all active conversations.

## Acceptance Criteria
- [ ] Messages appear instantly without manual page refresh.
- [ ] Chat history auto-scrolls to the bottom on new messages.
- [ ] The header badge updates globally when a new message is received.
