from datetime import date as date_type
from uuid import UUID

from flask import Blueprint, g, request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.database import get_db
from app.middleware.auth_middleware import require_auth, require_role
from app.models import Attendance, AttendanceSession, Course, Student, Teacher
from app.utils.response import error_response, success_response
from app.utils.serializers import attendance_session_to_dict, attendance_to_dict

attendance_bp = Blueprint("attendance", __name__)


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/attendance/session
# Create a new roll-call session (teacher or admin)
# ──────────────────────────────────────────────────────────────────────────────
@attendance_bp.route("/session", methods=["POST"])
@require_auth
@require_role(["org_admin", "teacher"])
def create_session():
    """Create a new classroom attendance roll-call session in the database."""
    db = get_db()
    body = request.get_json() or {}

    course_id = body.get("course_id")
    session_date = body.get("date")

    if not course_id or not session_date:
        return error_response("Missing required fields: course_id, date")

    try:
        course_uuid = UUID(course_id)
    except ValueError:
        return error_response("Invalid course_id format", 400)

    # Validate course belongs to this org
    try:
        course = (
            db.query(Course)
            .filter(Course.id == course_uuid, Course.organization_id == g.organization_id)
            .one_or_none()
        )
        if not course:
            return error_response("Course not found in your organization", 404)
    except SQLAlchemyError as e:
        return error_response(f"Database error: {str(e)}", 500)

    # Resolve the teacher record for the calling user (if they are a teacher)
    teacher_uuid = None
    if g.role == "teacher":
        teacher = (
            db.query(Teacher)
            .filter(
                Teacher.profile_id == g.user_id,
                Teacher.organization_id == g.organization_id,
                Teacher.is_active.is_(True),
            )
            .one_or_none()
        )
        if teacher:
            teacher_uuid = teacher.id

    # Prevent duplicate sessions for the same course+date
    try:
        parsed_date = date_type.fromisoformat(session_date)
    except ValueError:
        return error_response("Invalid date format — use YYYY-MM-DD", 400)

    existing = (
        db.query(AttendanceSession)
        .filter(
            AttendanceSession.organization_id == g.organization_id,
            AttendanceSession.course_id == course_uuid,
            AttendanceSession.date == parsed_date,
        )
        .one_or_none()
    )
    if existing:
        return success_response(
            data=attendance_session_to_dict(existing, include_course=True),
            message="Session already exists for this course and date",
        )

    try:
        session = AttendanceSession(
            organization_id=g.organization_id,
            course_id=course_uuid,
            teacher_id=teacher_uuid,
            date=parsed_date,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        return success_response(
            data=attendance_session_to_dict(session, include_course=True),
            message="Attendance roll-call session created",
            status_code=201,
        )
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to create session: {str(e)}", 500)


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/attendance/sessions
# List sessions with optional filters
# ──────────────────────────────────────────────────────────────────────────────
@attendance_bp.route("/sessions", methods=["GET"])
@require_auth
@require_role(["org_admin", "teacher"])
def list_sessions():
    """List attendance sessions, optionally filtered by course or date range."""
    db = get_db()

    try:
        query = db.query(AttendanceSession).filter(
            AttendanceSession.organization_id == g.organization_id
        )

        course_id = request.args.get("course_id")
        if course_id:
            try:
                query = query.filter(AttendanceSession.course_id == UUID(course_id))
            except ValueError:
                pass

        date_from = request.args.get("date_from")
        date_to = request.args.get("date_to")
        if date_from:
            try:
                query = query.filter(AttendanceSession.date >= date_type.fromisoformat(date_from))
            except ValueError:
                pass
        if date_to:
            try:
                query = query.filter(AttendanceSession.date <= date_type.fromisoformat(date_to))
            except ValueError:
                pass

        # If teacher role, scope to their own sessions only
        if g.role == "teacher":
            teacher = (
                db.query(Teacher)
                .filter(
                    Teacher.profile_id == g.user_id,
                    Teacher.organization_id == g.organization_id,
                )
                .one_or_none()
            )
            if teacher:
                query = query.filter(AttendanceSession.teacher_id == teacher.id)

        sessions = query.order_by(AttendanceSession.date.desc()).limit(100).all()

        return success_response(
            data=[attendance_session_to_dict(s, include_course=True) for s in sessions],
            message="Sessions fetched successfully",
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load sessions: {str(e)}", 500)


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/attendance/records
# Save (upsert) individual student records for a session
# ──────────────────────────────────────────────────────────────────────────────
@attendance_bp.route("/records", methods=["POST"])
@require_auth
@require_role(["org_admin", "teacher"])
def save_records():
    """Upsert attendance records for individual students in a session."""
    db = get_db()
    body = request.get_json() or {}

    session_id = body.get("session_id")
    records = body.get("records")  # [{"student_id": "...", "status": "present|absent|late|excused"}]

    if not session_id or not records:
        return error_response("Missing required fields: session_id, records")

    try:
        session_uuid = UUID(session_id)
    except ValueError:
        return error_response("Invalid session_id format", 400)

    # Confirm session exists in this org
    session = (
        db.query(AttendanceSession)
        .filter(
            AttendanceSession.id == session_uuid,
            AttendanceSession.organization_id == g.organization_id,
        )
        .one_or_none()
    )
    if not session:
        return error_response("Attendance session not found", 404)

    valid_statuses = {"present", "absent", "late", "excused", "holiday"}
    saved_count = 0
    errors = []

    try:
        for entry in records:
            raw_student_id = entry.get("student_id")
            status = entry.get("status", "absent")

            if not raw_student_id:
                errors.append("Missing student_id in a record entry")
                continue

            if status not in valid_statuses:
                errors.append(f"Invalid status '{status}' for student {raw_student_id}")
                continue

            try:
                student_uuid = UUID(raw_student_id)
            except ValueError:
                errors.append(f"Invalid student_id format: {raw_student_id}")
                continue

            # Upsert: try to find existing record for this session+student
            existing = (
                db.query(Attendance)
                .filter(
                    Attendance.session_id == session_uuid,
                    Attendance.student_id == student_uuid,
                )
                .one_or_none()
            )

            if existing:
                existing.status = status
                existing.updated_at = func.current_timestamp()
            else:
                new_record = Attendance(
                    organization_id=g.organization_id,
                    session_id=session_uuid,
                    student_id=student_uuid,
                    status=status,
                )
                db.add(new_record)

            saved_count += 1

        db.commit()

        return success_response(
            data={"saved_count": saved_count, "errors": errors},
            message=f"Attendance committed — {saved_count} record(s) saved",
        )
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to save attendance records: {str(e)}", 500)


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/attendance/records
# Retrieve records for a session or student
# ──────────────────────────────────────────────────────────────────────────────
@attendance_bp.route("/records", methods=["GET"])
@require_auth
def get_records():
    """Fetch attendance records filtered by session or student."""
    db = get_db()

    try:
        query = db.query(Attendance).filter(
            Attendance.organization_id == g.organization_id
        )

        session_id = request.args.get("session_id")
        student_id = request.args.get("student_id")

        if session_id:
            try:
                query = query.filter(Attendance.session_id == UUID(session_id))
            except ValueError:
                return error_response("Invalid session_id format", 400)

        if student_id:
            try:
                query = query.filter(Attendance.student_id == UUID(student_id))
            except ValueError:
                return error_response("Invalid student_id format", 400)

        records = query.order_by(Attendance.created_at.desc()).limit(500).all()

        return success_response(
            data=[attendance_to_dict(r, include_session=True) for r in records],
            message="Attendance records fetched successfully",
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load records: {str(e)}", 500)


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/attendance/heatmap
# Per-student heatmap data (date → status) scoped to the calling student
# ──────────────────────────────────────────────────────────────────────────────
@attendance_bp.route("/heatmap", methods=["GET"])
@require_auth
def get_heatmap():
    """Return per-day attendance status for the authenticated student (heatmap)."""
    db = get_db()

    # Resolve the student record for the caller
    student = (
        db.query(Student)
        .filter(
            Student.profile_id == g.user_id,
            Student.organization_id == g.organization_id,
            Student.is_active.is_(True),
        )
        .one_or_none()
    )

    # Admins/teachers can query any student via ?student_id=
    if not student:
        raw_sid = request.args.get("student_id")
        if not raw_sid:
            return error_response("Student profile not found or missing student_id param", 404)
        try:
            student = (
                db.query(Student)
                .filter(
                    Student.id == UUID(raw_sid),
                    Student.organization_id == g.organization_id,
                )
                .one_or_none()
            )
        except ValueError:
            return error_response("Invalid student_id format", 400)

    if not student:
        return error_response("Student not found", 404)

    try:
        rows = (
            db.query(Attendance, AttendanceSession)
            .join(AttendanceSession, Attendance.session_id == AttendanceSession.id)
            .filter(
                Attendance.student_id == student.id,
                Attendance.organization_id == g.organization_id,
            )
            .order_by(AttendanceSession.date.asc())
            .all()
        )

        heatmap = {}
        for record, session in rows:
            day_key = session.date.isoformat() if session.date else None
            if day_key:
                course_id_str = str(session.course_id) if session.course_id else None
                heatmap[day_key] = {
                    "status": record.status,
                    "session_id": str(record.session_id),
                    "course_id": course_id_str,
                }

        return success_response(
            data={
                "student_id": str(student.id),
                "full_name": student.full_name,
                "heatmap": heatmap,
            },
            message="Attendance heatmap fetched successfully",
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to build heatmap: {str(e)}", 500)
