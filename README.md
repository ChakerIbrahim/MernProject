# اعتماد | ETEMAD

### AI-Powered Procurement, Tender & Auction Platform

**ETEMAD (اعتماد)** is a full-stack MERN web platform designed to modernize the way organizations publish tenders, evaluate proposals, manage procurement opportunities, and conduct public auctions.

The platform brings **organizations, companies, individuals, and administrators** into one centralized digital environment while using **Artificial Intelligence** to assist with proposal analysis and decision-making.

---

## 📌 Project Overview

Traditional tender and auction processes can involve fragmented communication, manual document review, limited transparency, and significant administrative effort.

**ETEMAD** provides a centralized digital solution where:

* Organizations can publish and manage tenders.
* Other organizations can submit proposals.
* AI analyzes uploaded proposal documents.
* Tender owners can compare and evaluate proposals.
* Organizations and administrators can publish auctions.
* Individuals can participate in auctions and place bids.
* Administrators manage organization verification and platform content.
* Accepted proposals can move into a negotiation workflow.

The goal is to make procurement and auction processes more **accessible, organized, transparent, and efficient**.

---

## ✨ Key Features

### 🏢 Tender Management

Organizations can:

* Create procurement tenders.
* Define tender requirements and deadlines.
* Edit and manage their tenders.
* Browse available procurement opportunities.
* Receive proposals from other organizations.
* Review submitted proposals.
* Accept or reject proposals.
* Track tender status through the organization dashboard.

---

### 📄 Proposal Management

Registered organizations can submit proposals to eligible tenders.

A proposal can include:

* Proposal information
* Pricing
* Uploaded documents
* Supporting information
* AI-generated document analysis
* AI confidence score

Tender owners can review proposal details before making a decision.

---

## 🤖 AI-Powered Proposal Analysis

ETEMAD integrates **Google Gemini AI** to assist organizations when reviewing proposal documents.

The AI layer can analyze uploaded proposal documents and extract useful information such as:

* Proposal summary
* Pricing information
* Important document details
* Relevant proposal information
* Confidence score

AI results are presented as **decision-support information**, rather than replacing the organization's final decision.

If the AI service is unavailable, the proposal workflow can continue without blocking the user.

---

## 🔨 Auction System

ETEMAD also includes a digital auction system.

Organizations or administrators can create auctions for assets such as:

* Vehicles
* Equipment
* Machinery
* Other organizational assets

Individuals can:

* Browse available auctions.
* View auction details.
* Follow auction countdowns.
* Submit bids.
* Track the current auction price.
* View their auction activity.

The system determines the winning bid when an auction closes.

---

## 💬 Negotiation & Communication

After a proposal reaches the appropriate stage, organizations can continue through a negotiation workflow.

The project includes:

* Negotiation pages
* Organization chat
* Chat requests
* Negotiation messages
* Socket.IO communication infrastructure

This allows organizations involved in a procurement process to communicate inside the platform instead of relying entirely on external communication channels.

---

## 👥 User Roles

ETEMAD implements **Role-Based Access Control (RBAC)** with three primary roles.

### 👨‍💼 Admin

Administrators manage and supervise the platform.

They can:

* Review organization registrations
* Approve or reject organizations
* Manage users
* Review tenders
* Review auctions
* Moderate platform activity
* Access administrative dashboards

### 🏢 Organization

Organizations are the primary participants in procurement.

They can:

* Register as an organization
* Upload verification documents
* Create tenders
* Manage their tenders
* Browse other tenders
* Submit proposals
* Review received proposals
* Create auctions
* Manage auctions
* Negotiate with selected organizations
* View reports and dashboards

### 👤 Individual

Individuals primarily participate in public auctions.

They can:

* Register and log in
* Browse auctions
* View auction details
* Place bids
* Track their auction participation
* Access an individual dashboard

---

# 🛠️ Technology Stack

ETEMAD is built using the **MERN Stack**.

## Frontend

* React 19
* Vite
* React Router
* Tailwind CSS
* Axios
* Recharts
* Socket.IO Client
* EmailJS

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Token
* bcrypt
* Multer
* Socket.IO
* Helmet
* Express Rate Limit
* PDF Parse

## AI

* Google Gemini API
* `@google/generative-ai`

## Database

* MongoDB
* Mongoose ODM

---

# 🏗️ System Architecture

ETEMAD follows a three-tier architecture:

```text
┌──────────────────────────────┐
│       Presentation Tier      │
│                              │
│ React + Vite + Tailwind CSS  │
│          Port 5173           │
└──────────────┬───────────────┘
               │
               │ HTTP / JSON
               │ JWT Authentication
               ▼
┌──────────────────────────────┐
│       Application Tier       │
│                              │
│ Node.js + Express.js         │
│ REST API + RBAC              │
│ Socket.IO                    │
└──────────────┬───────────────┘
               │
               │ Mongoose ODM
               ▼
┌──────────────────────────────┐
│           Data Tier          │
│                              │
│          MongoDB             │
└──────────────────────────────┘

        External Services
               │
        ┌──────┴──────┐
        ▼             ▼
 Google Gemini      EmailJS
 AI Analysis       Notifications
```

---

# 🔐 Authentication & Authorization

The application uses **JWT-based authentication**.

Passwords are securely hashed using **bcrypt** before being stored in MongoDB.

Protected API routes verify the user's JWT before allowing access.

Authorization is then controlled according to the user's role:

```text
Admin
   │
   ├── Platform Administration
   ├── Organization Approval
   ├── Tender Moderation
   └── Auction Moderation

Organization
   │
   ├── Tender Management
   ├── Proposal Submission
   ├── Proposal Review
   ├── Auction Management
   └── Negotiation

Individual
   │
   ├── Browse Auctions
   ├── Place Bids
   └── Track Auctions
```

---

# 📂 Project Structure

```text
ETEMAD/
│
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── functions/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   ├── jwt.config.js
│   │   ├── mongoose.config.js
│   │   ├── multer.config.js
│   │   └── seed.js
│   │
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── ai.controller.js
│   │   ├── auction.controller.js
│   │   ├── auth.controller.js
│   │   ├── chat.controller.js
│   │   ├── negotiation.controller.js
│   │   ├── proposal.controller.js
│   │   ├── tender.controller.js
│   │   └── user.controller.js
│   │
│   ├── models/
│   │   ├── auction.model.js
│   │   ├── bidHistory.model.js
│   │   ├── bidProposal.model.js
│   │   ├── chatRequest.model.js
│   │   ├── negotiationMessage.model.js
│   │   ├── tender.model.js
│   │   └── user.model.js
│   │
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── ai.routes.js
│   │   ├── auction.routes.js
│   │   ├── auth.routes.js
│   │   ├── chat.routes.js
│   │   ├── proposal.routes.js
│   │   └── tender.routes.js
│   │
│   ├── services/
│   ├── uploads/
│   ├── socket.js
│   ├── server.js
│   └── package.json
│
├── information/
│   ├── AGENTS.md
│   ├── design.md
│   ├── procurement-platform-srs.md
│   ├── requirements.md
│   └── SPRINT_PLAN.md
│
├── .env.example
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Before running the project, make sure you have installed:

* Node.js 18+
* npm
* MongoDB or MongoDB Atlas
* Git

You will also need credentials for the external services used by the project if you want AI analysis and email functionality.

---

## 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd ETEMAD
```

---

## 2. Install Backend Dependencies

```bash
cd server
npm install
```

---

## 3. Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

---

# ⚙️ Environment Variables

Create your server environment configuration based on the provided `.env.example`.

```env
PORT=8000

MONGOOSE_URI=your_mongodb_connection_string

SECRET=your_jwt_secret

CLIENT_ORIGIN=http://localhost:5173

ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password

GEMINI_API_KEY=your_gemini_api_key
```

Never commit real API keys, passwords, JWT secrets, or database credentials to GitHub.

---

## EmailJS Configuration

Create:

```text
client/.env.local
```

Then configure:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

# ▶️ Running the Application

## Start the Backend

From the `server` directory:

```bash
npm start
```

The API runs by default at:

```text
http://localhost:8000
```

You can verify the backend using:

```text
GET /api/health
```

---

## Start the Frontend

From the `client` directory:

```bash
npm run dev
```

The frontend runs by default at:

```text
http://localhost:5173
```

---

# 🌐 Main API Modules

The backend is organized into dedicated API modules.

```text
/api/auth
/api/admin
/api/tenders
/api/proposals
/api/ai
/api/auctions
/api/chat
```

Each module is separated into routes, controllers, models, and supporting services where appropriate.

---

# 🗄️ Main Data Models

The MongoDB database contains models covering the major platform workflows.

### User

Stores:

* Account information
* Authentication information
* User role
* Organization details
* Verification status

### Tender

Stores procurement opportunities created by organizations.

### Bid Proposal

Stores organization proposals submitted against tenders.

### Auction

Stores auction details, status, pricing, deadlines, and related information.

### Bid History

Maintains bidding activity associated with auctions.

### Chat Request

Controls negotiation communication requests between organizations.

### Negotiation Message

Stores messages exchanged during negotiation.

---

# 🛡️ Security

Security is an important part of ETEMAD's architecture.

The backend implements:

* JWT authentication
* bcrypt password hashing
* Role-based authorization
* CORS restrictions
* Helmet security headers
* API rate limiting
* Server-side validation
* Controlled file uploads
* File-size restrictions
* File-type validation
* Protected API endpoints
* Environment-based secret management

Uploaded documents are restricted to supported file types and a maximum configured file size.

---

# 📎 File Uploads

ETEMAD uses **Multer** for handling uploaded documents.

Supported files include:

```text
JPG
JPEG
PNG
PDF
```

Maximum upload size:

```text
5 MB
```

Uploads can be used for:

* Organization verification documents
* Tender/proposal documents
* Auction images
* Supporting documentation

---

# 📧 Notifications

EmailJS is used to provide user notifications for important platform events, including:

* Organization approval
* Organization rejection
* Proposal status changes
* Auction-related notifications
* Winner notifications

Database state remains the source of truth; failure to send an email does not reverse the underlying platform operation.

---

# 🎨 UI / UX

ETEMAD uses a responsive interface designed around reusable React components.

The frontend contains shared components for:

* Navigation
* Sidebars
* Cards
* Forms
* Tables
* Pagination
* Dialogs
* Status indicators
* File uploads
* Loading states
* Error states
* Countdown timers
* Confidence indicators
* Responsive layouts
* Role-based navigation

The interface also supports the Arabic-first direction and design requirements of the platform.

---

# 📊 Dashboards

The system provides different dashboards depending on the authenticated user's role.

### Admin Dashboard

Focused on:

* Platform administration
* User management
* Organization verification
* Tender moderation
* Auction moderation

### Organization Dashboard

Focused on:

* Tender activity
* Proposals
* Auctions
* Reports
* Organization profile
* Negotiations

### Individual Dashboard

Focused on:

* Available auctions
* Bidding activity
* Personal auction participation

---

# 🔄 Core Tender Workflow

```text
Organization
     │
     ▼
Create Tender
     │
     ▼
Publish Tender
     │
     ▼
Other Organizations
Browse Tender
     │
     ▼
Upload Proposal
     │
     ▼
Gemini AI Analysis
     │
     ▼
Extracted Information
+ Confidence Score
     │
     ▼
Submit Proposal
     │
     ▼
Tender Owner Reviews
     │
   ┌─┴────────────┐
   ▼              ▼
Accept          Reject
   │
   ▼
Negotiation
```

---

# 🔨 Core Auction Workflow

```text
Organization / Admin
        │
        ▼
   Create Auction
        │
        ▼
    Admin Review
        │
        ▼
  Auction Published
        │
        ▼
Individuals Browse
        │
        ▼
     Place Bids
        │
        ▼
 Current Price Updates
        │
        ▼
 Auction Deadline
        │
        ▼
 Highest Valid Bid
        │
        ▼
      Winner
```

---

# 🧠 Design Philosophy

ETEMAD is built around four principles:

**Transparency** — procurement opportunities and auction information are presented through a centralized platform.

**Efficiency** — organizations can manage procurement workflows digitally instead of relying on fragmented manual processes.

**Intelligence** — AI assists with understanding and evaluating proposal documents.

**Accessibility** — organizations and individuals receive role-specific interfaces designed around their actual tasks.

---

# 🗺️ Future Improvements

Potential future development includes:

* Advanced AI proposal scoring
* AI comparison between multiple proposals
* AI-generated procurement recommendations
* AI-assisted contract generation
* Advanced analytics
* Complete audit logging
* Cloud-based document storage
* Push notifications
* SMS notifications
* Payment gateway integration
* Multi-currency support
* Advanced organization verification
* Digital signatures
* Enhanced real-time bidding
* Mobile application
* Arabic/English language switching
* Production deployment and CI/CD

---

# 👨‍💻 Development Team

ETEMAD was developed as a collaborative MERN Stack project by:

* **Chaker Ibrahem**
* **Ramez Atallah**
* **Jalil Wasaya**
* **Hosni Ahmad**

---

# 🎓 Project Context

ETEMAD was developed as a **Full-Stack MERN project**, demonstrating practical implementation of:

* Full-stack web development
* RESTful API design
* React component architecture
* MongoDB data modeling
* Authentication and authorization
* Role-based access control
* File management
* Artificial Intelligence integration
* Real-time communication
* Responsive UI/UX
* Security practices
* External service integration

---

# 📜 License

This project was developed for educational and demonstration purposes.

Please contact the development team before using the project for commercial purposes.

---

<div align="center">

## اعتماد | ETEMAD

### Smarter Procurement. Transparent Opportunities. Better Decisions.

**Built with MongoDB • Express.js • React • Node.js • Gemini AI**

</div>
