# Sprint 08: Client Routing & Auth Context

**Prerequisite:** Read every document in `/information` before starting.

## Goal
Implement client-side routing and global authentication state.

## Tasks
1. Create `AuthContext` to manage user state (login, logout, token storage).
2. Set up `react-router-dom` with a main layout (Header + Footer).
3. Create `ProtectedRoute` components to guard routes based on authentication and role.
4. Build the `AppHeader` with navigation links and user menu.

## Acceptance Criteria
- [ ] Users are redirected to login if accessing protected routes.
- [ ] Role-based routes (e.g., `/admin`) restrict unauthorized access.
- [ ] Auth state persists across page reloads.
