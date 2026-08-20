# AttendAI Current Execution Plan

Last updated: 2026-07-08

This plan reflects the current repository state. The frontend is treated as functionally complete for the first production integration pass. The main remaining work is to replace backend mocks with real Supabase/PostgreSQL operations, connect the completed UI to those APIs, then add automation and deployment.

## 1. Current State Snapshot

### Completed or Mostly Complete

- **Frontend application shell**
  - Next.js app exists under `attendai/`.
  - Admin, teacher, student, auth, setup, profile, settings, reports, notification, attendance, and dashboard routes are present.
  - Shared UI components, dashboard layout, top bar, sidebar, profile editor, Zustand stores, and Supabase client scaffolding are present.
  - React Query is already installed and can be used for API integration.

- **Database schema**
  - Supabase/PostgreSQL schema exists in `database/schema.sql`.
  - Core tables are defined for organizations, profiles, departments, courses, teachers, students, attendance sessions, attendance records, leave requests, and audit logs.
  - Row-Level Security policies are defined for tenant isolation.

- **Backend skeleton**
  - Flask app exists under `backend/`.
  - Blueprint routes exist for auth, students, teachers, attendance, analytics, reports, storage, and workflows.
  - JWT middleware exists and decodes Supabase JWTs using `SUPABASE_JWT_SECRET`.
  - S3 and n8n configuration variables are already represented in backend settings.

### Not Yet Production-Ready

- Backend route handlers still return mock data for major resources.
- No PostgreSQL database session/client layer exists yet.
- Backend does not yet consistently load the authenticated user's `profile`, `organization_id`, or tenant role from the database.
- CRUD endpoints are incomplete for organizations, departments, courses, leave requests, and attendance details.
- Frontend screens still need live API integration and mock-data removal.
- n8n workflows are planned but not implemented.
- Docker, CI/CD, and AWS deployment files are not present.

## 2. Target Architecture

### Application Flow

1. User signs in through Supabase Auth from the Next.js frontend.
2. Frontend receives a Supabase access token.
3. Frontend sends requests to Flask with `Authorization: Bearer <token>`.
4. Flask verifies the JWT, loads the matching `profiles` row, and stores user context in `flask.g`.
5. Flask performs database operations scoped by `organization_id`.
6. Attendance and leave events optionally trigger n8n webhooks.
7. Reports and exported assets are stored in S3.

### Stack Decisions

- **Frontend**: Keep Next.js, TypeScript, Tailwind CSS, Zustand, React Query, Supabase Auth.
- **Backend**: Keep Flask REST APIs.
- **Database access**: Use SQLAlchemy Core/ORM with `psycopg2` or `psycopg`.
- **Database**: Supabase PostgreSQL with RLS.
- **Automation**: n8n webhooks and scheduled workflows.
- **Cloud**: AWS Amplify for frontend, ECS Fargate for backend, ECR for images, S3 for assets, EC2 or ECS for n8n.

## 3. Execution Phases

## Phase 1: Backend Database Foundation

**Goal**: Give Flask a real database layer and authenticated tenant context.

- [x] Add backend dependencies for PostgreSQL access, preferably `SQLAlchemy` plus `psycopg2-binary` or `psycopg`.
- [x] Add environment variables to `backend/.env.example`:
  - `DATABASE_URL`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_JWT_SECRET`
- [x] Create a backend database module, for example `backend/app/database.py`.
- [x] Create SQLAlchemy models or table definitions matching `database/schema.sql`.
- [x] Add request-scoped database session setup and teardown.
- [x] Update `require_auth` so it verifies the JWT and loads the user's `profiles` row.
- [x] Store these fields in `flask.g`:
  - `user_id`
  - `organization_id`
  - `role`
  - `profile`
- [x] Update `require_role` to use the loaded profile role instead of only JWT `app_metadata`.
- [x] Add a lightweight `/api/auth/me` endpoint that returns the current profile and organization context.
- [ ] Verify the implementation against a live Supabase project with real `DATABASE_URL`, `SUPABASE_JWT_SECRET`, and a valid user/profile row.

**Exit criteria**

- [ ] Flask can connect to Supabase PostgreSQL.
- [ ] `/healthz` still works.
- [ ] A valid Supabase JWT can call `/api/auth/me`.
- [ ] Invalid or expired JWTs fail with 401.
- [ ] Cross-tenant access cannot be performed through backend endpoints.

## Phase 2: Core CRUD APIs

**Goal**: Replace mock backend data with real tenant-scoped CRUD endpoints.

- [ ] Implement Organizations endpoints for org admin workflows where needed.
- [ ] Implement Departments endpoints:
  - list
  - detail
  - create
  - update
  - deactivate/soft delete
- [ ] Implement Courses endpoints:
  - list by department
  - detail
  - create
  - update
  - deactivate/soft delete if schema is extended for it
- [ ] Replace mock Student endpoints with database-backed endpoints:
  - list
  - detail
  - create
  - update
  - deactivate
- [ ] Replace mock Teacher endpoints with database-backed endpoints:
  - list
  - detail
  - create
  - update
  - deactivate
- [ ] Add consistent pagination, filtering, and search parameters for admin directory screens.
- [ ] Add audit log writes for create, update, deactivate, and attendance actions.

**Exit criteria**

- Admin directory screens can be powered entirely by backend APIs.
- All list endpoints are scoped to the authenticated user's `organization_id`.
- Teacher users cannot access admin-only write operations.

## Phase 3: Attendance and Leave Workflows

**Goal**: Make the core product workflow real.

- [ ] Replace `/api/attendance/session` mock logic with an `attendance_sessions` insert.
- [ ] Decide whether frontend `class_id` maps to `courses.id` or whether a separate `classes` table is needed.
- [ ] Replace `/api/attendance/records` mock logic with bulk upsert into `attendance`.
- [ ] Validate statuses against the schema: `present`, `absent`, `late`, `excused`, `holiday`.
- [ ] Add session detail endpoint with enrolled students and existing records.
- [ ] Add attendance history endpoints for student and teacher views.
- [ ] Implement leave request endpoints:
  - student creates leave request
  - student lists own leave requests
  - teacher/admin reviews requests
  - approval can mark records as `excused` where appropriate
- [ ] Trigger absence notification events after records are saved.

**Exit criteria**

- Teacher can create an attendance session.
- Teacher can submit bulk attendance records.
- Student attendance history reflects submitted records.
- Leave requests can be created and reviewed.

## Phase 4: Frontend Live API Integration

**Goal**: Connect the completed frontend to the real backend and remove mock-data dependency from production paths.

- [ ] Create a shared API client in `attendai/src/lib/api`.
- [ ] Read Supabase session token and attach it to Flask API requests.
- [ ] Add `NEXT_PUBLIC_API_BASE_URL` to frontend environment examples.
- [ ] Use React Query for server state on admin, teacher, and student screens.
- [ ] Connect login/register/setup flows to Supabase Auth and backend profile context.
- [ ] Replace mock data imports screen by screen.
- [ ] Add loading, empty, and error states where live data can fail.
- [ ] Confirm role-based routing for org admin, teacher, and student users.

**Suggested integration order**

1. Auth and `/api/auth/me`
2. Admin profile and organization context
3. Departments and courses
4. Students and teachers
5. Teacher attendance session
6. Student attendance and leave views
7. Reports, analytics, notifications, and audit logs

**Exit criteria**

- App works end to end using Supabase Auth plus Flask APIs.
- Mock data is only used for development fixtures or demos.
- Refreshing the browser preserves authenticated state correctly.

## Phase 5: Automation, Reports, and Assets

**Goal**: Add async workflows and production-grade exports.

- [ ] Define n8n webhook contract for absence notifications.
- [ ] Update backend workflow client to sign requests using `N8N_SECRET_TOKEN`.
- [ ] Create n8n absence notification workflow.
- [ ] Create weekly attendance summary workflow.
- [ ] Generate CSV/PDF reports from backend or n8n.
- [ ] Store generated files in S3.
- [ ] Add presigned download URLs for reports.
- [ ] Wire report and notification screens to real data.

**Exit criteria**

- Marking a student absent can trigger an external notification workflow.
- Weekly report generation can run without manual intervention.
- Reports can be downloaded securely.

## Phase 6: Testing and Hardening

**Goal**: Stabilize the system before deployment.

- [ ] Add backend tests for auth, tenant isolation, CRUD, attendance, and leave workflows.
- [ ] Add frontend tests for high-risk flows if the project adopts a test runner.
- [ ] Add backend input validation with Pydantic schemas or equivalent.
- [ ] Normalize API error response shapes.
- [ ] Add rate limiting or abuse protection for auth-sensitive endpoints.
- [ ] Review RLS policies against backend connection mode.
- [ ] Add structured logging for backend requests and workflow dispatches.

**Exit criteria**

- Main workflows are covered by automated tests.
- Invalid input returns predictable 400 responses.
- Auth and tenant isolation behavior is verified.

## Phase 7: Deployment and CI/CD

**Goal**: Move from local development to production deployment.

- [ ] Add backend `Dockerfile`.
- [ ] Add local `docker-compose.yml` for Flask and optional local Postgres testing.
- [ ] Add production environment documentation.
- [ ] Add GitHub Actions for backend lint/test/build.
- [ ] Push backend image to AWS ECR.
- [ ] Deploy backend to ECS Fargate behind an ALB.
- [ ] Deploy frontend to AWS Amplify.
- [ ] Deploy n8n to EC2 or ECS with persistent storage.
- [ ] Configure HTTPS, custom domains, CORS, secrets, and monitoring.

**Exit criteria**

- Frontend, backend, database, S3, and n8n are reachable in a production-like environment.
- CI/CD can deploy from `main`.
- Rollback path is documented.

## 4. Immediate Next Sprint

The next sprint should focus on Phase 1 and the first part of Phase 2.

### Sprint Goal

Make the Flask backend speak to Supabase PostgreSQL and expose authenticated tenant context.

### Recommended Task Order

1. Done: Add backend database dependency and configuration.
2. Done: Implement `backend/app/database.py`.
3. Done: Add SQLAlchemy models/table mappings for `profiles`, `organizations`, `students`, `teachers`, `departments`, `courses`, `attendance_sessions`, `attendance`, and `leave_requests`.
4. Done: Update auth middleware to load `profiles` by JWT subject.
5. Done: Add `/api/auth/me`.
6. Convert students list/detail/create from mock data to database queries.
7. Convert teachers list/create from mock data to database queries.
8. Run backend smoke tests manually with a valid Supabase token.

### First Agent Prompt

```text
Agent, please review current_execution_plan.md. We are starting Phase 1: Backend Database Foundation. Implement the database connection layer, request-scoped SQLAlchemy session handling, authenticated profile loading in Flask middleware, and a real /api/auth/me endpoint. Keep the existing route structure and response envelope style. Do not start frontend changes until Phase 1 exit criteria are met.
```

## 5. Important Implementation Notes

- Keep tenant scoping explicit in backend queries with `organization_id = g.organization_id`.
- Do not trust client-provided `organization_id`.
- Prefer soft delete/deactivation for people and organization records.
- Keep frontend route design intact unless API integration exposes a real mismatch.
- Avoid adding AWS deployment work before local backend integration works.
- Treat `future_development_plan.md` as the architecture reference and this file as the working execution plan.
