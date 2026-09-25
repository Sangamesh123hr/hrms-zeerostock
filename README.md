# Zeerostock HRMS & HR AI

A full-stack Human Resource Management System (HRMS) built with **Next.js 16**, **PostgreSQL (Neon DB)**, **Prisma ORM**, **NextAuth.js**, and an integrated **AI HR Copilot** powered by NVIDIA Nemotron via OpenRouter.

---

## 📸 Screenshots

### Authentication (Login + OTP Verification)
| Login | OTP Verification |
|---|---|
| ![Login page](screenshots/01-login.png) | ![OTP verification](screenshots/02-otp-verification.png) |

### HR Portal

**Dashboard — Leave requests & pending approvals**
![HR dashboard](screenshots/03-hr-dashboard.png)

**Dashboard — Attendance logs**
![HR attendance logs](screenshots/04-hr-attendance-logs.png)

**Profile**
![HR profile](screenshots/05-hr-profile.png)

**AI HR Copilot — Grounded answers from live database context**
![HR AI Copilot](screenshots/08-hr-ai-copilot.png)

### Employee Portal

**Dashboard — Attendance & leave overview**
![Employee portal](screenshots/06-employee-portal.png)

**Submitting a leave request**
![Employee leave request](screenshots/07-employee-leave-request.png)

---

## 📋 Features Implemented

### 🔐 User Authentication & RBAC
- Secure login and logout with password hashing and session management.
- Role-Based Access Control enforcing distinct access permissions for **HR** and **Employee** accounts.

---

### 👔 HR Portal Modules

1. **Dashboard**
   - Displays real-time metrics including total employees, present count today, employees on leave, and recent attendance logs.
2. **Employee Management**
   - Full CRUD operations: Add new employees, update details, view employee lists, and search across staff.
   - Stores employee fields: Name, email, phone number, department, designation, and date of joining.
3. **Attendance Management**
   - View complete company attendance logs.
   - Filter attendance by specific employee and date range.
   - Track detailed check-in and check-out timings.
4. **Leave Management**
   - Centralized leave request queue.
   - Approve or reject employee leave requests in real time.

---

### 👤 Employee Portal Modules

1. **Dashboard**
   - Overview of personal information, today's attendance status, and leave balances.
2. **Attendance**
   - Self-service Check-In and Check-Out actions.
   - View personal historical attendance logs.
3. **Leave Requests**
   - Submit new leave applications.
   - Track live approval status and view leave history.
4. **Profile**
   - View and edit personal profile details.
   - Update account credentials / change password.

---

### 🤖 Grounded AI HR Copilot (Bonus Feature)
- Integrated OpenRouter API (`nvidia/nemotron-3-ultra-550b-a55b:free`) acting as an internal assistant for HR managers.
- Bypasses AI hallucinations by querying `Employee`, `Attendance`, and `Leave` tables concurrently using `Promise.all` via Prisma ORM.
- Grounded in live database context to accurately answer operational questions (e.g., who is present or on leave today).
- Maintains full conversation history arrays (`messages`) to resolve pronouns ("he", "she", "they") across multi-turn chats.

---

## 🚀 Technical Architecture

- **Framework:** Next.js 16 (App Router, Route Handlers)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Neon Serverless DB)
- **ORM:** Prisma ORM
- **Authentication:** NextAuth.js
- **AI Engine:** OpenRouter API (NVIDIA Nemotron-3-Ultra-550B)

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Neon DB)

### Setup Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Sangamesh123hr/hrms-zeerostock.git
   cd hrms-zeerostock
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**

   Create a `.env` file in the root folder based on `.env.example`:

   ```env
   DATABASE_URL="postgresql://user:password@ep-sample.neon.tech/neondb?sslmode=require"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   OPENROUTER_API_KEY="sk-or-v1-your-openrouter-key"
   ```

4. **Sync Database Schema:**

   ```bash
   npx prisma db push
   ```

5. **Run Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Schema & ER Diagram

The database architecture is built on PostgreSQL (Neon DB) using Prisma ORM. Below is the Entity-Relationship structure and complete Prisma schema definition.

### 📊 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o| Employee : "has"
    Employee ||--o{ Attendance : "logs"
    Employee ||--o{ Leave : "requests"

    User {
        string id PK
        string email UK
        string password
        string role
    }
    Employee {
        string id PK
        string userId FK
        string name
        string email UK
        string phone
        string department
        string designation
        datetime dateOfJoining
    }
    Attendance {
        string id PK
        datetime date
        datetime checkIn
        datetime checkOut
        string employeeId FK
    }
    Leave {
        string id PK
        string type
        datetime startDate
        datetime endDate
        string reason
        string status
        string employeeId FK
    }
```

### 📝 Complete Prisma Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  HR
  EMPLOYEE
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
}

enum LeaveType {
  CASUAL
  SICK
  ANNUAL
  MATERNITY
  PATERNITY
}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String
  role      Role      @default(EMPLOYEE)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  employee  Employee?
}

model Employee {
  id            String       @id @default(uuid())
  userId        String       @unique
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  email         String       @unique
  phone         String
  department    String
  designation   String
  dateOfJoining DateTime
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  attendance    Attendance[]
  leaves        Leave[]
}

model Attendance {
  id         String    @id @default(uuid())
  date       DateTime  @default(now())
  checkIn    DateTime  @default(now())
  checkOut   DateTime?
  employeeId String
  employee   Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([employeeId])
  @@index([date])
}

model Leave {
  id         String      @id @default(uuid())
  type       LeaveType   @default(CASUAL)
  startDate  DateTime
  endDate    DateTime
  reason     String
  status     LeaveStatus @default(PENDING)
  employeeId String
  employee   Employee    @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  @@index([employeeId])
}
```

---

## 🤖 AI Usage Disclosure

In compliance with the assignment guidelines, the following is a breakdown of how AI tools were utilized during the development of the Zeerostock HRMS application:

### 1. Scope of AI Usage
AI assistance (specifically Claude / ChatGPT / Gemini) was utilized primarily as a thought partner and debugging aid for:
- **Troubleshooting Technical Edge Cases:** Resolving environment variable caching behaviors in Next.js and fixing HTTP header truncation when integrating with OpenRouter's API endpoints.
- **Prompt Engineering & Context Design:** Designing and refining the Retrieval-Augmented Generation (RAG) system prompt injected into the LLM context to optimize database record retrieval and multi-turn pronoun resolution.
- **Documentation Refinement:** Formatting technical Markdown structures, generating the ASCII ER diagram, and drafting boilerplate submission copy.

### 2. Original & Independent Work
All core application logic, architectural decisions, and code implementation were authored specifically for this project:
- **System Architecture & Database Design:** Designed the full relational database schema (`User`, `Employee`, `Attendance`, `Leave`) using Prisma ORM and deployed it to Neon PostgreSQL.
- **Authentication & Security:** Configured NextAuth.js JWT session handling, role-based access control (HR vs. Employee guards), and password hashing algorithms.
- **Backend & Business Logic:** Implemented Next.js Server Actions and Route Handlers for CRUD operations, attendance tracking, leave requests, and parallel database fetching (`Promise.all`).
- **UI/UX Development:** Built all custom dashboard layouts, modals, tables, and AI Copilot sidebars using Tailwind CSS.
---

## 📝 Approach, Assumptions & Challenges
### 1. Technical Approach
* **Monolithic Next.js 16 Architecture:** Selected Next.js App Router to unify the frontend UI, API route handlers, and server logic into a single performant codebase, reducing deployment complexity.
* **Serverless Relational Database:** Utilized Neon PostgreSQL with Prisma ORM to maintain strict relational constraints between users, employees, attendance logs, and leave requests while benefiting from serverless scaling.
* **Role-Based Access Control (RBAC):** Built session guards around NextAuth.js to explicitly isolate HR administrative capabilities (employee onboarding, attendance oversight, leave decisions) from Employee self-service features.
* **Zero-Hallucination AI Copilot (RAG Engine):** Instead of letting the LLM guess employee data, `/api/hr/ai-assistant` executes parallel Prisma queries (`Promise.all`) across database tables and injects live system state directly into the prompt context before returning responses.

---

### 2. Core Assumptions
* **Single Tenant Organization:** Assumed the system serves a single enterprise (Zeerostock), where all created accounts belong to the same organizational hierarchy.
* **Employee Account Association:** Assumed every employee record corresponds to a registered `User` account with credentials for platform authentication.
* **Working Hours & Daily Attendance:** Assumed standard check-in/check-out logic where an employee registers one primary attendance session per day.
* **OpenRouter Availability:** Assumed reliable network connectivity to OpenRouter endpoints (`nvidia/nemotron-3-ultra-550b-a55b:free`) for handling AI Copilot conversations.

---

### 3. Key Challenges Faced & Solutions

#### Challenge 1: LLM Hallucinations on Operational Queries
* **Problem:** Standard generic AI models hallucinate employee details, attendance metrics, or active leave counts when asked direct questions.
* **Solution:** Implemented a Retrieval-Augmented Generation (RAG) pattern inside the Next.js route handler. By fetching live `Employee`, `Attendance`, and `Leave` tables concurrently using `Promise.all`, the AI receives exact, real-time database context in every prompt.

#### Challenge 2: Multi-Turn Conversation Memory & Pronoun Resolution
* **Problem:** Sequential questions (e.g., *"Who is on leave today?"* followed by *"What is his department?"*) failed when context was lost between API requests.
* **Solution:** Structured the chat endpoint to accept and pass back the complete conversation history array (`messages`), allowing the LLM to preserve context and correctly resolve pronouns ("he", "she", "they").

#### Challenge 3: HTTP Authorization & Header Truncation with OpenRouter
* **Problem:** Standard OpenAI SDK wrappers encountered header validation issues when passing custom OpenRouter metadata (`HTTP-Referer`, `X-Title`).
* **Solution:** Replaced the SDK wrapper in the AI API handler with a direct, clean native `fetch` request using customized headers and standard JSON payload bodies.



---

## 🔗 Links

- **Live Demo:** [hrms-zeerostock-bzve.vercel.app](https://hrms-zeerostock-bzve.vercel.app)

