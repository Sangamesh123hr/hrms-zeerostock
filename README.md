# Zeerostock HRMS & HR AI

A full-stack Human Resource Management System (HRMS) built with **Next.js 16**, **PostgreSQL (Neon DB)**, **Prisma ORM**, **NextAuth.js**, and an integrated **HR AI** powered by NVIDIA Nemotron via OpenRouter.

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

### 🤖 Grounded HR AI(Bonus Feature)
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
