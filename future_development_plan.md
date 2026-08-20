# AttendAI Enterprise - Future Architecture & Execution Plan

This document outlines the comprehensive architecture and execution plan for the AttendAI platform. It is designed to be used as a master reference guide and handoff document for AI agents and human developers working on future iterations of the project.

## 1. System Architecture Overview

The system follows a modern, decoupled microservices-inspired architecture.

### 1.1 Technology Stack

- **Frontend**: Next.js (React), Tailwind CSS, TypeScript
- **Backend**: Python Flask (RESTful APIs)
- **Database**: PostgreSQL (Supabase with Row-Level Security for multi-tenancy)
- **Automation**: n8n (workflow automation and integrations)
- **Cloud Provider**: Amazon Web Services (AWS)

## 2. Infrastructure & AWS Deployment Strategy

To ensure scalability, security, and high availability, the infrastructure will be hosted primarily on AWS.

### 2.1 Component Mapping

- **Frontend (Next.js)**
  - **AWS Amplify**: Best for Next.js SSR/SSG hosting, providing automated CI/CD directly from the Git repository.
  - **Alternative**: AWS CloudFront + S3, if exported as purely static.
- **Backend (Flask)**
  - **AWS ECS (Elastic Container Service) with Fargate**: Serverless container execution. The Flask app will be Dockerized and run behind an Application Load Balancer (ALB).
  - **AWS ECR**: Stores backend Docker images.
- **Database (PostgreSQL)**
  - **Supabase Cloud (AWS-backed)**: Recommended for out-of-the-box Auth, Realtime, and RLS.
  - **Alternative**: AWS RDS for PostgreSQL if moving away from the Supabase ecosystem, though this requires manually implementing Supabase-specific features.
- **Workflow Automation (n8n)**
  - **AWS EC2 (Docker Compose)**: A dedicated `t3.medium` or `t3.large` instance running the n8n Docker image, backed by an EBS volume for local storage or RDS for its internal database.
- **Storage & Assets**
  - **AWS S3**: Stores student avatars, exported CSV/PDF attendance reports, and organization assets.

### 2.2 Network Architecture

- **VPC**: A dedicated Virtual Private Cloud with public and private subnets.
- **Security Groups**
  - ALB accepts HTTP/HTTPS traffic.
  - ECS Fargate tasks only accept traffic from the ALB.
  - EC2 for n8n accepts HTTPS traffic from internal services and specific webhooks.

## 3. Component Integration & Data Flow

This section describes how the different pieces of the stack communicate with each other.

### 3.1 Frontend to Backend JWT Auth Flow

- **Authentication Trigger**: The Next.js frontend handles login and session recovery via Supabase Client Auth. Upon successful login, Supabase returns a JWT token.
- **Header Injection**: This JWT token is attached as a `Bearer <token>` to the `Authorization` header on all API calls from the Next.js frontend to the Flask backend.
- **Middleware Validation**:
  - The Flask backend middleware uses the Supabase public JWKS endpoint (for ES256) or base64-decoded `SUPABASE_JWT_SECRET` (for HS256) to verify the token's signature, clock-skew, and expiration.
  - The unique subject claim (`sub` field in JWT) is extracted as the user's UUID.
- **Profile & Role Mapping**:
  - The backend queries the `Profile` table using the validated user UUID.
  - If a profile is found, the backend populates Flask's global context object `g` with:
    - `g.user_id` (the user's UUID)
    - `g.role` (`org_admin`, `teacher`, or `student`)
    - `g.organization_id` (used to enforce multi-tenant separation for all queries)
  - Endpoints restrict action endpoints using `@require_role(["role1", "role2"])`.

### 3.2 Multi-Role Invitation Mechanics (Admins & Teachers)

To scale onboarding, both **Admins** and **Teachers** can onboard students:
- **Org Admin**: Has full privileges to invite both Teachers (`POST /invitations/teacher`) and Students (`POST /invitations/student`).
- **Teacher**: Restricted to inviting only Students (`POST /invitations/student`) within their authorized departments.
- **Flow**:
  1. The inviter submits email, full name, student ID, and department.
  2. Flask creates a `pending` record in the database `invitations` table.
  3. Flask triggers Supabase Auth admin API to invite the user and append custom metadata (`organization_id`, `role`, `invitation_id`) to the auth context.
  4. The student receives a recovery/verification email.
  5. The student sets their password, logs in, and the frontend automatically calls `POST /invitations/accept` on the Flask backend.
  6. The backend completes the lifecycle by creating a `Profile` and a `Student` record linked to the authenticated user UUID.

---

## 4. Execution Plan for Future Agents

When handing this project to an AI agent for future development, follow this phased execution plan. Instruct the agent to tackle one phase at a time.

### Phase 1: Backend API Completion & Database Integration

**Goal**: Finalize the Flask APIs and connect them to the Supabase database.

- [x] **Task 1.1**: Connect Flask to PostgreSQL using SQLAlchemy or a direct driver. (Completed: db driver configured).
- [x] **Task 1.2**: Implement Supabase JWT verification middleware in Flask. (Completed: JWT decoding and require_auth middleware functional).
- [ ] **Task 1.3**: Build CRUD endpoints for Organizations, Departments, Courses, Teachers, and Students.
- [ ] **Task 1.4**: Implement the logic for the `/session` and `/records` endpoints to perform actual `INSERT` and `UPDATE` queries in the database.

### Phase 2: Frontend State & Feature Integration

**Goal**: Connect the Next.js UI to the finalized Flask backend.

- [ ] **Task 2.1**: Connect Next.js frontend state store (Zustand/cookies) to Supabase Auth sessions.
- [ ] **Task 2.2**: Integrate the Admin dashboard invitations list and forms with `/invitations/teacher` and `/invitations/student` backend routes.
- [ ] **Task 2.3**: Connect the Teacher student-invitations UI (`/teacher/students`) to the backend `/invitations/student` route (which is already role-authorized for both Admins and Teachers).
- [ ] **Task 2.4**: Build the Teacher Dashboard session initialization and student attendance checklist (Present, Absent, Late bulk edits).
- [ ] **Task 2.5**: Connect Student dashboard statistics and the leave-request submission form (`/student/leave`) to the database endpoints.

### Phase 3: n8n Automation & Webhooks

**Goal**: Offload asynchronous communication and reporting to n8n.

- [ ] **Task 3.1**: Set up a local or cloud n8n instance.
- [ ] **Task 3.2**: Create an n8n workflow with a Webhook trigger for "Absence Notification".
- [ ] **Task 3.3**: Update the Flask `/records` endpoint to fire an HTTP POST to the n8n webhook for any student marked `absent`.
- [ ] **Task 3.4**: Create a scheduled n8n workflow using Cron that generates a weekly PDF attendance summary and emails it to the Organization Admin via AWS SES.

### Phase 4: AWS Infrastructure Deployment (CI/CD)

**Goal**: Move the application from local development to production AWS.

- [ ] **Task 4.1**: Write a `Dockerfile` for the Flask backend and `docker-compose.yml` for local testing.
- [ ] **Task 4.2**: Set up GitHub Actions to build the Docker image and push it to AWS ECR on merge to `main`.
- [ ] **Task 4.3**: Deploy the Next.js app to AWS Amplify via Git connection.
- [ ] **Task 4.4**: Provision the n8n EC2 instance and connect it to a custom subdomain, such as `n8n.attendai.com`.

---

## 5. Instructions for AI Agents

When prompting an agent with this document, use the following template:

```text
Agent, please review the future_development_plan.md master reference. We are currently on [Insert Phase Here, e.g., Phase 2]. Please execute [Insert Task, e.g., Task 2.3]. Read the relevant files in both the frontend and backend directories, ask clarifying questions if needed, and implement the feature according to the architectural layout.
```
