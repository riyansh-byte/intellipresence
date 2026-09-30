from datetime import datetime, timezone
from uuid import uuid4

from flask import Blueprint, g, request
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.middleware.auth_middleware import require_auth, require_role
from app.models import Attendance, AttendanceSession, Student
from app.utils.response import error_response, success_response

reports_bp = Blueprint("reports", __name__)


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/reports/generate
# Trigger a report generation job (queued; actual PDF/S3 via Lambda/SES)
# ──────────────────────────────────────────────────────────────────────────────
@reports_bp.route("/generate", methods=["POST"])
@require_auth
@require_role(["org_admin"])
def generate_report():
    """Trigger a background report compilation job and return job metadata."""
    body = request.get_json() or {}
    report_type = body.get("type", "monthly")
    fmt = body.get("format", "PDF")
    date_from = body.get("date_from")
    date_to = body.get("date_to")

    if report_type not in ("monthly", "semester", "custom", "department"):
        return error_response("Invalid report type — use: monthly, semester, custom, department")

    if fmt.upper() not in ("PDF", "CSV"):
        return error_response("Invalid format — use: PDF or CSV")

    job_id = f"rep_{uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    report_metadata = {
        "id": job_id,
        "organization_id": str(g.organization_id),
        "name": f"Attendance_{report_type.upper()}_Report",
        "type": report_type,
        "format": fmt.upper(),
        "date_from": date_from,
        "date_to": date_to,
        "status": "queued",
        "aws_s3_url": None,
        "created_at": now_iso,
        "message": "Report job queued — download link will be available via AWS S3 once compiled.",
    }

    # TODO: enqueue to SQS / trigger Lambda / invoke n8n webhook here
    # from app.routes.workflows import trigger_report_workflow
    # trigger_report_workflow(job_id, report_metadata)

    return success_response(
        data=report_metadata,
        message="Report generation job queued successfully",
        status_code=202,
    )


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/reports/summary
# Inline summary report (no PDF) — useful for quick dashboard data export
# ──────────────────────────────────────────────────────────────────────────────
@reports_bp.route("/summary", methods=["GET"])
@require_auth
@require_role(["org_admin", "teacher"])
def get_summary():
    """Return a quick in-memory attendance summary for the organization."""
    db = get_db()

    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    try:
        query = (
            db.query(Attendance)
            .join(AttendanceSession, Attendance.session_id == AttendanceSession.id)
            .filter(Attendance.organization_id == g.organization_id)
        )

        if date_from:
            try:
                from datetime import date
                query = query.filter(
                    AttendanceSession.date >= date.fromisoformat(date_from)
                )
            except ValueError:
                return error_response("Invalid date_from format — use YYYY-MM-DD", 400)

        if date_to:
            try:
                from datetime import date
                query = query.filter(
                    AttendanceSession.date <= date.fromisoformat(date_to)
                )
            except ValueError:
                return error_response("Invalid date_to format — use YYYY-MM-DD", 400)

        records = query.all()
        total = len(records)
        present = sum(1 for r in records if r.status == "present")
        absent = sum(1 for r in records if r.status == "absent")
        late = sum(1 for r in records if r.status == "late")
        excused = sum(1 for r in records if r.status == "excused")

        summary = {
            "total_records": total,
            "present": present,
            "absent": absent,
            "late": late,
            "excused": excused,
            "attendance_percentage": round((present / total) * 100, 1) if total else 0,
            "date_from": date_from,
            "date_to": date_to,
        }

        return success_response(data=summary, message="Attendance summary loaded")
    except SQLAlchemyError as e:
        return error_response(f"Failed to generate summary: {str(e)}", 500)
