# IntelliPresence — Cloud Architecture & Integrations

Comprehensive enterprise integration suite connecting the IntelliPresence core platform with Amazon Web Services (AWS) and n8n Workflow Automation.

---

## 🏛️ Cloud Architecture Overview

```
                                  ┌────────────────────────────────────────┐
                                  │           Amazon Web Services          │
                                  │                                        │
[ Web Client / Camera ]           │   ┌────────────────────────────────┐   │
         │                        │   │         Amazon S3              │   │
         ├── Presigned Upload ────┼──►│  - attendai-classroom-captures │   │
         │                        │   │  - attendai-reports-storage    │   │
         │                        │   └───────────────┬────────────────┘   │
         ▼                        │                   │ ObjectCreated      │
┌─────────────────┐               │                   ▼                    │
│ Next.js App     │               │   ┌────────────────────────────────┐   │
│ & Flask Backend │               │   │         AWS Lambda             │   │
└────────┬────────┘               │   │  - AttendanceProcessor (512MB) │   │
         │                        │   │  - ReportGenerator (1024MB)    │   │
         │                        │   └───────────────┬────────────────┘   │
         │                        │                   │                    │
         ├──── Biometric Embed ───┼──►┌───────────────▼────────────────┐   │
         │                        │   │       AWS Rekognition          │   │
         │                        │   │  - Face Collections (Vector)   │   │
         │                        │   │  - Optical Liveness Check      │   │
         │                        │   └────────────────────────────────┘   │
         │                        │                                        │
         ├──── Email Advisory ────┼──►┌────────────────────────────────┐   │
         │                        │   │         Amazon SES             │   │
         │                        │   │  - Low Attendance Warnings     │   │
         │                        │   │  - Faculty/Student Invites     │   │
         │                        │   └────────────────────────────────┘   │
         │                        └────────────────────────────────────────┘
         │
         ▼ Anomaly Webhook
┌────────────────────────────────────────┐
│             n8n Automation             │
│  - Anomaly Escalation Workflow         │
│  - Daily 18:00 Slack / Digest Cron     │
└────────────────────────────────────────┘
```

---

## 📁 Subsystem Modules

| Subsystem | Folder | Key Files | Description |
|---|---|---|---|
| **AWS Rekognition** | [`aws/rekognition/`](./aws/rekognition/) | `face_indexer.py`, `attendance_detector.py`, `liveness_check.py` | Vector facial collection management, crowd matching, anti-spoofing heuristics. |
| **AWS Lambda** | [`aws/lambda/`](./aws/lambda/) | `attendance_processor/`, `report_generator/`, `template.yaml` | Serverless event-driven image processing and async report generation. |
| **AWS S3** | [`aws/s3/`](./aws/s3/) | `s3_service.py`, `bucket_policy.json` | Direct client-to-cloud presigned URL generation, 30-day lifecycle expiration. |
| **AWS SES** | [`aws/ses/`](./aws/ses/) | `email_service.py` | Transactional email delivery with automatic simulation fallback. |
| **n8n Automation** | [`n8n/`](./n8n/) | `workflows/attendance_anomaly_escalation.json`, `workflows/daily_attendance_digest.json` | Multi-step webhook and cron workflows with Slack/Email notifications. |

---

## 💼 Interview Talking Points: Why This Architecture?

1. **Why Vector Collections instead of storing face photos?**
   * Storing biometric photographs in a database violates modern privacy regulations (GDPR, FERPA). AWS Rekognition computes mathematical vector embeddings of facial landmarks and discards the raw photo.
2. **Why Presigned URLs instead of uploading through the API server?**
   * Uploading high-resolution classroom images (5–15MB) through Flask would block Python Gunicorn/WSGI worker threads and consume expensive server network egress. Presigned URLs offload bytes directly to S3.
3. **Why S3 Lifecycle Policies?**
   * Classroom photos are transient verification artifacts. Automatically expiring them after 30 days reduces AWS S3 storage bills by ~95%.
4. **Why Decouple Anomaly Escalation into n8n?**
   * Hardcoding Slack, WhatsApp, and SMS alerts into backend routes causes vendor lock-in. Offloading to n8n allows university administrators to adjust communication channels without deploying code.
