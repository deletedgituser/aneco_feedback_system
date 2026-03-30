# ANECO Feedback System

A modern, production-ready feedback collection and analytics platform built with **Next.js 16**, **React 19**, **Prisma 6**, and **MySQL**. Features kiosk-based form submission, personnel response analytics, personnel account management, and comprehensive administrative controls.

**Status**: ✅ Fully Functional | Phase: Account Management + Analytics + Kiosk UX Complete

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Database](#database)
- [User Roles](#user-roles)
- [API Overview](#api-overview)
- [Development](#development)

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** 20+ 
- **MySQL** (via XAMPP or standalone) on `localhost:3306`
- **npm** or equivalent package manager

### Setup (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Update DATABASE_URL and JWT_SECRET in .env

# 3. Generate Prisma client
npm run db:generate

# 4. Apply database migrations
npm run db:deploy

# 5. Seed initial admin account
npm run db:seed

# 6. Start development server
npm run dev
```

Navigate to **http://localhost:3000** and log in with admin credentials from `.env`.

---

## ✨ Features

### ✅ Authentication & Security
- **Unified Login**: Single login page supporting multiple roles (Admin, Personnel)
- **Flexible Credentials**: Admin uses username; Personnel can login with email, username, or name
- **Session Management**: JWT tokens stored in HttpOnly secure cookies
- **Password Policy**: 8+ characters with uppercase, lowercase, number, and special character requirements
- **Password History**: Tracks password changes; prevents reuse
- **Audit Trail**: Comprehensive logging of all administrative actions

### ✅ Admin Dashboard  
- **Personnel Account Management**
  - Create, read, update personnel accounts with username, email, name
  - Password reset capability with strength validation
  - Account activation/deactivation
  - Bulk account operations
- **System Audit Logs**
  - Filter by actor role, action type, date range
  - Export audit history as Excel/PDF
  - Track login events, account changes, data exports, feedback submissions

### ✅ Personnel Dashboard
- **Analytics Dashboard**
  - Total submissions, average rating, total forms at a glance
  - Rating distribution chart (vertical bar chart with color-coding by satisfaction level)
  - Weekly trend analysis (line chart)
  - Per-form performance metrics
- **Form Management**
  - Create, edit, publish forms
  - Support for unlimited questions
  - Multiple language support (English, Bisaya)
  - Form status toggling (Active/Inactive)
- **Response Analytics**
  - View all feedback submissions
  - Per-response sentiment badges (Positive/Negative/Neutral)
  - Per-question performance table with aggregated stats
  - Tabbed view: Individual responses + Form-level analytics
  - Export reports as Excel/PDF
- **Personnel Profile**
  - Read-only profile page with 2-column layout
  - View username, name, email, account status, created date
  - Accessible from dashboard top-right user badge

### ✅ Kiosk (Public) Mode
- **Public Form Access**
  - No authentication required
  - Grid of active forms with title, description, language badge
  - One-click form access
- **Rating Submission**
  - One question per screen (progressive disclosure)
  - Smiley rating input (1-5 scale)
  - Optional name and assisted employee fields
  - Name persistence across sessions
- **Thank You Screen**
  - 4-second countdown confirmation
  - Auto-redirect back to form listing
  - Encouraging feedback message

---

## 🛠️ Technology Stack

| Component | Technology | Version |
|---|---|---|
| **Framework** | Next.js with App Router | 16.2.1 |
| **Language** | TypeScript | 5 |
| **UI Framework** | React | 19.2.4 |
| **Styling** | Tailwind CSS | 4 |
| **ORM** | Prisma | 6.16.2 |
| **Database** | MySQL | 8+ |
| **Auth** | JWT + HttpOnly Cookies | - |
| **Charts** | Chart.js + react-chartjs-2 | 4.5.1 |
| **Icons** | Lucide React | 0.577.0 |
| **Export** | XLSX + PDF Kit | 0.18.5 |
| **Validation** | Zod | Latest |
| **Password Hashing** | bcryptjs | 3.0.3 |

---

## 📁 Project Structure

```
aneco_feedback_system/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Authentication routes
│   │   └── login/page.tsx
│   ├── (dashboard)/               # Personnel-only routes
│   │   ├── layout.tsx             # Dashboard layout with sidebar
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Analytics dashboard
│   │   │   ├── layout.tsx         # Segment layout for nested routes
│   │   │   └── profile/
│   │   │       └── page.tsx       # Personnel profile (2-column layout)
│   │   ├── forms/page.tsx         # Form listing
│   │   ├── forms/[formId]/page.tsx # Form details
│   │   ├── responses/page.tsx     # Response listing
│   │   └── responses/[formId]/page.tsx # Form responses
│   ├── admin/                     # Admin-only routes
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Admin dashboard
│   │   ├── accounts/
│   │   │   ├── page.tsx           # Personnel list with add button
│   │   │   ├── new/page.tsx       # Add account form
│   │   │   └── [id]/edit/page.tsx # Edit account form
│   │   └── logs/page.tsx          # Audit logs
│   ├── kiosk/                     # Public routes (no auth)
│   │   ├── page.tsx               # Form listing
│   │   ├── forms/[formId]/page.tsx # Form submission
│   │   └── thank-you/page.tsx     # Thank you confirmation
│   ├── api/                       # API routes
│   │   ├── auth/               # Login/logout endpoints
│   │   ├── admin/accounts/     # Account management API
│   │   ├── analytics/          # Analytics endpoints
│   │   ├── exports/            # Report generation
│   │   ├── forms/              # Form API
│   │   └── kiosk/              # Kiosk submission API
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page (redirects based on role)
│   ├── globals.css                # Global styles + Tailwind theme
│   └── generated/                 # Prisma client (auto-generated)
├── components/                    # React components
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx, input.tsx, card.tsx, etc.
│   │   ├── PasswordStrengthIndicator.tsx
│   │   ├── SentimentBadge.tsx
│   │   └── index.ts              # Component exports
│   ├── auth/                     # Auth-specific components
│   │   └── login-form.tsx
│   ├── admin/                    # Admin components
│   ├── dashboard/                # Dashboard components
│   ├── kiosk/                    # Kiosk components
│   ├── responses/                # Response analytics components
│   │   ├── RatingDistributionChart.tsx
│   │   ├── PerQuestionPerformanceTable.tsx
│   │   └── ResponseCardTabs.tsx
│   └── navigation/               # Navigation components
├── lib/                          # Utility functions
│   ├── auth/
│   │   ├── session.ts           # JWT + session management
│   │   └── password.ts          # Password hashing
│   ├── validation.ts            # Zod schemas
│   ├── admin-account.ts         # Account validation helpers
│   ├── sentiment.ts             # Sentiment calculation
│   ├── per-question-stats.ts    # Analytics aggregation
│   ├── password-strength.ts     # Password validation rules
│   ├── audit.ts                 # Audit logging
│   ├── prisma.ts                # Prisma client singleton
│   └── cn.ts                    # Tailwind classnames utility
├── prisma/                      # Database
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Database seeding
│   └── migrations/              # Database migrations
├── types/                       # TypeScript type definitions
│   └── index.ts
├── public/                      # Static assets
├── scripts/                     # Utility scripts (empty after cleanup)
├── .env.example                 # Environment template
├── .env                         # Environment (git-ignored)
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies
└── codebase.md                  # Comprehensive codebase documentation
```

---

## 🔧 Setup Instructions

### 1. Environment Configuration

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Update with your values:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/aneco_feedback_system

# JWT
JWT_SECRET=your-secure-secret-key-here-minimum-32-characters
JWT_EXPIRES_IN=1d

# Environment
NODE_ENV=development

# Initial Admin (used by seed script)
ADMIN_INIT_USERNAME=admin
ADMIN_INIT_PASSWORD=Admin@123456
```

### 2. Database Setup

Ensure MySQL is running:

```bash
# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:deploy

# Seed initial admin account
npm run db:seed
```

This will:
- Create all required tables (Admin, Personnel, Form, Question, Feedback, Response, Session, PasswordHistory, AuditLog)
- Insert initial admin account with credentials from `.env`
- Log the seed event in audit trail

### 3. Install Dependencies & Start

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 🗄️ Database

### Schema Overview

**Core Tables:**
- **Admin** - Administrator accounts
- **Personnel** - Personnel accounts (educators, staff)
- **Form** - Feedback forms
- **Question** - Form questions (currently: smiley rating only)
- **Feedback** - Submitted feedback records
- **Response** - Individual rating responses to questions
- **Session** - Active session tokens
- **PasswordHistory** - Password change history
- **AuditLog** - System audit trail

**Key Features:**
- All queries parameterized via Prisma (no SQL injection risk)
- Indexes on frequently queried fields for performance
- Cascade delete policies for data integrity
- Timestamp tracking (createdAt, updatedAt) on all entities

---

## 👥 User Roles

### Admin
- Manage personnel accounts (create, edit, deactivate)
- View system audit logs
- Access admin dashboard
- **Cannot**: Create forms, submit feedback, view analytics

### Personnel
- Create and manage forms
- View feedback analytics and response details
- Export reports (Excel/PDF)
- Access personnel dashboard with analytics
- View own profile
- Submit feedback (in kiosk mode, no auth required)

### Kiosk (Public)
- View available forms
- Submit feedback without authentication
- No access to admin or personnel features
- Name and assisted employee optional

---

## 🔌 API Overview

### Authentication
- `POST /api/auth/login` - Flexible login (admin username OR personnel email/username/name)
- `POST /api/auth/logout` - Logout and revoke session

### Admin Accounts
- `POST /api/admin/accounts` - Create personnel account
- `GET /api/admin/accounts/[id]` - Get account details
- `PUT /api/admin/accounts/[id]` - Update account

### Analytics
- `GET /api/analytics/summary` - Dashboard metrics
- `GET /api/analytics/charts` - Chart data

### Forms & Responses
- `GET /api/forms/[formId]/breadcrumb` - Form title for breadcrumbs
- `POST /api/kiosk/forms` - Submit kiosk feedback

### Exports
- `POST /api/exports/report` - Generate Excel/PDF export

---

## 🚀 Development

### Code Quality

```bash
# Type check
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx

# Both
npm run lint
```

### Database Updates

When modifying `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name my_migration_name
```

This creates a migration file and applies it automatically.

### Production Build

```bash
npm run build
npm start
```

---

## 📝 Key Features by Version

### Current Release ✅
- ✅ Account management with username field
- ✅ 2-column profile page with improved UI
- ✅ Personnel dashboard with analytics
- ✅ Kiosk public form submission
- ✅ Sentiment analysis on responses
- ✅ Audit logging of all actions
- ✅ Password strength validation
- ✅ Session management with JWT

### Future Enhancements 🔮
- Multi-language form rendering (framework ready)
- Advanced filtering and date range analytics
- Scheduled report generation
- Password reset via email
- User profile image uploads
- Form branching logic
- Mobile native app

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Verify MySQL is running
# Check DATABASE_URL in .env
# Ensure database exists: aneco_feedback_system
# Test connection: npm run db:generate
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Authentication Problems
- Check JWT_SECRET is set and consistent
- Verify session cookie is being stored (F12 > Application > Cookies)
- Check if user exists in database for login credentials

### Missing Tables
```bash
# Re-run migrations
npm run db:deploy
npm run db:seed
```

---

## 📚 Documentation

- **[codebase.md](./codebase.md)** - Comprehensive codebase documentation with all routes, components, utilities, and patterns
- **[development.md](./development.md)** - Development specifications and approval clarifications
- **[AGENTS.md](./AGENTS.md)** - Agent configuration guidelines

---

## 🎯 Support

For issues or questions, refer to:
1. **codebase.md** - Complete API and component reference
2. **development.md** - Approved specifications and clarifications
3. **Code comments** - Inline documentation in critical sections

---

**Last Updated**: March 30, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
