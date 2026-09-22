# TokTickIT

TokTickIT is a full-stack internal IT ticketing application featuring a React frontend, an Express API backend, and a PostgreSQL database managed via Prisma ORM inside Docker.

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Vitest, React Testing Library
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, Vitest, Supertest
- **Database:** PostgreSQL (Dockerized)

---

## Prerequisites
- **Node.js:** v18 or higher
- **Docker:** Docker Desktop running locally
- **Package Manager:** npm

---

## Getting Started

### 1. Database Setup (Docker & Prisma)
Run the PostgreSQL Docker container on port 5432:

    docker run --name toktickit-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=toktickit -p 5432:5432 -d postgres:16-alpine

Navigate to the server directory, apply database migrations, seed initial category data, and generate Prisma client types:

    cd server
    npx prisma migrate dev --name init
    npx prisma db seed
    npx prisma generate

### 2. Backend Server Setup
From the server directory:

    npm install
    npm run dev

The Express server runs on http://localhost:3000.

### 3. Frontend Client Setup
In a new terminal window, navigate to the client directory:

    cd client
    npm install
    npm run dev

The Vite development server runs on http://localhost:5173.

---

## Seeded Development Accounts

All seeded accounts use the default password: `Password123!`

| Role | Name | Email | Initial Password Status |
| :--- | :--- | :--- | :--- |
| **Requester** | Narin Chaiyo | `narin.chaiyo@example.com` | Normal |
| **Requester** | Pimchanok Rattanakul | `pimchanok.rattanakul@example.com` | Normal |
| **Requester** | Kittisak Boonmee | `kittisak.boonmee@example.com` | Normal |
| **Requester** | Suda Wongsawat | `suda.wongsawat@example.com` | Normal |
| **Requester** | Thanawat Saelim | `thanawat.saelim@example.com` | Must Change Password |
| **Requester (Inactive)** | Inactive Requester | `inactive.requester@example.com` | Inactive |
| **IT Staff** | Somchai Jaidee | `somchai.jaidee@example.com` | Normal |
| **IT Staff** | Anong Prasert | `anong.prasert@example.com` | Normal |
| **IT Staff** | Chaiya Suksan | `chaiya.suksan@example.com` | Normal |
| **IT Staff (Inactive)** | Inactive Staff | `inactive.staff@example.com` | Inactive |
| **Administrator** | System Administrator | `admin@example.com` | Normal |
| **Administrator** | Backup Administrator | `admin.backup@example.com` | Normal |

---

## API Endpoints Overview

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/login` | Authenticates user; sets HTTP-only session cookie | Public |
| POST | `/api/auth/logout` | Clears authenticated session | Authenticated |
| GET | `/api/auth/me` | Returns authenticated user profile | Authenticated |
| POST | `/api/auth/change-password` | Updates password and clears `mustChangePassword` | Authenticated |

### Requester Ticketing (`/api/tickets`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/api/tickets` | Lists owned tickets with pagination, search, and filters | Requester |
| POST | `/api/tickets` | Creates a new ticket with automatic dual-priority initialization | Requester |
| GET | `/api/tickets/:id` | Returns ticket details (metadata, attachments, comments) | Requester (own) / Staff / Admin |
| POST | `/api/tickets/:id/resolve-indicator` | Toggles "Problem Appears Resolved" flag | Requester (own) |
| GET | `/api/tickets/:id/comments` | Lists public comments | Requester (own) / Staff / Admin |
| POST | `/api/tickets/:id/comments` | Posts a public comment | Requester (own) / Staff / Admin |
| GET | `/api/tickets/:id/notes` | Lists private internal notes | IT Staff / Administrator |
| POST | `/api/tickets/:id/notes` | Posts a private internal note | IT Staff / Administrator |
| POST | `/api/tickets/:id/attachments` | Uploads file attachment | Requester (own) |
| GET | `/api/tickets/:id/attachments/:attId/download` | Downloads attachment | Requester (own) / Staff / Admin |
| DELETE | `/api/tickets/:id/attachments/:attId` | Soft-deletes attachment with reason | Requester (own) |

### IT Staff Queue & Operations (`/api/staff`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/api/staff/tickets` | Paginated queue with status, category, priority, and ownership filters | IT Staff / Administrator |
| GET | `/api/staff/assignees` | Lists active IT staff and administrators for reassignment | IT Staff / Administrator |
| PATCH | `/api/staff/tickets/:id/claim` | Claims unassigned ticket; advances New to Open | IT Staff / Administrator |
| PATCH | `/api/staff/tickets/:id/assign` | Assigns ticket to active IT staff/admin; advances New to Open | IT Staff / Administrator |
| PATCH | `/api/staff/tickets/:id/priority` | Updates IT priority (Low, Medium, High, Urgent) | IT Staff / Administrator |
| PATCH | `/api/staff/tickets/:id/status` | Updates ticket status following BR-13 transition matrix | IT Staff / Administrator |

### Administrator User Management (`/api/admin`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/api/admin/users` | Lists users with search and role filter | Administrator |
| POST | `/api/admin/users` | Creates a new user with single role and initial password | Administrator |
| PATCH | `/api/admin/users/:id` | Updates user details; enforces self/last-admin safety guards | Administrator |
| POST | `/api/admin/users/:id/reset-password` | Resets password; forces `mustChangePassword = true` | Administrator |

### Reference & Health
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/api/health` | Health check endpoint | Public |
| GET | `/api/categories` | Returns list of active categories | Authenticated |
| GET | `/api/related-systems` | Returns active related systems | Authenticated |
| GET | `/api/priorities` | Returns priority levels | Authenticated |

---

## Running Test Suites

### Backend Unit & Integration Tests (Vitest + Supertest)

    cd server
    npm test

### Frontend Component Tests (Vitest + React Testing Library)

    cd client
    npm test

### Playwright Multi-Viewport E2E Tests

    npx playwright test e2e/lab-03/ --config=client/playwright.config.ts --workers=1
