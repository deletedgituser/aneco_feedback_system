ANECO Feedback System
System Overview and Workflow Summary

Presented to:
ANECO Management and Operations Team
Agusan del Norte Electric Cooperative, Inc. (ANECO, Inc.)

Prepared by:
System Development Team

Date: April 20, 2026
System Version: 1.1

A Message to Our Requestor
This system is a role-based feedback collection and analytics platform built for kiosk capture, operational monitoring, and management reporting. It enables public respondents to submit form-based ratings, while personnel and administrators review responses, monitor trends, manage forms, and maintain account-level oversight in one centralized web application.

What Is This System?
It is a web-based application built with Next.js, TypeScript, Prisma, and MySQL. The platform has three main operating sides:

1. Public kiosk flow for collecting feedback without requiring login
2. Personnel dashboard flow for form lifecycle management and response analytics
3. Administrator flow for account governance, form oversight, response visibility, and audit logs

The default site entry redirects to the kiosk area, while protected workflows are available through role-checked routes and session-based access.

Who Uses It?
The platform supports three primary user roles. Their responsibilities are summarized below.

| User Type | Who They Are | What They Do |
|---|---|---|
| Kiosk Respondent | Public user answering active forms | Opens kiosk forms, provides optional name and assisted-employee details, rates questions using a 1-5 smiley scale, adds optional comments/suggestions, submits feedback |
| Personnel User | Authorized staff account for operations and analytics | Signs in, creates and edits forms, manages question order/content, monitors live response dashboards, filters results, views sentiment and tallies, exports reports |
| Administrator | Authorized system admin account | Signs in, manages personnel accounts, reviews logs, accesses admin dashboards, oversees forms and responses, and exports tally reports |

How Does a Kiosk Respondent Use the System?
The kiosk journey begins on the public form listing and moves through form selection, question rating, and thank-you completion.

1. The respondent opens the kiosk landing page and sees active forms only.
2. The respondent selects one form and enters the feedback page.
3. The system displays optional fields for name and assisted employee.
4. The respondent answers rating questions with smiley options from 1 to 5.
5. Each question can include an optional category/part and optional short description for readability.
6. The form ends with a dedicated Overall Satisfaction question.
7. The respondent may submit optional comments or suggestions.
8. On submit, feedback and response rows are saved.
9. A thank-you page appears with a default 5-second countdown and a Fill more feedback option.
10. If Fill more feedback is used, name and assisted employee values are preserved through query parameters.

Figure 1. Kiosk workflow from form selection to thank-you redirect.

How Does Personnel Use the System?
Personnel users operate through protected dashboard routes to manage forms and monitor feedback quality.

1. Personnel signs in through the shared login page.
2. Session cookie and database-backed session records are created.
3. Personnel can create forms with title, language, description, and optional starter questions.
4. During creation, the system always appends a final Overall Satisfaction question.
5. In form detail pages, personnel can add, edit, move, and delete non-overall questions.
6. Overall Satisfaction is protected from deletion and reordering.
7. Responses pages show submission cards, sentiment badges, rating distribution, and response tally analytics.
8. Filtering is available by date range, respondent, and assisted employee.
9. Personnel can export summary and detailed reports from analytics endpoints.

Figure 2. Personnel workflow for form management, response analytics, and export.

What Can the Administrator Do?
Administrator users access a protected admin shell with navigation for dashboard, forms, responses, accounts, and logs.

Administrator capabilities include:
- View analytics snapshot cards and charts in admin dashboard
- Create, edit, activate/deactivate, and delete forms (subject to submission constraints)
- Manage form question metadata and ordering rules
- Review response pages with filters, sentiment indicators, and tallies
- Download tally PDF reports from admin response tabs
- Create new personnel accounts with validation and password-strength requirements
- Edit existing personnel account details and optional password updates
- Activate/deactivate and delete personnel accounts
- Review recent audit logs with actor and target context

What Makes This System Safe and Reliable?
The implementation includes multiple safeguards for access control, session validity, and traceable operations.

- Protected route groups are enforced through middleware/proxy checks for dashboard, forms, responses, and admin paths.
- Authentication uses JWT-based HttpOnly cookies with server-side session rows in the database.
- Session validity includes expiration and revocation checks.
- Role gates separate personnel and admin protected areas.
- Passwords are hashed with bcrypt.
- Account creation and update inputs are validated with Zod-backed schemas.
- Audit events are recorded for login outcomes, form/question mutations, account changes, and kiosk submissions.
- Form deletion is blocked when submissions already exist.
- Database constraints and foreign keys maintain relational integrity.

Technical Architecture Snapshot

Application Stack
- Framework: Next.js 16 App Router
- UI: React 19 with TypeScript strict mode
- Styling: Tailwind CSS 4 with tokenized theme variables in app/globals.css
- Database: MySQL
- ORM: Prisma 6
- Auth: JWT plus HttpOnly cookie session and server-side session table
- Charts and reporting: Chart.js/react-chartjs-2, xlsx, pdf-lib

Core Route Map

Public routes
- /
- /kiosk
- /kiosk/forms/[formId]
- /kiosk/thank-you
- /login

Personnel routes
- /dashboard
- /dashboard/profile
- /forms
- /forms/[formId]
- /responses
- /responses/[formId]

Admin routes
- /admin/dashboard
- /admin/forms
- /admin/forms/[formId]
- /admin/responses
- /admin/responses/[formId]
- /admin/accounts
- /admin/accounts/new
- /admin/accounts/[id]/edit
- /admin/logs

API Endpoints (Current)
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/admin/accounts
- GET, PUT /api/admin/accounts/[id]
- GET /api/analytics/summary
- GET /api/analytics/charts
- GET /api/exports/report
- GET /api/exports/report-tally
- GET /api/forms/[formId]/breadcrumb
- GET /api/kiosk/forms

Data Model Overview
The relational schema supports account governance, feedback capture, and analytics calculations.

Primary models
- Admin
- Personnel
- Form
- Question
- Feedback
- Response
- Session
- PasswordHistory
- AuditLog

Important relationships
- A Form has many Questions and many Feedback entries.
- A Feedback entry belongs to one Form and has many Response rows.
- A Response row links one Feedback to one Question and stores answerValue (nullable).
- A Question includes metadata fields: description, categoryPart, and isOverallSatisfaction.
- Personnel and Admin accounts can have session records; Personnel can be created by Admin.

Enhancements reflected in the current schema and migration history
- Question.description added
- Question.categoryPart added
- Question.isOverallSatisfaction added
- Feedback.comments added
- Response.answerValue updated to nullable to allow unanswered items
- Backfill script ensures each form has an overall satisfaction final question

Operational Behavior Highlights

Form lifecycle rules
- Form creation supports optional starter question lines.
- Overall Satisfaction is auto-appended and marked as final question.
- Adding new questions inserts before Overall Satisfaction when present.
- Overall Satisfaction cannot be deleted and cannot be moved.

Response and analytics behavior
- Kiosk submissions can include answered and unanswered questions.
- Comments/suggestions are persisted with feedback.
- Response detail views include not-answered states where applicable.
- Sentiment badges are computed from available numeric responses.
- Live refresh components trigger periodic view updates (default 15 seconds) for dashboard and response pages.

Reporting behavior
- Summary and detailed report exports are available through report endpoint parameters.
- Excel and PDF output formats are supported for report endpoint.
- Tally PDF export is available through report-tally endpoint and accessible to authorized personnel/admin sessions.

User Experience and Design Direction
The UI follows a clean, data-first dashboard language with tokenized teal-forward styling and consistent card/table layouts. Kiosk pages emphasize clarity through grouped questions, better vertical spacing, clear rating options, and an explicit progress indicator.

We appreciate the opportunity to develop and document this platform, and we remain available for technical support, enhancement planning, and operational turnover.

Respectfully submitted,
System Development Team
ANECO Feedback System