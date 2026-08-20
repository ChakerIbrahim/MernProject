# MERN Vault AGENTS.md

## 1. Build and Test Commands

### Server Initialization
```cmd
mkdir server\config server\controllers server\models server\routes
type nul > server\config\mongoose.config.js
type nul > server\controllers\user.controller.js
type nul > server\models\user.model.js
type nul > server\routes\user.routes.js
type nul > server\server.js
type nul > server.env

cd server
npm init -y
npm install express mongoose cors dotenv bcrypt jsonwebtoken helmet express-rate-limit
npm install -D nodemon
```

### Client Initialization
```cmd
npm create vite@latest client -- --template react
cd client
mkdir src\components src\pages src\functions
npm install axios react-router-dom
npm install -D tailwindcss @tailwindcss/vite
npm install @emailjs/browser
```

## 2. Tech Stack and Versions

### Backend (Server)
- **Runtime:** Node.js 18 or later
- **Framework:** Express
- **Database:** MongoDB 6 or later (Local or Atlas)
- **ODM:** Mongoose
- **Authentication:** JWT (jsonwebtoken) & bcrypt
- **Security:** helmet, cors, express-rate-limit

### Frontend (Client)
- **Framework:** React (Vite template)
- **Styling:** Tailwind CSS (@tailwindcss/vite)
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Email Notifications:** EmailJS (@emailjs/browser)

## 3. Project Structure

### Server Structure
```text
server/
├── config/
│   └── mongoose.config.js
├── controllers/
│   └── user.controller.js
├── models/
│   └── user.model.js
├── routes/
│   └── user.routes.js
├── server.js
└── server.env
```

### Client Structure
```text
client/
├── src/
│   ├── components/
│   ├── pages/
│   ├── functions/
│   ├── index.css
│   └── main.jsx
├── vite.config.js
└── package.json
```

## 4. Critical Conventions

### Architecture & API
- **Three-Tier Architecture:** Client (React on Vite), Server (Express API), Database (MongoDB).
- **Stateless API:** The server must not hold sessions in memory. User identity is derived from a JWT provided on each request.
- **Validation:** All data validation must occur on the server. Client-side checks are strictly advisory.
- **Environment Variables:** Configuration values (ports, database URIs, JWT secrets) must be read from `.env` files and never hard-coded.

### Security
- **Passwords:** Passwords must be hashed using `bcrypt` prior to storage. Plaintext passwords must never be stored or logged.
- **CORS:** Ensure CORS policies explicitly name the allowed origins (e.g., client running on port 5173).
- **Protected Routes:** Endpoints requiring authentication must verify the JWT before executing any controller logic. Respond with HTTP 401 if unauthorized.

### Error Handling & Responses
- **JSON Standard:** All request and response bodies must use JSON.
- **Response Shape:** Successful responses must return an object with a named key (e.g., `{ data: ... }`), never a bare array or primitive value.
- **Validation Errors:** Validation failures should return HTTP 400 with a detailed, per-field error map.

### Development Workflow (Phased Approach)
Projects should follow a phased implementation strategy (e.g., Phase 1: Core Auth, Phase 2: Core CRUD, Phase 3: Advanced Features) to ensure a stable, testable product at each milestone.

## 5. Project-Specific Conventions

### Roles & Authorization
- Roles are stored on `User.role`: `admin`, `organization`, `individual`.
- Middleware order on protected routes: `isAuth` → `isRole(['admin', ...])` → controller.
- `isAuth` only verifies the JWT is valid and attaches the user to `req.user`.
- `isRole` runs after `isAuth` and checks `req.user.role` against an allowed list.
- Status codes: `401` = not authenticated (missing/invalid token), `403` = authenticated but wrong role.
- Never trust a `role` field sent in the request body — always read it from the verified JWT payload or the DB record.

### File Uploads
- **Library:** `multer`
- **Max size:** 5MB per file.
- **Allowed types:** `jpg`, `jpeg`, `png`, `pdf` only — reject everything else server-side (do not rely on the file extension alone; check MIME type too).
- **Storage:** local `/uploads` folder for the MVP (add `/uploads` to `.gitignore`); can be upgraded to Cloudinary later without changing the API contract.
- Uploaded file URLs are stored on the relevant document (`User.proofDocumentUrl`, `BidProposal.documentUrl`, `Auction.imageUrl`), never the raw file buffer.

### AI Integration (Gemini)
- **Library:** `@google/generative-ai`
- API key must live in `.env` as `GEMINI_API_KEY`, never hard-coded or committed.
- All Gemini calls are isolated inside a dedicated `ai.controller.js` (or `ai.service.js`) — routes/controllers never call the Gemini SDK directly.
- Every AI response shown to the user must include a `confidenceScore` (0-100) alongside the extracted data — never present AI output as ground truth without it.
- Wrap every Gemini call in try/catch; a failed AI call must degrade gracefully (e.g., let the user submit the proposal manually) rather than block the flow.

### Email Notifications (EmailJS)
- **Library:** `@emailjs/browser` — email is sent directly from the client, no backend mail server needed.
- Config values (`SERVICE_ID`, `TEMPLATE_ID`, `PUBLIC_KEY`) must be read from client-side `.env` variables (`VITE_EMAILJS_SERVICE_ID`, etc.), never hard-coded.
- Used for: organization approval/rejection notices, auction win notices, and proposal status updates.
- EmailJS calls are triggered from a single shared helper (e.g., `src/functions/sendEmail.js`) — never duplicated inline across components.
- EmailJS is a UX nicety, not a security boundary — the source of truth for any status change is always the database, not whether the email was sent successfully. A failed EmailJS call must never block or roll back the underlying action (e.g., approval still succeeds even if the email fails).

### Error Handling
- A single global error-handling middleware in `server.js` catches all thrown/forwarded errors (`app.use((err, req, res, next) => {...})`) — controllers should `next(err)` rather than format error responses individually.
- Standard status codes: `400` (validation), `401` (not authenticated), `403` (wrong role/forbidden), `404` (resource not found), `500` (unexpected server error).

### Database Seeding
- The first `admin` account is never created through the public register endpoint.
- A dedicated script (`server/config/seed.js`) creates/upserts the initial admin user from `.env` values (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) and is run manually once per environment.

### Real-time Bidding (Phase 4)
- No Socket.io in the MVP. Live auction price updates are implemented via client-side polling (`setInterval`, every 3-5 seconds) against `GET /api/auctions/:id`.

### Environment & Secrets Hygiene
- `.gitignore` must include `node_modules/`, `.env`, `server.env`, and `/uploads` (if using local file storage).
- Never log full request bodies containing passwords, tokens, or file contents.
