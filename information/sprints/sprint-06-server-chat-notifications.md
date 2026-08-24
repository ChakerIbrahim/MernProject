# Sprint 06: Chat & Notifications API

**Prerequisite:** Read every document in `/information` before starting.

## Goal
Enable real-time communication and unread message tracking using Socket.io.

## Tasks
1. Set up Socket.io on the Express server with JWT authentication.
2. Implement room joining logic for negotiation threads (`negotiation:<id>`).
3. Implement global notification rooms (`user_notifications:<id>`).
4. Build REST endpoints to fetch chat history and mark messages as read.
5. Build the unread badge calculation endpoint.

## Acceptance Criteria
- [ ] Sockets authenticate using the same JWT as REST requests.
- [ ] Messages are broadcast instantly to users in the specific room.
- [ ] Global unread badge updates are emitted when new messages arrive.
