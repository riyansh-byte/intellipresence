from flask import Blueprint, g, request
from sqlalchemy import func, case
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.middleware.auth_middleware import require_auth, require_role
from app.models import Attendance, AttendanceSession, Course, Department, Student
from app.utils.response import error_response, success_response

analytics_bp = Blueprint("analytics", __name__)


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/analytics/overview
# High-level dashboard totals for the calling org
# ──────────────────────────────────────────────────────────────────────────────
@analytics_bp.route("/overview", methods=["GET"])
@require_auth
@require_role(["org_admin"])
def get_overview_metrics():
    """Return live aggregate attendance stats for the authenticated organization."""
    db = get_db()

    try:
        from datetime import date
        today = date.today()

        # Today's numbers ─ join session to get today's records only
        today_rows = (
            db.query(Attendance)
            .join(AttendanceSession, Attendance.session_id == AttendanceSession.id)
            .filter(
                Attendance.organization_id == g.organization_id,
                AttendanceSession.date == today,
            )
            .all()
        )
        today_total = len(today_rows)
        today_present = sum(1 for r in today_rows if r.status == "present")
        today_absent = sum(1 for r in today_rows if r.status == "absent")
        today_late = sum(1 for r in today_rows if r.status == "late")
        today_pct = round((today_present / today_total) * 100, 1) if today_total else 0

        # All-time totals for monthly/semester averages
        all_rows = (
            db.query(Attendance)
            .filter(Attendance.organization_id == g.organization_id)
            .all()
        )
        all_total = len(all_rows)
        all_present = sum(1 for r in all_rows if r.status in ("present", "late"))
        overall_pct = round((all_present / all_total) * 100, 1) if all_total else 0

        # Active student count
        active_students = (
            db.query(func.count(Student.id))
            .filter(
                Student.organization_id == g.organization_id,
                Student.is_active.is_(True),
            )
            .scalar()
        ) or 0

        # Total sessions run
        total_sessions = (
            db.query(func.count(AttendanceSession.id))
            .filter(AttendanceSession.organization_id == g.organization_id)
            .scalar()
        ) or 0

        metrics = {
            "today": {
                "present": today_present,
                "absent": today_absent,
                "late": today_late,
                "total": today_total,
                "percentage": today_pct,
            },
            "averages": {
                "overall": overall_pct,
                # Monthly/semester are same as overall until time-bucketing is added
                "monthly": overall_pct,
                "semester": overall_pct,
            },
            "totals": {
                "active_students": active_students,
                "sessions_run": total_sessions,
            },
        }

        return success_response(data=metrics, message="Dashboard overview metrics loaded")
    except SQLAlchemyError as e:
        return error_response(f"Failed to compute metrics: {str(e)}", 500)


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/analytics/department-trends
# Per-department attendance percentage rankings
# ──────────────────────────────────────────────────────────────────────────────
@analytics_bp.route("/department-trends", methods=["GET"])
@require_auth
@require_role(["org_admin"])
def get_department_comparison():
    """Return attendance rate per department from live records."""
    db = get_db()

    try:
        departments = (
            db.query(Department)
            .filter(
                Department.organization_id == g.organization_id,
                Department.is_active.is_(True),
            )
            .all()
        )

        result = []
        for dept in departments:
            # Get all students in this department
            student_ids = [
                s.id
                for s in db.query(Student.id)
                .filter(
                    Student.department_id == dept.id,
                    Student.is_active.is_(True),
                )
                .all()
            ]

            if not student_ids:
                result.append({
                    "department_id": str(dept.id),
                    "department_name": f"{dept.name} ({dept.code})",
                    "percentage": 0,
                    "total_records": 0,
                })
                continue

            dept_records = (
                db.query(Attendance)
                .filter(
                    Attendance.student_id.in_(student_ids),
                    Attendance.organization_id == g.organization_id,
                )
                .all()
            )

            total = len(dept_records)
            present = sum(1 for r in dept_records if r.status in ("present", "late"))
            pct = round((present / total) * 100, 1) if total else 0

            result.append({
                "department_id": str(dept.id),
                "department_name": f"{dept.name} ({dept.code})",
                "percentage": pct,
                "total_records": total,
            })

        # Sort descending by percentage
        result.sort(key=lambda x: x["percentage"], reverse=True)

        return success_response(data=result, message="Department attendance trends loaded")
    except SQLAlchemyError as e:
        return error_response(f"Failed to compute department trends: {str(e)}", 500)


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/analytics/low-attendance
# Students below a threshold (default 75%)
# ──────────────────────────────────────────────────────────────────────────────
@analytics_bp.route("/low-attendance", methods=["GET"])
@require_auth
@require_role(["org_admin", "teacher"])
def get_low_attendance_students():
    """Return students whose attendance percentage is below a configurable threshold."""
    db = get_db()

    try:
        threshold = float(request.args.get("threshold", 75))
    except ValueError:
        threshold = 75.0

    try:
        students = (
            db.query(Student)
            .filter(
                Student.organization_id == g.organization_id,
                Student.is_active.is_(True),
            )
            .all()
        )

        low_students = []
        for student in students:
            records = (
                db.query(Attendance)
                .filter(
                    Attendance.student_id == student.id,
                    Attendance.organization_id == g.organization_id,
                )
                .all()
            )
            total = len(records)
            if total == 0:
                continue

            present = sum(1 for r in records if r.status in ("present", "late"))
            pct = round((present / total) * 100, 1)

            if pct < threshold:
                low_students.append({
                    "student_id": str(student.id),
                    "full_name": student.full_name,
                    "roll_number": student.roll_number,
                    "email": student.email,
                    "attendance_percentage": pct,
                    "total_sessions": total,
                    "present_count": present,
                })

        low_students.sort(key=lambda x: x["attendance_percentage"])

        return success_response(
            data=low_students,
            message=f"Students below {threshold}% threshold loaded",
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to compute low-attendance list: {str(e)}", 500)
