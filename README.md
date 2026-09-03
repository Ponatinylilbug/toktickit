# TokTickIT — IT Helpdesk Request Management System

TokTickIT is a full-stack IT ticketing application designed for managing and tracking internal IT support requests. This repository contains the starter vertical slice for **Lab 1: Git Workflow, Engineering Collaboration, and Full-Stack Foundation**.

---

## 🛠️ Tech Stack

- **Frontend (`client/`)**: React 18, TypeScript, Vite, Bootstrap 5
- **Backend (`server/`)**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Testing**:
  - Backend: Vitest, Supertest
  - Frontend: Vitest, React Testing Library, Jest DOM

---

## 📂 Repository Structure

```
toktickit/
├── client/                     # React + Vite frontend application
│   ├── src/                    # UI Components, App.tsx, API client
│   └── tests/lab-01/           # Vitest frontend tests (App.test.tsx)
├── server/                     # Express + Prisma backend application
│   ├── prisma/                 # Prisma schema and seed scripts
│   ├── src/                    # Express application & API routes
│   └── tests/lab-01/           # Backend integration tests (health & categories)
├── docs/                       # Documentation and lab submission records
│   └── lab-01/
│       ├── ai_use.md           # AI tool prompts and reflection
│       ├── reviewer.md         # Peer code review records
│       └── tests.md            # Test plan and execution evidence
├── .gitignore                  # Git ignore rules for node_modules, env, DB files
└── README.md                   # Project overview and setup instructions
```

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL Database** (optional for local mock testing, required for full DB persistence)

---

### 1. Backend Setup (`server/`)

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to create your `.env` file:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `DATABASE_URL` matches your local PostgreSQL credentials)*

4. **Initialize Database & Seed Data (Optional if using Postgres):**
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

5. **Start the backend development server:**
   ```bash
   npm run dev
   ```
   The API will run at `http://localhost:3000`.

---

### 2. Frontend Setup (`client/`)

1. **Navigate to the client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   The application UI will open at `http://localhost:5173`.

---

## 🧪 Running Automated Tests

### Backend Tests
Runs Supertest and Vitest for API health checks and category endpoints:
```bash
cd server
npm run test
```

### Frontend Tests
Runs Vitest and React Testing Library for UI components and connection status states:
```bash
cd client
npm run test
```

---

## 📡 REST API Endpoints

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "service": "TokTickIT API"
  }
  ```

### 2. IT Request Categories
- **Endpoint**: `GET /api/categories`
- **Response**: `200 OK`
  ```json
  [
    { "id": 1, "name": "Account and Access" },
    { "id": 2, "name": "Hardware" },
    { "id": 3, "name": "Software" },
    { "id": 4, "name": "Network" }
  ]
  ```

---

## 👥 Authors & Peer Review

- **Author:** Jinjuta Antant (@Ponatinylilbug)
- **Peer Reviewer:** @thitigant / @aranedlek