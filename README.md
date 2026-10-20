# 🛡️ Secure RESTful CRUD API Engine with Relational Database

### _Progree Backend Development Internship — Task 2_

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-lightgrey.svg?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg?logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-indigo.svg?logo=prisma)](https://www.prisma.io/)
[![Zod](https://img.shields.io/badge/Validation-Zod_v4-brightgreen.svg?logo=zod)](https://zod.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Executive Overview

This repository contains the production-grade implementation of **Task 2: Secured RESTful CRUD API Server with Relational Database** for the **Progree Backend Development Internship**.

The project delivers a scalable, resilient endpoint routing engine designed to execute secure data mutations over an ACID-compliant relational SQL schema. Built with **TypeScript**, **Express 5**, **Prisma ORM**, and **PostgreSQL**, the system establishes defensive request validation pipelines, stateless JWT-based authentication, fine-grained Role-Based Access Control (RBAC), and transactional soft-deletion mechanics.

---

## 🎯 Task Objectives & Deliverables

| Requirement / Objective             | Architectural Implementation                                                                                   |   Status    |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------- | :---------: |
| **Modern Server Framework**         | Node.js + Express 5 with strict TypeScript compile target (`ES2022`, NodeNext)                                 | ✅ Complete |
| **Active SQL Connection & Schemas** | PostgreSQL with normalized, indexed relational data models managed via Prisma migrations                       | ✅ Complete |
| **CRUD Resource Operations**        | Full resource lifecycle (Create, Paginated Read, Update, Soft-Delete) for Users, Projects, Tasks, and Comments | ✅ Complete |
| **Middleware Data Validation**      | Strict schema validation middleware intercepting `req.body`, `req.query`, and `req.params` via **Zod**         | ✅ Complete |
| **Secure Data Mutations**           | Soft-deletes (`isDeleted: true`), ACID transactions (`prisma.$transaction`), and strict authorization guards   | ✅ Complete |

---

## 🏗️ Clean Layered Architecture

The system enforces strict **Separation of Concerns (SoC)** through a multi-tier layered architecture:

```text
src/
├── config/             # Singleton Prisma connection pool & Zod-validated environment
├── controllers/        # Lean HTTP handlers & standardized response formatting
├── services/           # Core business logic, ACID transactions & relational queries
├── routes/             # RESTful routing engine & versioned mounts (/api/v1)
├── middlewares/        # Authentication, Authorization, Zod Validation, Rate Limiting, Error Handling
├── schemas/            # Declarative Zod runtime schemas
├── types/              # Express request augmentations (req.user) & ambient typings
└── utils/              # ApiError, ApiResponse, and asyncHandler higher-order functions
```

### Request Lifecycle Pipeline

```mermaid
flowchart LR
    Client([Client HTTP Request]) --> RateLimit[Rate Limiter Middleware]
    RateLimit --> Helmet[Helmet & CORS Security]
    Helmet --> Auth[JWT Auth Middleware]
    Auth --> Validate[Zod Validation Middleware]
    Validate --> Controller[HTTP Controller]
    Controller --> Service[Business Logic Service]
    Service --> DB[(PostgreSQL via Prisma)]
    DB --> Service
    Service --> Response[Standardized ApiResponse]
    Response --> Client

    Validate -.->|Validation Error| ErrHandler[Centralized Error Handler]
    Service -.->|Business/DB Error| ErrHandler
    ErrHandler -.-> Client
```

---

## 🗄️ Relational Entity-Relationship Model (ERD)

The database schema is fully normalized and indexed to guarantee high-concurrency throughput and relational integrity:

```mermaid
erDiagram
    USER ||--o{ PROJECT : "owns"
    USER ||--o{ PROJECT_MEMBER : "participates in"
    USER ||--o{ TASK : "creates"
    USER ||--o{ TASK : "assigned to"
    USER ||--o{ COMMENT : "authors"

    PROJECT ||--o{ PROJECT_MEMBER : "contains"
    PROJECT ||--o{ TASK : "groups"
    TASK ||--o{ COMMENT : "threads"

    USER {
        string id PK "UUID"
        string email UK "Unique"
        string password "BCrypt Hash (12 rounds)"
        string name "User Full Name"
        enum role "USER | ADMIN"
        boolean isActive "Default: true"
        datetime createdAt
        datetime updatedAt
    }

    PROJECT {
        string id PK "UUID"
        string name "Project Title"
        string description "Optional text"
        string ownerId FK "References User.id"
        boolean isDeleted "Soft Delete Flag"
        datetime createdAt
        datetime updatedAt
    }

    PROJECT_MEMBER {
        string id PK "UUID"
        string projectId FK "References Project.id"
        string userId FK "References User.id"
        enum role "OWNER | ADMIN | MEMBER | VIEWER"
        datetime createdAt
    }

    TASK {
        string id PK "UUID"
        string title "Task Title"
        string description "Task Details"
        enum status "TODO | IN_PROGRESS | DONE | CANCELLED"
        enum priority "LOW | MEDIUM | HIGH | URGENT"
        string projectId FK "References Project.id"
        string creatorId FK "References User.id"
        string assigneeId FK "Nullable references User.id"
        datetime dueDate "Optional ISO"
        boolean isDeleted "Soft Delete Flag"
        datetime createdAt
        datetime updatedAt
    }

    COMMENT {
        string id PK "UUID"
        string content "Comment Content"
        string taskId FK "References Task.id"
        string userId FK "References User.id"
        datetime createdAt
        datetime updatedAt
    }
```

---

## 🔒 Security & Defensive Engineering

1. **Stateless JWT Authentication:**
   - Tokens signed using `HMAC-SHA256` with configurable expiry (`JWT_EXPIRES_IN`).
   - Every protected route verifies signature and validates active database user state.
2. **Defensive Request Validation:**
   - Pre-controller interception using **Zod** schema parsers.
   - Rejects malformed bodies, invalid UUIDs, or unauthorized fields with explicit `400 Bad Request` diagnostics.
3. **Password Security:**
   - Passwords hashed using **bcryptjs** with **12 salt rounds** prior to persistence.
4. **Rate Limiting & DDoS Mitigation:**
   - Custom `express-rate-limit` pipeline restricting abusive client IPs (100 requests / 15 minutes window).
5. **Security Headers & Sanitization:**
   - Integrated **Helmet** headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).
   - CORS whitelisting support.
6. **Data Integrity & Auditability:**
   - High-value resources (Projects, Tasks) implement **Soft Deletes** (`isDeleted: true`) to retain audit histories.

---

## 📡 API Specification Reference (`/api/v1`)

All endpoints respond with a consistent, envelope-structured format:

### 1. Health & Diagnostics

| Method | Endpoint         | Access | Description                                        |
| :----- | :--------------- | :----: | :------------------------------------------------- |
| `GET`  | `/api/v1/health` | Public | System uptime, health status, and server timestamp |

### 2. Authentication

| Method | Endpoint                | Access | Description                                   |
| :----- | :---------------------- | :----: | :-------------------------------------------- |
| `POST` | `/api/v1/auth/register` | Public | Register new user account & issue JWT         |
| `POST` | `/api/v1/auth/login`    | Public | Authenticate credentials & issue JWT          |
| `GET`  | `/api/v1/auth/me`       | Bearer | Retrieve currently authenticated user context |

### 3. Projects (Collaborative Boards)

| Method   | Endpoint                               | Access | Description                                               |
| :------- | :------------------------------------- | :----: | :-------------------------------------------------------- |
| `POST`   | `/api/v1/projects`                     | Bearer | Create a new project (Creator assigned as `OWNER`)        |
| `GET`    | `/api/v1/projects`                     | Bearer | List projects where user is owner or member               |
| `GET`    | `/api/v1/projects/:id`                 | Bearer | Fetch complete project graph (Owner, Members, Tasks)      |
| `PATCH`  | `/api/v1/projects/:id`                 | Bearer | Update project title / description (`OWNER`/`ADMIN` only) |
| `DELETE` | `/api/v1/projects/:id`                 | Bearer | Soft-delete project and archive board                     |
| `POST`   | `/api/v1/projects/:id/members`         | Bearer | Add team member with custom role (`MEMBER`, `ADMIN`)      |
| `DELETE` | `/api/v1/projects/:id/members/:userId` | Bearer | Remove member from project                                |

### 4. Tasks (Resource CRUD Engine)

| Method   | Endpoint            | Access | Description                                                   |
| :------- | :------------------ | :----: | :------------------------------------------------------------ |
| `POST`   | `/api/v1/tasks`     | Bearer | Create task card attached to a project                        |
| `GET`    | `/api/v1/tasks`     | Bearer | Query paginated tasks (`?projectId=&page=1&limit=10&status=`) |
| `GET`    | `/api/v1/tasks/:id` | Bearer | Retrieve task detail with creator, assignee & comments        |
| `PATCH`  | `/api/v1/tasks/:id` | Bearer | Secure partial update (status mutation, priority, due date)   |
| `DELETE` | `/api/v1/tasks/:id` | Bearer | Soft-delete task (preserves audit records)                    |

### 5. Comments (Communication Pipeline)

| Method   | Endpoint                             | Access | Description                                |
| :------- | :----------------------------------- | :----: | :----------------------------------------- |
| `POST`   | `/api/v1/tasks/:taskId/comments`     | Bearer | Create discussion comment on task          |
| `GET`    | `/api/v1/tasks/:taskId/comments`     | Bearer | List threaded comments with author details |
| `DELETE` | `/api/v1/tasks/:taskId/comments/:id` | Bearer | Delete comment (Author or Admin only)      |

---

## 📦 Standard Envelope Payload Format

### Successful Response (`200 OK` / `201 Created`)

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
      "projectId": "f20c24a9-2291-49eb-a749-48dfe1dd1cb7",
      "creator": {
        "id": "c205d48e-c98e-4fa2-b8e3-b777ce442c18",
        "name": "Project Lead",
        "email": "lead@company.com"
      },
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
    {
      "field": "body.email",
      "message": "Invalid email address format"
    },
    {
      "field": "body.password",
      "message": "Password must be at least 6 characters long"
    }
  ]
}
```

---

## ⚡ Local Setup & Execution Guide

### 1. Clone Repository & Install Dependencies

```powershell
git clone https://github.com/imtiazaly/Progree_secure_rest_api_engine.git
cd Progree_secure_rest_api_engine
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` into `.env`:

```powershell
cp .env.example .env
```

Ensure your database connection string and secret key are properly set:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/secure_rest_api_engine?schema=public"
JWT_SECRET="super_secure_jwt_secret_key_min_8_chars"
JWT_EXPIRES_IN="1d"
```

### 3. Run Database Migrations

Synchronize schema with PostgreSQL:

```powershell
npx prisma migrate dev
```

### 4. Start the Application Engine

```powershell
# Development mode with hot-reloading (via tsx watch)
npm run dev

# Production build & execution
npm run build
npm start
```

---

## 👨‍💻 Developer & Attribution

- **Developer:** Imtiaz Aly
- **Program:** Progree Internship Program
- **Track:** Backend Development
- **Module:** Task 2 — Secured RESTful CRUD API Server with Relational Database
- **Repository:** [Progree_secure_rest_api_engine](https://github.com/imtiazaly/Progree_secure_rest_api_engine)
