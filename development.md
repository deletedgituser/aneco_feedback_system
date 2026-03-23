# ANECO Feedback System - Development Specification

## 1. Document Purpose
This document is the approved implementation blueprint for the ANECO Feedback System using Next.js + MySQL (XAMPP), with a focus on clean architecture, modular code, scalability, security, and reusable components/pages.

This specification is based on approved clarifications and supersedes conflicting assumptions from earlier drafts.

## 2. Approved Clarifications Summary

### 2.1 Delivery Strategy
- Delivery model: **Phased delivery**.

### 2.2 Localization
- Supported languages from day one:
  - English
  - Bisaya

### 2.3 Authentication and Sessions
- Login UX: **Single shared login page** with role-based routing.
- Session/security approach approved as combined:
  - JWT stored in **HTTP-only cookies**
  - Server-side session tracking/validation

### 2.4 Password and Access Recovery
- Password policy:
  - Minimum 8 characters
  - Must include uppercase, lowercase, number, special character
  - Password history check enabled
  - Password expiry policy is configurable (supports expiry or no-expiry mode)
- Login rate limiting: not required at this stage
- Password reset: **Admin reset only** (no self-service forgot password flow)

### 2.5 Roles
- Admin restrictions confirmed:
  - Cannot create/edit forms
  - Cannot view analytics dashboards
  - Cannot submit feedback
  - Can manage personnel accounts
  - Can view system logs (personnel actions + feedback submission logs)
- Personnel:
  - Can create/edit/manage forms
  - Can access analytics and exports
  - Forms are system-wide and not ownership-restricted for editing

### 2.6 Form and Submission Experience
- Public access mode: **Kiosk mode**
- Landing page in kiosk mode: shows available form choices
- Question design constraint at this phase:
  - Unlimited questions allowed per form
  - Rating-only type (smiley/Likert style)
  - Standard 5-point sentiment scale (1 = angry to 5 = smile)
- Reuse of submitter metadata:
  - Name and assisted employee are only reused if user chooses Fill more feedback within the 4-second recognition screen window

### 2.7 Post-Submission Flow
- Recognition screen auto-exits after 4 seconds
- Default redirect after recognition: dashboard form list

### 2.8 Dashboard Priorities
- Personnel dashboard home: analytics snapshot first
- Breadcrumbs: standard breadcrumb behavior

### 2.9 Analytics and Reports
- Analytics scope: include all useful practical metrics
- Export types:
  - Excel
  - PDF
- Report style:
  - Summarized reports and detailed/raw reports supported
  - PDF output should be printable formal report style
- Sentiment analysis in v1: **No**

### 2.10 Logging and Persistence
- Audit logging required
- Data retention: all records stored in database (no planned deletion lifecycle at this stage)

### 2.11 Data and Stack Choices
- Primary keys: auto-increment integers
- Stack decisions:
  - Next.js with folder-based App Router
  - TypeScript
  - Prisma ORM
  - Tailwind CSS
  - Chart.js
- Deployment target: local environment initially (XAMPP-based)
- Quality requirement: automated tests required

## 3. Product Scope and Phases

## 3.1 Phase 1 - Core Foundation (MVP)
- Authentication and role-based routing
- Admin personnel account management (create/edit/deactivate/reset password)
- Kiosk feedback flow with multilingual UI (EN/BIS)
- Form builder for rating-only questions
- Submission recognition screen and fill-more-feedback option
- Basic analytics snapshot and filtering
- Excel/PDF export baseline
- Audit logging for critical events

## 3.2 Phase 2 - Expansion and Hardening
- Improved analytics depth and comparative trends
- Enhanced export templates and formal report formatting
- Advanced query optimizations and indexing review
- Additional security hardening and observability
- UX refinements, animation polish, and accessibility improvements

## 3.3 Phase 3 - Optional Enhancements
- Optional AI/rule-based sentiment module (currently out of scope)
- Additional question types (only if approved later)
- Additional deployment targets beyond local

## 4. Functional Requirements

## 4.1 Frontend Dashboard and UX
- Layout:
  - Two-column shell: collapsible navbar + content area
  - Responsive behavior for laptop, tablet, and phone
- Navigation:
  - Standard breadcrumb display in content area
- Design language:
  - Minimalist modern styling
  - Clear visual hierarchy and readability-first spacing
- Component standards:
  - Reusable page/component architecture
  - Consistent animation for modals, toasts, buttons, and page transitions

## 4.2 Kiosk User Flow
1. Kiosk landing displays list/cards of available forms.
2. User selects a form and proceeds to feedback entry page.
3. Optional metadata fields:
   - user_name
   - assisted_employee
4. User completes smiley-based 5-point rating questions.
5. On submit, recognition screen appears.
6. Recognition screen behavior:
   - Auto-redirect in 4 seconds to dashboard form list
   - Optional Fill more feedback action (within 4 seconds)
7. If Fill more feedback is chosen within window:
   - Reuse user_name and assisted_employee for next submission

## 4.3 Form Management
- Personnel can create and edit forms.
- Forms are not personnel-owned in terms of edit rights.
- Any active personnel can update existing forms.
- Forms support unlimited rating questions.
- Question type in this phase is fixed to rating scale.

## 4.4 Analytics
- Personnel-only analytics dashboard with filters and exports.
- Minimum filters:
  - date range
  - form
  - assisted employee
- KPI set (initial practical baseline):
  - total submissions
  - average rating
  - rating distribution (1-5)
  - submissions over time
  - per-form performance
  - per-question performance
- Visualization engine: Chart.js

## 4.5 Exporting
- Export to Excel and PDF.
- Support two report modes:
  - Summary report
  - Detailed/raw report
- PDF output must be printable formal report format.

## 5. Role and Access Matrix

| Capability | Admin | Personnel | Kiosk User |
|---|---:|---:|---:|
| Login | Yes | Yes | No |
| Manage personnel accounts | Yes | No | No |
| Reset personnel passwords | Yes | No | No |
| Create/edit forms | No | Yes | No |
| View analytics | No | Yes | No |
| Export reports | No | Yes | No |
| Submit feedback | No | No | Yes |
| View system and submission logs | Yes (logs only) | No | No |

## 6. Security and Backend Standards

## 6.1 Authentication and Session Security
- Shared login endpoint with role resolution.
- JWT token stored in HTTP-only secure cookie.
- Server-side session registry used to validate active sessions and allow revocation.
- Session expiration enforced by configurable TTL.
- CSRF protection on state-changing endpoints.
- Secure cookie flags:
  - HttpOnly
  - Secure (in production)
  - SameSite policy based on deployment profile

## 6.2 Password Security
- bcrypt hashing for passwords.
- Enforce approved complexity policy.
- Password history validation on change/reset.
- Password expiry behavior is policy-configurable.

## 6.3 Authorization
- Strict role-based middleware:
  - Admin routes limited to account and log modules.
  - Personnel routes limited to form and analytics modules.
  - Kiosk endpoints only for public form listing and submission.

## 6.4 Data Protection
- All DB access through Prisma parameterized queries.
- Input validation at API boundary using schema validation.
- Output sanitization for user-facing strings where needed.
- Centralized error handling without leaking internals.

## 6.5 Audit Logging
Log at minimum:
- Personnel account create/edit/deactivate/reset by admin
- Form create/edit/publish/update by personnel
- Feedback form submissions from kiosk
- Authentication events (success/fail) where practical

Log record should include:
- actor_role
- actor_id (nullable for kiosk)
- action_type
- target_type
- target_id
- metadata JSON
- occurred_at

## 7. Database Design (MySQL via XAMPP)

## 7.1 Core Tables

### admins
- admin_id (PK, auto-increment)
- username (unique)
- password_hash
- created_at

### personnel
- personnel_id (PK, auto-increment)
- name
- email (unique)
- password_hash
- profile_image (nullable)
- created_by_admin (FK -> admins.admin_id)
- is_active (default true)
- created_at
- updated_at

### forms
- form_id (PK, auto-increment)
- title
- description (nullable)
- language
- is_active (default true)
- created_by_personnel_id (nullable FK -> personnel.personnel_id)
- created_at
- updated_at

Note: forms are editable by any personnel; created_by_personnel_id is metadata only, not an ownership gate.

### questions
- question_id (PK, auto-increment)
- form_id (FK -> forms.form_id)
- type (fixed enum value: smiley_rating)
- label
- display_order
- created_at
- updated_at

### feedback
- feedback_id (PK, auto-increment)
- form_id (FK -> forms.form_id)
- user_name (nullable)
- assisted_employee (nullable)
- submitted_at

### responses
- response_id (PK, auto-increment)
- feedback_id (FK -> feedback.feedback_id)
- question_id (FK -> questions.question_id)
- answer_value (tinyint: 1-5)

### audit_logs
- log_id (PK, auto-increment)
- actor_role (admin/personnel/kiosk/system)
- actor_id (nullable)
- action_type
- target_type
- target_id (nullable)
- metadata_json
- occurred_at

## 7.2 Indexing
Required baseline indexes:
- feedback(form_id, submitted_at)
- forms(created_by_personnel_id)
- questions(form_id, display_order)
- responses(question_id)
- audit_logs(occurred_at)
- audit_logs(action_type)

## 7.3 Data Integrity Rules
- Foreign key constraints enabled.
- Soft deactivation for personnel/forms via is_active.
- No cascade-delete for business-critical records.
- Historical submissions remain immutable once saved.

## 8. API and Module Architecture

## 8.1 Backend Modules
- auth
- personnel-admin
- forms
- kiosk-submission
- analytics
- exports
- audit-logs

Each module should have:
- route handlers
- service layer
- repository/data layer
- DTO/validation schemas
- unit tests

## 8.2 Naming and Clean Code Rules
- Use clear, standardized naming (no abbreviations that reduce readability).
- Keep functions focused and small.
- No business logic in UI components.
- No direct DB calls from page components.
- Shared utilities for common concerns (validation, formatting, auth guards, logging).

## 8.3 Frontend Structure
- App Router folder-based pages.
- Shared reusable UI components:
  - layout shell
  - breadcrumb
  - form cards
  - rating input
  - modal/toast primitives
  - charts wrappers
- Feature-based module folders for maintainability.

## 9. UI/UX and Interaction Standards
- Responsive first implementation across target breakpoints.
- Keyboard navigable critical paths.
- High contrast and readable typography.
- Smooth but restrained transitions for form steps and feedback states.
- Clear success/failure states and actionable empty states.

## 10. Internationalization Strategy
- Language resources externalized in dictionary files.
- Locale-aware route or state handling for EN/BIS.
- All labels/messages and validation text translatable.
- Date/time formatting locale-aware where shown.

## 11. Analytics and Reporting Design

## 11.1 Chart Set (Initial)
- Submissions trend line (time series)
- Rating distribution bar chart
- Per-form average rating chart
- Per-question rating heat/summary chart

## 11.2 Filtering
- Form
- Assisted employee
- Date range

## 11.3 Exports
- Excel:
  - Summary worksheet
  - Detailed worksheet
- PDF:
  - Formal printable summary report
  - Optional annex section for detailed tables

## 12. Testing and Quality Gates

## 12.1 Automated Testing Scope
- Unit tests for services and validators.
- Integration tests for API routes and auth/role guards.
- E2E tests for critical flows:
  - Login and role routing
  - Personnel form management
  - Kiosk feedback submission and recognition screen
  - Export generation

## 12.2 Quality Standards
- TypeScript strict mode enabled.
- Linting and formatting checks in CI.
- Minimum test coverage threshold (to be set in implementation backlog).
- Regression tests required for major workflow changes.

## 13. Deployment and Environment
- Initial environment: local deployment using XAMPP MySQL.
- Environment variable management for secrets and DB credentials.
- Separate configs for development and production readiness.

## 14. Non-Functional Targets
- Performance, reliability, and maintainability should follow standard web app best practices.
- Prefer indexed queries and paginated views for scalability.
- Avoid tight coupling to allow future migration and feature expansion.

## 15. Implementation Principles (Mandatory)
- Clean code writing standards.
- Reusability and scalability in both frontend and backend.
- Component and page modularization.
- Security-first defaults.
- Maintainable folder structure and clear separation of concerns.

## 16. Open Policy Flags for Final Confirmation During Build
These are intentionally configurable at implementation time but already allowed by approval:
- Password expiry mode: expiry enabled or disabled by deployment policy.
- Exact analytics KPI subset on first release can be refined, but must remain practically useful and exportable.

## 17. Definition of Done (Phase 1)
Phase 1 is complete when:
- Shared login + role routing is operational.
- Admin can manage personnel and view logs only.
- Personnel can create/edit rating-only forms and view analytics/exports.
- Kiosk users can submit multilingual feedback with 4-second recognition flow.
- Audit logs capture critical actions and submissions.
- Excel/PDF exports produce summary and detailed outputs.
- Automated test suite runs and passes for critical workflows.
