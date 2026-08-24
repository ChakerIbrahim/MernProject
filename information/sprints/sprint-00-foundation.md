# Sprint 00: Foundation & Shell

**Prerequisite:** Read every document in `/information` before starting.

## Goal
Initialize the project structure, set up the Node.js/Express server, and create the React/Vite client with Tailwind CSS v4 and RTL support.

## Tasks
1. Initialize `server/` with `package.json`, `express`, `mongoose`, `cors`, `dotenv`.
2. Initialize `client/` with Vite (React + JavaScript).
3. Install and configure `@tailwindcss/vite` (Tailwind v4) in the client.
4. Set up the basic RTL HTML shell in `client/index.html` (`dir="rtl" lang="ar"`).
5. Ensure both development servers run concurrently and the client can proxy requests to the server.

## Acceptance Criteria
- [ ] Server boots on port 8000 and connects to MongoDB.
- [ ] Client boots on port 5173.
- [ ] Client renders a basic Arabic welcome message with correct RTL layout.
- [ ] Tailwind CSS utility classes are applied correctly.
