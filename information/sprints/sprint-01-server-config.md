# Sprint 01: Server Configuration & Middleware

**Prerequisite:** Read every document in `/information` before starting.

## Goal
Establish the core backend architecture, including routing, error handling, and file upload configuration.

## Tasks
1. Set up `server.js` with basic middleware (`express.json()`, `cors`, `helmet`).
2. Create the `middlewares/` directory and implement a global error handler.
3. Create the `config/` directory for database connection logic.
4. Configure `multer` for handling file uploads (PDF, JPG, PNG) with a 5MB limit.
5. Define the initial route structure in `routes/`.

## Acceptance Criteria
- [ ] Global error handler catches and formats errors consistently.
- [ ] File uploads are restricted by size and MIME type.
- [ ] API routes return proper JSON structures.
