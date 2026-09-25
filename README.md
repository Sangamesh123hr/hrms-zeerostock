Markdown
# Zeerostock HRMS & AI Copilot

A full-stack Human Resource Management System (HRMS) built with **Next.js 16**, **PostgreSQL (Neon DB)**, **Prisma ORM**, **NextAuth.js**, and an integrated **AI HR Copilot** powered by NVIDIA Nemotron via OpenRouter.

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
   - Full CRUD operations: Add new employees, update details, view employee lists, and search across staff[cite: 1].
   - Stores employee fields: Name, email, phone number, department, designation, and date of joining[cite: 1].
3. **Attendance Management**
   - View complete company attendance logs[cite: 1].
   - Filter attendance by specific employee and date range[cite: 1].
   - Track detailed check-in and check-out timings[cite: 1].
4. **Leave Management**
   - Centralized leave request queue[cite: 1].
   - Approve or reject employee leave requests in real time[cite: 1].

---

### 👤 Employee Portal Modules

1. **Dashboard**
   - Overview of personal information, today's attendance status, and leave balances[cite: 1].
2. **Attendance**
   - Self-service Check-In and Check-Out actions[cite: 1].
   - View personal historical attendance logs[cite: 1].
3. **Leave Requests**
   - Submit new leave applications[cite: 1].
   - Track live approval status and view leave history[cite: 1].
4. **Profile**
   - View and edit personal profile details[cite: 1].
   - Update account credentials / change password[cite: 1].

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
   git clone [https://github.com/Sangamesh123hr/hrms-zeerostock.git](https://github.com/Sangamesh123hr/hrms-zeerostock.git)
   cd hrms-zeerostock
Install dependencies:

Bash
npm install
Configure Environment Variables:
Create a .env file in the root folder based on .env.example:

Code snippet
DATABASE_URL="postgresql://user:password@ep-sample.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
OPENROUTER_API_KEY="sk-or-v1-your-openrouter-key"
Sync Database Schema:

Bash
npx prisma db push
Run Development Server:

Bash
npm run dev
Open http://localhost:3000 in your browser.