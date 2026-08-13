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

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | /api/health | Returns server health status |
| GET | /api/categories | Returns list of categories sorted by ID |

---

## Running Test Suites

### Backend Unit & Integration Tests

    cd server
    npm test

### Frontend Component Tests

    cd client
    npm test
