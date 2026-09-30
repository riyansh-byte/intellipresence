# IntelliPresence — n8n Workflow Automation

This directory contains production-ready **n8n workflow definitions** for event-driven escalation and automated executive attendance reporting.

---

## ⚡ Workflows Included

| Workflow | Trigger | Action | Target File |
|---|---|---|---|
| **Attendance Anomaly Escalation** | Webhook (`/webhook/attendance-anomaly`) | Evaluates absent streaks, sends Slack alert to faculty channel, emails student advisory | [`attendance_anomaly_escalation.json`](./workflows/attendance_anomaly_escalation.json) |
| **Daily Attendance Digest** | Scheduled Cron (`0 18 * * 1-5`) | Queries `/api/analytics/overview` and posts daily executive digest to leadership Slack | [`daily_attendance_digest.json`](./workflows/daily_attendance_digest.json) |

---

## 🔌 How to Import into n8n

1. Open your n8n instance (Cloud or self-hosted Docker at `http://localhost:5678`).
2. Click **Workflows** ➔ **Import from File...**
3. Select any `.json` file from the `workflows/` directory.
4. Set credentials for Slack and SMTP/SES.
5. Click **Publish / Activate**.

---

## 🔒 Security & Backend Integration

The Flask backend [`workflows.py`](../../backend/app/routes/workflows.py) communicates with n8n using an HMAC shared secret header:
```http
POST https://n8n.yourdomain.com/webhook/attendance-anomaly
X-AttendAI-Secret-Token: your-secret-token
Content-Type: application/json
```
