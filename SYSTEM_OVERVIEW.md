# ANECO Feedback System Overview

## Purpose
ANECO Feedback System is a role-based platform for collecting kiosk feedback and turning it into actionable analytics for personnel and admin teams.

## Roles and Access
- Admin: manages accounts, forms, response oversight, and audit visibility on admin routes.
- Personnel: creates and maintains forms, monitors response analytics, exports reports.
- Kiosk user: public respondent who submits feedback through kiosk routes only.

## End-to-End Flow
1. Form setup
- Personnel or admin creates/edits a form.
- Questions can include label, optional description, and optional category/part.
- System ensures final Overall Satisfaction question is present and kept last.

2. Kiosk submission
- Respondent opens a live form at kiosk route.
- Respondent provides optional identity details, ratings, and optional comments.
- Submission creates a feedback record and related response rows.

3. Analytics and responses
- Personnel/admin response pages compute distribution, averages, per-question stats, and tally views.
- Dashboard cards and charts summarize form and response health.
- Live refresh keeps admin/personnel views updated with recent kiosk submissions.

4. Exporting
- Report routes provide summary/detailed export output (Excel/PDF) based on filtered response data.

## Route Structure
- Auth
  - `app/(auth)/login/page.tsx`

- Personnel
  - `app/(dashboard)/dashboard/page.tsx`
  - `app/(dashboard)/forms/page.tsx`
  - `app/(dashboard)/forms/[formId]/page.tsx`
  - `app/(dashboard)/responses/page.tsx`
  - `app/(dashboard)/responses/[formId]/page.tsx`
  - `app/(dashboard)/dashboard/profile/page.tsx`

- Admin
  - `app/admin/dashboard/page.tsx`
  - `app/admin/accounts/page.tsx`
  - `app/admin/accounts/new/page.tsx`
  - `app/admin/accounts/[id]/edit/page.tsx`
  - `app/admin/forms/page.tsx`
  - `app/admin/forms/[formId]/page.tsx`
  - `app/admin/responses/page.tsx`
  - `app/admin/responses/[formId]/page.tsx`
  - `app/admin/logs/page.tsx`

- Kiosk
  - `app/kiosk/page.tsx`
  - `app/kiosk/forms/[formId]/page.tsx`
  - `app/kiosk/thank-you/page.tsx`

## Key Feature Files
- Kiosk UI and submit flow
  - `components/kiosk/kiosk-question-form.tsx`
  - `components/kiosk/thank-you-countdown.tsx`
  - `app/kiosk/forms/[formId]/page.tsx`

- Response analytics and tables
  - `components/responses/ResponsesPageTabs.tsx`
  - `components/responses/RatingDistributionChart.tsx`
  - `components/responses/SurveyResponseTallyTable.tsx`
  - `components/dashboard/form-response-modal-list.tsx`

- Forms management
  - `app/(dashboard)/forms/page.tsx`
  - `app/(dashboard)/forms/[formId]/page.tsx`
  - `app/admin/forms/page.tsx`
  - `app/admin/forms/[formId]/page.tsx`

- Data and schema
  - `prisma/schema.prisma`
  - `prisma/migrations/20260407000100_form_question_enhancements/migration.sql`
  - `prisma/migrations/20260408000100_allow_null_answer_value/migration.sql`

## Data Model Summary
- `Form` has many `Question` and `Feedback`.
- `Question` stores metadata (`label`, `description`, `categoryPart`, `isOverallSatisfaction`, order).
- `Feedback` stores optional respondent context and comments.
- `Response` stores nullable rating values per question.

## Implementation Notes
- Business logic and role checks are server-side.
- UI uses tokenized styles from global theme variables.
- Live updates in analytics/response pages use interval-based refresh for near-realtime visibility.
