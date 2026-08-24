# اعتماد | Etemad

**اعتماد (Etemad)** is an Arabic, RTL procurement and bidding platform for publishing tenders, submitting proposals, managing organizational accounts, running auctions, and communicating through real-time negotiation chat. The application is designed around a role-based workflow for individuals, organizations, and administrators.

> **Project status:** Active full-stack application. The repository contains a Vite/React frontend and an Express/MongoDB backend. The payment page is currently a simulation and is not connected to a real payment provider.

## Features

| Area | Included functionality |
|---|---|
| Authentication | Registration, email verification, login, JWT-based authorization, password reset, and role-aware access control |
| Organization workflow | Organization registration, identity/document review, pending approval, approval/rejection notifications, organization profile, and dashboards |
| Tenders | Create, edit, publish, browse, view details, manage deadlines, budgets, categories, requirements, and custom fields |
| Proposals | Upload proposal documents, submit offers, view proposal status, review proposal details, and manage proposal decisions |
| Auctions | Create and manage auctions, upload product information, display auction details, accept bids, and show bid history and status |
| Negotiation | Real-time proposal and chat-request conversations using Socket.IO, with unread counts and read states |
| AI assistance | Gemini-powered extraction and analysis for proposals, identity documents, tender books, and auction-item documents |
| Email notifications | Email verification, password-reset messaging, organization approval/rejection notices, and platform notifications through EmailJS |
| Administration | Admin dashboards for users, tenders, auctions, organization approvals, and user status management |
| Interface | Arabic RTL interface, responsive layouts, dark-mode support, status indicators, charts, and accessible reusable components |

## Architecture

The project uses a separate frontend and backend. In development, Vite serves the React application and Express runs on port `8000`. In production, Nginx serves the generated React files and reverse-proxies API requests, uploaded files, and Socket.IO traffic to the Express process.

```text
Browser
  │
  ├── React + Vite frontend
  │     ├── /api/*       ───────┐
  │     ├── /uploads/*   ───────┼── Nginx reverse proxy ── Express + Socket.IO :8000
  │     └── /socket.io/* ───────┘                                  │
  │                                                                ├── MongoDB Atlas
  │                                                                ├── Gemini API
  │                                                                └── EmailJS REST API
```

| Layer | Technology | Directory |
|---|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS, Recharts, Axios, Socket.IO client | `client/` |
| Backend | Node.js, Express 5, Mongoose, Socket.IO, JWT, Multer, Helmet, rate limiting | `server/` |
| Database | MongoDB through Mongoose | External MongoDB Atlas cluster |
| AI | Google Generative AI SDK with configurable Gemini model | `server/controllers/ai.controller.js` |
| Email | EmailJS REST API from the backend and EmailJS browser SDK where required | `server/services/`, `client/src/functions/` |
| Production | Nginx, PM2, Ubuntu EC2 | `deployment/` and `DEPLOYMENT_GUIDE.md` |

## Repository structure

```text
.
├── client/                         React/Vite frontend
│   ├── src/components/             Shared UI and layout components
│   ├── src/functions/              API, authentication, formatting, and URL helpers
│   ├── src/hooks/                  Reusable React hooks
│   └── src/pages/                  Application screens
├── server/                         Express backend
│   ├── config/                     Database, JWT, upload, and seed configuration
│   ├── controllers/                Request and business logic
│   ├── models/                     Mongoose models
│   ├── routes/                     API route modules
│   ├── services/                   Email and other service integrations
│   ├── uploads/                    Runtime upload directory, ignored by Git
│   └── server.js                   Backend entry point
├── deployment/                     Production server configuration
├── information/                    Product requirements and engineering documentation
├── .env.example                    Backend environment template
├── client/.env.example             Frontend environment template
├── DEPLOYMENT_GUIDE.md             Complete EC2 deployment and maintenance guide
└── EmailJS_Templates_Guide.md      EmailJS template setup reference
```

## Quality and operations

The repository includes focused documentation for maintainers and reviewers:

| Document | Purpose |
|---|---|
| [`docs/API.md`](docs/API.md) | Route reference, access rules, upload fields, and response conventions |
| [`docs/TESTING.md`](docs/TESTING.md) | Backend and frontend test commands and validation scope |
| [`docs/OPERATIONS.md`](docs/OPERATIONS.md) | EC2 deployment, health checks, updates, rollback, and logs |
| [`scripts/ec2-health-check.sh`](scripts/ec2-health-check.sh) | Automated PM2, Nginx, backend, and proxy health check |
| [`.github/workflows/quality.yml`](.github/workflows/quality.yml) | Continuous integration for tests, lint, and production build |

The current quality branch also contains regression coverage for authentication validation, ownership authorization, upload policy, AI response handling, EmailJS payloads, rate limits, API errors, auction expiry, role routing, client error extraction, and client utility behavior.

## Requirements

Install the following before starting local development:

| Requirement | Purpose |
|---|---|
| Node.js LTS | Runs the frontend build and backend server |
| npm | Installs dependencies and executes project scripts |
| MongoDB Atlas or MongoDB | Stores users, tenders, proposals, auctions, bids, and messages |
| Git | Clones the repository and manages updates |
| Gemini API key | Enables the document-analysis features |
| EmailJS service and templates | Enables verification and notification emails |

## Getting started locally

Clone the repository and enter its root directory:

```bash
git clone https://github.com/RamezAtallah-9r/etemad-mern-deployment.git
cd etemad-mern-deployment
```

Install frontend and backend dependencies from the committed lockfiles:

```bash
cd client
npm ci

cd ../server
npm ci

cd ..
```

Create the backend environment file at the **repository root**. The backend is configured to load `server.env` from this location:

```bash
cp .env.example server.env
```

Create the frontend environment file:

```bash
cp client/.env.example client/.env.local
```

Edit both files and replace every placeholder. Never commit either real environment file.

### Backend environment variables

```dotenv
PORT=8000
MONGOOSE_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
SECRET=replace-with-a-long-random-jwt-secret
CLIENT_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-admin-password
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash-lite
EMAILJS_SERVICE_ID=your-emailjs-service-id
EMAILJS_PUBLIC_KEY=your-emailjs-public-key
EMAILJS_PRIVATE_KEY=your-emailjs-private-key
EMAILJS_VERIFICATION_TEMPLATE=template_ui7ifvr
EMAILJS_GENERAL_TEMPLATE=template_w1mnjin
```

The exact variable names matter. This project uses `MONGOOSE_URI` and `SECRET`; `MONGO_URI` and `JWT_SECRET` will not be read by the current backend. Keep `SECRET` stable after users begin logging in because JWT tokens are signed with it.

### Frontend environment variables

For local development, use the backend origin:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_EMAILJS_SERVICE_ID=your-emailjs-service-id
VITE_EMAILJS_TEMPLATE_ID=your-emailjs-template-id
VITE_EMAILJS_PUBLIC_KEY=your-emailjs-public-key
```

For the production Nginx setup, set `VITE_API_URL=` to an empty value. The frontend will then use same-origin `/api`, `/uploads`, and `/socket.io` requests. Values prefixed with `VITE_` are included in the browser bundle, so never place private API keys or EmailJS private keys in the frontend environment file.

### Start the application

Open one terminal for the backend:

```bash
cd server
npm start
```

The backend should report that it is running on port `8000` and has connected to MongoDB. Confirm its health endpoint:

```bash
curl http://127.0.0.1:8000/api/health
```

The expected response is:

```json
{"message":"backend is healthy"}
```

Open a second terminal for the frontend:

```bash
cd client
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Available scripts

### Frontend

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production bundle in `client/dist` |
| `npm run preview` | Preview the production bundle locally |
| `npm run lint` | Run Oxlint |

### Backend

| Command | Purpose |
|---|---|
| `npm start` | Start Express with `server.js` |
| `npm test` | Placeholder test script; automated backend tests are not currently configured |

## AI document analysis

The backend uses the Gemini model configured by `GEMINI_MODEL`. The current free-friendly default is:

```dotenv
GEMINI_MODEL=gemini-3.5-flash-lite
```

The AI endpoints accept supported proposal, identity, tender-book, and auction-item files according to the validation in the backend. The application requests JSON responses and validates the returned shape before saving analysis results. AI features require a valid `GEMINI_API_KEY`; if the key is unavailable or the model quota is exhausted, users can continue certain workflows manually where the interface supports it.

## EmailJS configuration

The backend sends EmailJS messages through the REST API. Configure the following values in `server.env`:

```dotenv
EMAILJS_SERVICE_ID=...
EMAILJS_PUBLIC_KEY=...
EMAILJS_PRIVATE_KEY=...
EMAILJS_VERIFICATION_TEMPLATE=template_ui7ifvr
EMAILJS_GENERAL_TEMPLATE=template_w1mnjin
```

The General template should use `{{to_email}}` in **To Email**, `{{email_subject}}` in **Subject**, and the dynamic variables documented in `EmailJS_Templates_Guide.md`. Keep **From Email** empty when **Use Default Email Address** is enabled. The corrected HTML template is available in `EmailJS_General_Template_FIXED.html`.

## Production deployment

The recommended EC2 deployment uses the following path:

```text
GitHub → Ubuntu EC2 → Nginx → React static files
                         └────── Express + Socket.IO through PM2
```

Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for the complete workflow, including EC2 creation, security-group rules, SSH, MongoDB Atlas access, environment files, dependency installation, Nginx, PM2, HTTPS, updates, rollback, and troubleshooting.

The ready-to-copy Nginx configuration is [deployment/nginx-etemad.conf](./deployment/nginx-etemad.conf). It proxies all three backend-dependent paths:

```text
/api/       REST API
/uploads/   Uploaded images and documents
/socket.io/ Real-time chat and WebSocket upgrades
```

Do not expose port `8000` publicly in the AWS security group. Nginx should be the public entry point.

## Updating the live server

Push source changes from your development computer:

```bash
git add .
git commit -m "Describe the change"
git push origin main
```

On EC2, pull the new commit:

```bash
cd ~/etemad-mern-deployment
git pull --ff-only origin main
```

For frontend changes, rebuild and copy the generated files:

```bash
cd client
npm ci
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r dist/. /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

For backend changes, reinstall dependencies if `package.json` changed and restart PM2:

```bash
cd server
npm ci --omit=dev
pm2 restart etemad-api --update-env
```

Keep `server.env`, `client/.env.local`, and runtime uploads on the server. They are intentionally excluded from Git.

## Security notes

The repository’s ignore rules exclude real environment files, dependencies, build output, runtime logs, and uploaded files. Review `git status` before every commit. If a secret is ever committed, rotate it immediately and remove it from the repository history.

Restrict MongoDB Atlas network access to the EC2 public IP using a `/32` entry whenever possible. Keep SSH restricted to **My IP**, allow public HTTP/HTTPS only, and do not open the internal Express port. Use strong values for `SECRET`, `ADMIN_PASSWORD`, and database credentials.

Uploaded files are stored on the server filesystem. For a serious production deployment, add a backup strategy and consider moving uploads to object storage such as Amazon S3. The current deployment is suitable for a small application or demonstration but does not yet provide high availability, automated CI/CD, or distributed file storage.

## Troubleshooting

| Problem | First check |
|---|---|
| Frontend calls `localhost` in production | Set empty `VITE_API_URL`, rebuild the frontend, and copy the new `dist` files to Nginx |
| Nginx returns `502 Bad Gateway` | Check `pm2 status`, `pm2 logs etemad-api`, and `curl http://127.0.0.1:8000/api/health` |
| React route refresh returns 404 | Confirm Nginx contains `try_files $uri $uri/ /index.html;` |
| Chat does not connect | Confirm Nginx proxies `/socket.io/` with HTTP/1.1 `Upgrade` and `Connection` headers |
| Images or documents fail | Confirm Nginx proxies `/uploads/` and the `server/uploads` directory exists |
| MongoDB connection fails | Check `MONGOOSE_URI`, the Atlas database user, and the Atlas IP access list |
| Approval email fails | Check the General template ID, the EmailJS template settings, and remove unsupported `{{#if ...}}` syntax |
| `vite: Permission denied` | Delete `node_modules` and run `npm ci` again instead of copying archived dependencies |

## Documentation

The `information/` directory contains product requirements, design rules, engineering conventions, sprint documents, and the project specification used during development. The main deployment reference is [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## License

No open-source license has been added to this repository yet. Unless a license is added, the project should be treated as **all rights reserved** by its owner.

## Acknowledgements

This project uses [React](https://react.dev/), [Vite](https://vite.dev/), [Express](https://expressjs.com/), [MongoDB](https://www.mongodb.com/), [Socket.IO](https://socket.io/), [Google Generative AI](https://ai.google.dev/), and [EmailJS](https://www.emailjs.com/).
