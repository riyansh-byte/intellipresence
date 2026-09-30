# IntelliPresence — AWS Lambda Serverless Integration

This directory contains event-driven AWS Lambda microservices for biometric processing and report generation.

---

## 🏗️ Architecture

```
1. S3 Upload Event:
   Smart Camera / Teacher Upload ──► S3 (captures/{session_id}/photo.jpg)
                                              │
                                              ▼ (ObjectCreated)
                                   AttendanceProcessor Lambda
                                              │
                                              ▼ Rekognition Match
                                   Backend API / DB Upsert

2. Async Report Compilation:
   Admin Clicks "Compile Report" ──► Backend API
                                              │
                                              ▼ Invokes Lambda / SQS
                                   ReportGenerator Lambda
                                              │
                                              ▼ Generates CSV/PDF
                                   S3 (compiled-reports/) ──► Presigned Download URL
```

---

## 📦 Lambda Functions

| Function | Trigger | Memory | Timeout | Purpose |
|---|---|---|---|---|
| [`attendance_processor`](./attendance_processor/lambda_function.py) | `s3:ObjectCreated:*` | 512 MB | 30s | Reads classroom image, queries Rekognition, saves present roll call. |
| [`report_generator`](./report_generator/lambda_function.py) | API / SQS | 1024 MB | 60s | Compiles institution reports, writes to S3, returns presigned download URL. |

---

## 🚀 Deployment (AWS SAM)

```bash
# Validate template syntax
sam validate -t template.yaml

# Build & Deploy
sam build
sam deploy --guided
```
