# IntelliPresence — AI-Powered Smart Attendance & Workforce Intelligence

> **IntelliPresence** is a production-grade, multi-tenant SaaS platform for managing organizational attendance, tracking real-time workforce indicators, and automating communication workflows — built for schools, colleges, and enterprises.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-Flask-blue?logo=python)](https://flask.palletsprojects.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![AWS](https://img.shields.io/badge/AWS-S3%20%7C%20Rekognition%20%7C%20SES-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![n8n](https://img.shields.io/badge/n8n-Workflow%20Automation-red?logo=n8n)](https://n8n.io/)

---

## 🏗️ Architecture & Technology Stack

IntelliPresence is built on a three-tier cloud-native architecture:

### 1. Frontend Portal — `attendai/` (Next.js 16 App Router)
- Multi-role dashboard system: **Admin**, **Teacher**, **Student** portals
- Dynamic HSL-based Tailwind CSS design system with dark-mode support
- Animated interactions powered by **Framer Motion**
- Client-state orchestration via persistent **Zustand** stores
- Rich data visualization using **Recharts**
- Form validation with **React Hook Form + Zod**

### 2. Server API Layer — `backend/` (Python Flask)
- Decoupled REST controllers with standardized response envelopes
- Custom decorator-based authorization gates decoding **Supabase JWTs**
- **AWS S3** integration for presigned media upload tokens
- **n8n** webhook bridge for automated workflow triggers

### 3. Cloud Database — `database/` (Supabase PostgreSQL)
- Relational schema for profiles, courses, schedules, attendance, and leaves
- Custom indexes for high-performance lookups
- Multi-tenant isolation via Postgres **Row-Level Security (RLS)**

### 4. Cloud Integrations — `integrations/`
- **AWS** — Lambda, S3, Rekognition (biometric attendance), SES (transactional email)
- **n8n** — Automated attendance alerts, daily reports, leave approval workflows

---

## 📂 Project Structure

```
intellipresence/
├── attendai/                       # ⚡ NEXT.JS FRONTEND
│   ├── src/
│   │   ├── app/                    # Routes: admin, teacher, student portals, auth, landing
│   │   │   ├── admin/              # Admin dashboard (departments, reports, analytics)
│   │   │   ├── teacher/            # Teacher portal (classes, attendance, leave review)
│   │   │   ├── student/            # Student portal (heatmap, leave requests)
│   │   │   ├── login/              # Auth flows (login, register, forgot/reset password)
│   │   │   └── setup/              # Organization onboarding wizard
│   │   ├── components/             # Reusable UI (layouts, sidebars, charts, modals)
│   │   ├── lib/                    # Supabase client, mock data, API helpers
│   │   ├── store/                  # Zustand stores (auth, UI, notifications)
│   │   └── types/                  # Normalized TypeScript interfaces
│   └── tailwind.config.ts
│
├── backend/                        # 🐍 FLASK API GATEWAY
│   ├── app/
│   │   ├── auth/                   # Supabase JWT decoder
│   │   ├── config/                 # settings.py environment validator
│   │   ├── middleware/             # Flask request-context auth gates
│   │   ├── routes/                 # Blueprints: auth, students, teachers, courses, invitations
│   │   └── utils/                  # Response envelope standardizers
│   ├── run.py
│   └── requirements.txt
│
├── database/
│   └── schema.sql                  # Supabase DDL — full schema creation script
│
└── integrations/                   # ☁️ THIRD-PARTY INTEGRATIONS
    ├── aws/
    │   ├── lambda/                 # Serverless attendance processing functions
    │   ├── rekognition/            # Face recognition for biometric check-in
    │   ├── s3/                     # Media & report storage
    │   └── ses/                    # Transactional email delivery
    └── n8n/
        ├── workflows/              # Exported n8n workflow JSON files
        └── webhooks/               # Webhook payload schemas & configs
```

---

## ⚙️ Development Setup

### Prerequisites
- Node.js 20+, npm
- Python 3.11+
- A [Supabase](https://supabase.com) project
- (Optional) AWS account & n8n instance for full integration

---

### 1. 🗄️ Database Setup
1. Open your [Supabase](https://supabase.com) project dashboard.
2. Go to the **SQL Editor** tab.
3. Paste the contents of `database/schema.sql` and execute it.
4. Verify that **Row Level Security (RLS)** is enabled on all tables.

---

### 2. 🐍 Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials, AWS keys, and n8n webhook URLs

# Start development server
python run.py
```

Backend runs at `http://localhost:5000`.

---

### 3. ⚡ Frontend Setup

```bash
cd attendai

# Install packages
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase project URL and anon key

# Start development server
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## 🔒 Multi-Tenant Role System

IntelliPresence supports **3 authenticated portals** based on user role claims:

| Role | Portal | Capabilities |
|---|---|---|
| **Organization Admin** | `/admin` | Manage departments, student/teacher directories, audit logs, integrations, reports |
| **Teaching Faculty** | `/teacher` | View teaching schedules, submit attendance, approve/reject leave requests |
| **Enrolled Students** | `/student` | View attendance heatmap, check leave balances, submit leave requests |

---

## ☁️ Cloud Integrations

| Service | Purpose | Folder |
|---|---|---|
| AWS Lambda | Serverless attendance processing & cron jobs | `integrations/aws/lambda/` |
| AWS Rekognition | Biometric face-based attendance check-in | `integrations/aws/rekognition/` |
| AWS S3 | Photo storage, report exports | `integrations/aws/s3/` |
| AWS SES | Attendance alerts, report emails | `integrations/aws/ses/` |
| n8n | Workflow automation (alerts, reports, approvals) | `integrations/n8n/workflows/` |

---

## 📄 License

© 2026 IntelliPresence. All rights reserved.
