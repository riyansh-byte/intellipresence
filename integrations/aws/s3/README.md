# IntelliPresence — AWS S3 Storage Subsystem

This module handles **private cloud object storage** for raw lecture photos and compiled attendance reports.

---

## 💡 Architecture & Security Highlights

1. **Direct-to-S3 Presigned Uploads**:
   * Instead of uploading 10MB group images through the Flask API (which exhausts server memory and ties up Python workers), the client requests a **short-lived presigned URL** (15-min expiry) and uploads directly to S3.
   * AWS credentials never touch the browser.

2. **Cost Optimization with Lifecycle Rules**:
   * Lecture snapshot photos are automatically permanently deleted after **30 days** using S3 Lifecycle Rules, preventing storage costs from accumulating.

3. **Strict TLS Enforcement**:
   * [`bucket_policy.json`](./bucket_policy.json) rejects any unencrypted HTTP requests, satisfying enterprise compliance standards.
