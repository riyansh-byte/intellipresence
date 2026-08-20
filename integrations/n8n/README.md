# IntelliPresence — n8n Integration

This directory contains n8n workflow automation configurations for the IntelliPresence platform.

## Structure

```
n8n/
├── workflows/     # Exported n8n workflow JSON files
└── webhooks/      # Webhook endpoint configs and payload schemas
```

## Workflows

| Workflow | Description |
|---|---|
| `attendance-alert.json` | Notify teachers/admins when attendance drops below threshold |
| `daily-report.json` | Auto-generate and email daily attendance summary |
| `late-mark-notification.json` | Trigger SMS/email when a student is marked late |
| `leave-approval.json` | Automate leave request → approval → notification pipeline |

## Setup

1. Install and run n8n (self-hosted or cloud):
   ```bash
   npx n8n start
   ```

2. Import workflow JSON files via the n8n UI:
   - Go to **Workflows → Import from File**
   - Select any `.json` from the `workflows/` folder

3. Configure the IntelliPresence webhook URL in n8n:
   ```
   https://your-domain.app/api/webhooks/n8n
   ```

4. Set n8n credentials for Supabase, SMTP, and Twilio (SMS) as needed.

## Webhook Payload Schema

```json
{
  "event": "attendance.marked",
  "organization_id": "org_xxx",
  "student_id": "stu_xxx",
  "status": "present | absent | late",
  "timestamp": "ISO 8601"
}
```
