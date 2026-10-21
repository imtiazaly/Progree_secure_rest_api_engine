# Secure RESTful CRUD API Engine with Relational Database

### *Progree Backend Development Internship — Task 2*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-lightgrey.svg?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg?logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-indigo.svg?logo=prisma)](https://www.prisma.io/)
[![Zod](https://img.shields.io/badge/Validation-Zod_v4-brightgreen)](https://zod.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Executive Overview

This repository contains the production-grade implementation of **Task 2: Secured RESTful CRUD API Server with Relational Database** for the **Progree Backend Development Internship**.

The project delivers a scalable, resilient endpoint routing engine designed to execute secure data mutations over an ACID-compliant relational SQL schema. Built with **TypeScript**, **Express 5**, **Prisma ORM**, and **PostgreSQL**, the system establishes defensive request validation pipelines, stateless JWT-based authentication, fine-grained Role-Based Access Control (RBAC), and transactional soft-deletion mechanics.

---

## Task Objectives and Deliverables

| Requirement | Architectural Implementation | Status |
| :--- | :--- | :---: |
| **Modern Server Framework** | Node.js + Express 5 with strict TypeScript (`ES2022`, NodeNext) | ✅ Complete |
| **Active SQL Connection and Schemas** | PostgreSQL with normalized, indexed relational models via Prisma migrations | ✅ Complete |
| **CRUD Resource Operations** | Full resource lifecycle for Users, Projects, Tasks, and Comments | ✅ Complete |
| **Middleware Data Validation** | Zod schema validation intercepting `body`, `query`, and `params` (passwords min 8 chars) | ✅ Complete |
| **Secure Data Mutations** | Soft-deletes for projects & tasks, hard-deletes for comments, and strict authorization guards | ✅ Complete |

---

## Clean Layered Architecture

The system enforces strict **Separation of Concerns** through a multi-tier layered architecture:

```text
src/
├── config/             # Singleton Prisma connection pool & Zod-validated environment
├── controllers/        # Lean HTTP handlers & standardized response formatting
├── services/           # Core business logic, ACID transactions & relational queries
├── routes/             # RESTful routing engine & versioned mounts (/api/v1)
├── middlewares/        # Authentication, Authorization, Zod Validation, Rate Limiting, Error Handling
├── schemas/            # Declarative Zod runtime schemas
├── types/              # Express request augmentations (req.user) & ambient typings
└── utils/              # ApiError, ApiResponse, assertProjectAccess, and asyncHandler utilities
```

### Request Lifecycle Pipeline

```mermaid
flowchart LR
    A([Client Request]) --> B[Rate Limiter / Auth Limiter]
    B --> C[Helmet + CORS with Credentials]
    C --> D[JWT Auth Middleware]
    D --> E[Zod Validation Middleware]
    E --> F[HTTP Controller]
    F --> G[Business Logic Service]
    G --> H[(PostgreSQL via Prisma)]
    H --> G
    G --> I[Standardized ApiResponse]
    I --> A

    E -.->|400 Validation Error| J[Global Error Handler]
    D -.->|401 Unauthorized| J
    G -.->|Prisma P2002/P2003/P2025 or Business Error| J
    J -.-> A
```

---

## Relational Entity-Relationship Model

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    USER ||--o{ PROJECT_MEMBER : joins
    USER ||--o{ TASK : creates
    USER ||--o{ TASK : assignedTo
    USER ||--o{ COMMENT : writes
    PROJECT ||--o{ PROJECT_MEMBER : has
    PROJECT ||--o{ TASK : contains
    TASK ||--o{ COMMENT : threads

    USER {
        string id PK
        string email
        string password
        string name
        string role
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    PROJECT {
        string id PK
        string name
        string description
        string ownerId FK
        boolean isDeleted
        datetime createdAt
        datetime updatedAt
    }

    PROJECT_MEMBER {
        string id PK
        string projectId FK
        string userId FK
        string role
        datetime createdAt
    }

    TASK {
        string id PK
        string title
        string description
        string status
        string priority
        string projectId FK
        string creatorId FK
        string assigneeId FK
        datetime dueDate
        boolean isDeleted
        datetime createdAt
        datetime updatedAt
    }

    COMMENT {
        string id PK
        string content
        string taskId FK
        string userId FK
        datetime createdAt
        datetime updatedAt
    }
```

---

## Security and Defensive Engineering

| Security Layer | Mechanism | Implementation |
| :--- | :--- | :--- |
| **Authentication** | Stateless JWT (`HMAC-SHA256`) | `jsonwebtoken` with 32+ char secret & configurable expiry |
| **Privilege Escalation Protection** | Strict registration rules | `/register` forces `USER` role; `ADMIN` accounts created only via CLI seed script |
| **Role-Based Access Control** | Multi-tier Project RBAC | Hierarchy: `OWNER` > `ADMIN` > `MEMBER` > `VIEWER` enforced via `assertProjectAccess` |
| **Read-Only Restriction** | VIEWER Permission Guard | Users with `VIEWER` role are strictly read-only (cannot create, edit, or delete tasks/comments) |
| **Role Escalation Guard** | Permission boundaries | Only the project `OWNER` or system `ADMIN` can grant `ADMIN` status to members |
| **Assignee Validation** | Member & status verification | Tasks can only be assigned to active members of the associated project |
| **Password Security** | One-way adaptive hashing | `bcryptjs` with 12 salt rounds (enforced min 8 characters) |
| **Request Validation** | Pre-controller schema enforcement | `Zod` schema parsers on `body`, `query`, and `params` |
| **Strict Auth Limiting** | Brute-force credential protection | Max 10 attempts / 15 min on `/login` and `/register` via `express-rate-limit` |
| **Global Rate Limiting** | Endpoint traffic management | 100 requests / 15 min per IP on general routes (`trust proxy` enabled) |
| **CORS with Credentials** | Origin-whitelisted cross-origin sharing | Dynamic origin checks supporting `credentials: true` without wildcard conflicts |
| **HTTP Headers** | Secure header injection | `Helmet` (`X-Frame-Options`, `HSTS`, `X-Content-Type`) |
| **Deletion Policy** | Soft vs. Hard Deletions | **Projects & Tasks:** Soft-deleted (`isDeleted: true`); **Comments:** Hard-deleted |
| **Cascade Isolation** | Soft-deleted project shielding | Tasks & comments under soft-deleted projects automatically return `404 Not Found` |
| **Error Masking & Mapping** | Standardized status codes | Prisma `P2002` (409), `P2003` (400), `P2025` (404); production internal error masking |
| **DB Transactions** | Multi-step atomicity | `prisma.$transaction()` for atomic project creation with owner assignment |

---

## API Specification Reference

All endpoints respond with a consistent standardized envelope format.

### Health and Diagnostics

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/health` | Public | System uptime, health status, and timestamp |

### Authentication

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | Public (Rate-Limited) | Register user account (default `USER` role) and issue JWT |
| `POST` | `/api/v1/auth/login` | Public (Rate-Limited) | Authenticate credentials and issue signed JWT |
| `GET` | `/api/v1/auth/me` | Bearer | Retrieve currently authenticated user context |

### Projects

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/projects` | Bearer | Create project — creator auto-assigned as `OWNER` |
| `GET` | `/api/v1/projects` | Bearer | List all accessible non-deleted projects for the user |
| `GET` | `/api/v1/projects/:id` | Bearer | Fetch project graph with owner, members, and non-deleted tasks |
| `PATCH` | `/api/v1/projects/:id` | Bearer | Update project name or description (`OWNER` or `ADMIN` only) |
| `DELETE` | `/api/v1/projects/:id` | Bearer | Soft-delete project (`OWNER` or system `ADMIN` only) |
| `POST` | `/api/v1/projects/:id/members` | Bearer | Add member (`ADMIN`, `MEMBER`, `VIEWER`). Only Owner can grant Admin |
| `DELETE` | `/api/v1/projects/:id/members/:userId` | Bearer | Remove member from project |

### Tasks

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/tasks` | Bearer | Create task card attached to a project (Min. `MEMBER` role required) |
| `GET` | `/api/v1/tasks` | Bearer | Query tasks with pagination, filtering, and search (Excludes deleted projects) |
| `GET` | `/api/v1/tasks/:id` | Bearer | Retrieve task with creator, assignee, and comments |
| `PATCH` | `/api/v1/tasks/:id` | Bearer | Update task status, priority, due date, assignee (Min. `MEMBER` role) |
| `DELETE` | `/api/v1/tasks/:id` | Bearer | Soft-delete task (Min. `MEMBER` role required) |

### Comments

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/tasks/:taskId/comments` | Bearer | Post discussion comment on a task (Min. `MEMBER` role required) |
| `GET` | `/api/v1/tasks/:taskId/comments` | Bearer | Retrieve threaded comments with author details |
| `DELETE` | `/api/v1/tasks/:taskId/comments/:id` | Bearer | Hard-delete comment (Author or system Admin only) |

---

## Standardized Envelope Payload Format

### Success Response (`200 OK` / `201 Created`)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tasks retrieved successfully",
  "data": [
    {
      "id": "2cab7cd2-3830-4be8-b2ff-ecf59b80a060",
      "title": "Design Checkout Flow",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "project": { "id": "f20c24a9-...", "name": "E-Commerce App Redesign" },
      "creator": { "id": "c205d48e-...", "name": "Project Lead", "email": "lead@company.com" },
      "assignee": { "id": "d103e57f-...", "name": "Developer", "email": "dev@company.com" },
      "_count": { "comments": 1 }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Validation Error (`400 Bad Request`)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation Failed",
  "errors": [
    { "field": "body.email", "message": "Invalid email address format" },
    { "field": "body.password", "message": "Password must be at least 8 characters long" }
  ]
}
```

### Unauthorized (`401`)

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication token is missing or malformed",
  "errors": []
}
```

---

## Local Setup and Execution Guide

### Prerequisites
- Node.js v18 or higher
- PostgreSQL v14 or higher
- npm

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/imtiazaly/Progree_secure_rest_api_engine.git
cd Progree_secure_rest_api_engine
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Update `.env` with strong configuration credentials:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/secure_rest_api_engine?schema=public"
JWT_SECRET="super_secret_jwt_key_that_is_at_least_32_characters_long_987654321"
JWT_EXPIRES_IN="1d"
CLIENT_URL="http://localhost:5173"

# System Admin Seeding Credentials
ADMIN_EMAIL="admin@mansooba.com"
ADMIN_PASSWORD="AdminSecurePassword123"
ADMIN_NAME="System Admin"
```

### 3. Run Migrations & Seed Admin

```bash
# Apply Prisma Migrations
npm run prisma:migrate

# Seed Initial System Admin User
npm run db:seed
```

### 4. Start Server

```bash
# Development with hot reload
npm run dev

# Production build & start
npm run build
npm start
```

The server starts on `http://localhost:5000`
Health check: `http://localhost:5000/api/v1/health`

---

## Technology Stack

| Layer | Technology | Version |
| :--- | :--- | :--- |
| Runtime | Node.js | v18+ |
| Language | TypeScript | 5.x / 6.x |
| Web Framework | Express.js | 5.x |
| Database | PostgreSQL | 14+ |
| ORM | Prisma | 6.x |
| Validation | Zod | 4.x |
| Authentication | JSON Web Token | 9.x |
| Password Hashing | bcryptjs | 3.x |
| Security Headers | Helmet | 8.x |
| Rate Limiting | express-rate-limit | 8.x |
| Dev Runtime | tsx watch | 4.x |

---

## Developer and Attribution

- **Developer:** Imtiaz Aly
- **Program:** Progree Internship Program
- **Track:** Backend Development
- **Task:** Task 2 — Secured RESTful CRUD API Server with Relational Database
- **Repository:** [Progree_secure_rest_api_engine](https://github.com/imtiazaly/Progree_secure_rest_api_engine)

---

Licensed under the [MIT License](LICENSE)
