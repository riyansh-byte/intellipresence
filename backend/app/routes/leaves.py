from datetime import datetime
from uuid import UUID

from flask import Blueprint, g, request
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import func

from app.database import get_db
from app.middleware.auth_middleware import require_auth, require_role
from app.models import LeaveRequest, Student, Profile
from app.utils.response import error_response, success_response
from app.utils.serializers import leave_request_to_dict

leaves_bp = Blueprint("leaves", __name__)


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/leaves/
# Student submits a leave request
# ──────────────────────────────────────────────────────────────────────────────
@leaves_bp.route("/", methods=["POST"])
@require_auth
@require_role(["student"])
def submit_leave():
    """Authenticated student submits a new leave request."""
    db = get_db()
    body = request.get_json() or {}

    start_date = body.get("start_date")
    end_date = body.get("end_date")
    reason = body.get("reason", "").strip()

    if not start_date or not end_date or not reason:
        return error_response("Missing required fields: start_date, end_date, reason")

    try:
        parsed_start = datetime.strptime(start_date, "%Y-%m-%d").date()
        parsed_end = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError:
        return error_response("Invalid date format — use YYYY-MM-DD", 400)

    if parsed_end < parsed_start:
        return error_response("end_date must be on or after start_date", 400)

    # Resolve the student entity for the authenticated user
    student = (
        db.query(Student)
        .filter(
            Student.profile_id == g.user_id,
            Student.organization_id == g.organization_id,
            Student.is_active.is_(True),
        )
        .one_or_none()
    )
    if not student:
        return error_response("Student profile not found for the authenticated user", 404)

    try:
        leave = LeaveRequest(
            organization_id=g.organization_id,
            student_id=student.id,
            start_date=parsed_start,
            end_date=parsed_end,
            reason=reason,
            status="pending",
        )
        db.add(leave)
        db.commit()
        db.refresh(leave)

        return success_response(
            data=leave_request_to_dict(leave, include_student=True),
            message="Leave request submitted successfully",
            status_code=201,
        )
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to submit leave request: {str(e)}", 500)


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/leaves/
# List leave requests — students see their own, teachers/admins see all
# ──────────────────────────────────────────────────────────────────────────────
@leaves_bp.route("/", methods=["GET"])
@require_auth
def list_leaves():
    """Return leave requests scoped by role — students see own, admins/teachers see all."""
    db = get_db()

    try:
        query = db.query(LeaveRequest).filter(
            LeaveRequest.organization_id == g.organization_id
        )

        if g.role == "student":
            # Restrict to the calling student's own requests
            student = (
                db.query(Student)
                .filter(
                    Student.profile_id == g.user_id,
                    Student.organization_id == g.organization_id,
                )
                .one_or_none()
            )
            if not student:
                return error_response("Student profile not found", 404)
            query = query.filter(LeaveRequest.student_id == student.id)

        # Optional status filter
        status_filter = request.args.get("status")
        if status_filter in ("pending", "approved", "rejected"):
            query = query.filter(LeaveRequest.status == status_filter)

        # Optional student_id filter (admin/teacher only)
        student_id_param = request.args.get("student_id")
        if student_id_param and g.role != "student":
            try:
                query = query.filter(LeaveRequest.student_id == UUID(student_id_param))
            except ValueError:
                pass

        leaves = query.order_by(LeaveRequest.created_at.desc()).all()

        return success_response(
            data=[leave_request_to_dict(lv, include_student=True) for lv in leaves],
            message="Leave requests fetched successfully",
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load leave requests: {str(e)}", 500)


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/leaves/<leave_id>
# Get a single leave request by ID
# ──────────────────────────────────────────────────────────────────────────────
@leaves_bp.route("/<string:leave_id>", methods=["GET"])
@require_auth
def get_leave(leave_id):
    """Retrieve a single leave request by its ID."""
    db = get_db()

    try:
        leave_uuid = UUID(leave_id)
    except ValueError:
        return error_response("Invalid leave_id format", 400)

    try:
        leave = (
            db.query(LeaveRequest)
            .filter(
                LeaveRequest.id == leave_uuid,
                LeaveRequest.organization_id == g.organization_id,
            )
            .one_or_none()
        )

        if not leave:
            return error_response("Leave request not found", 404)

        # Students can only view their own
        if g.role == "student":
            student = (
                db.query(Student)
                .filter(Student.profile_id == g.user_id)
                .one_or_none()
            )
            if not student or leave.student_id != student.id:
                return error_response("Forbidden: Not your leave request", 403)

        return success_response(
            data=leave_request_to_dict(leave, include_student=True),
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load leave request: {str(e)}", 500)


# ──────────────────────────────────────────────────────────────────────────────
# PUT /api/leaves/<leave_id>/approve
# Teacher or admin approves a pending leave
# ──────────────────────────────────────────────────────────────────────────────
@leaves_bp.route("/<string:leave_id>/approve", methods=["PUT"])
@require_auth
@require_role(["org_admin", "teacher"])
def approve_leave(leave_id):
    """Approve a pending leave request and record the reviewer."""
    db = get_db()

    try:
        leave_uuid = UUID(leave_id)
    except ValueError:
        return error_response("Invalid leave_id format", 400)

    try:
        leave = (
            db.query(LeaveRequest)
            .filter(
                LeaveRequest.id == leave_uuid,
                LeaveRequest.organization_id == g.organization_id,
            )
            .one_or_none()
        )

        if not leave:
            return error_response("Leave request not found", 404)

        if leave.status != "pending":
            return error_response(
                f"Leave request is already '{leave.status}' and cannot be approved", 409
            )

        leave.status = "approved"
        leave.reviewed_by = g.user_id
        leave.updated_at = func.current_timestamp()

        db.commit()
        db.refresh(leave)

        return success_response(
            data=leave_request_to_dict(leave, include_student=True),
            message="Leave request approved",
        )
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to approve leave request: {str(e)}", 500)


# ──────────────────────────────────────────────────────────────────────────────
# PUT /api/leaves/<leave_id>/reject
# Teacher or admin rejects a pending leave
# ──────────────────────────────────────────────────────────────────────────────
@leaves_bp.route("/<string:leave_id>/reject", methods=["PUT"])
@require_auth
@require_role(["org_admin", "teacher"])
def reject_leave(leave_id):
    """Reject a pending leave request and record the reviewer."""
    db = get_db()

    try:
        leave_uuid = UUID(leave_id)
    except ValueError:
        return error_response("Invalid leave_id format", 400)

    try:
        leave = (
            db.query(LeaveRequest)
            .filter(
                LeaveRequest.id == leave_uuid,
                LeaveRequest.organization_id == g.organization_id,
            )
            .one_or_none()
        )

        if not leave:
            return error_response("Leave request not found", 404)

        if leave.status != "pending":
            return error_response(
                f"Leave request is already '{leave.status}' and cannot be rejected", 409
            )

        leave.status = "rejected"
        leave.reviewed_by = g.user_id
        leave.updated_at = func.current_timestamp()

        db.commit()
        db.refresh(leave)

        return success_response(
            data=leave_request_to_dict(leave, include_student=True),
            message="Leave request rejected",
        )
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to reject leave request: {str(e)}", 500)


# ──────────────────────────────────────────────────────────────────────────────
# DELETE /api/leaves/<leave_id>
# Student cancels their own pending leave request
# ──────────────────────────────────────────────────────────────────────────────
@leaves_bp.route("/<string:leave_id>", methods=["DELETE"])
@require_auth
@require_role(["student"])
def cancel_leave(leave_id):
    """Student cancels (deletes) their own pending leave request."""
    db = get_db()

    try:
        leave_uuid = UUID(leave_id)
    except ValueError:
        return error_response("Invalid leave_id format", 400)

    try:
        student = (
            db.query(Student)
            .filter(
                Student.profile_id == g.user_id,
                Student.organization_id == g.organization_id,
            )
            .one_or_none()
        )
        if not student:
            return error_response("Student profile not found", 404)

        leave = (
            db.query(LeaveRequest)
            .filter(
                LeaveRequest.id == leave_uuid,
                LeaveRequest.organization_id == g.organization_id,
                LeaveRequest.student_id == student.id,
            )
            .one_or_none()
        )

        if not leave:
            return error_response("Leave request not found", 404)

        if leave.status != "pending":
            return error_response("Only pending leave requests can be cancelled", 409)

        db.delete(leave)
        db.commit()

        return success_response(message="Leave request cancelled successfully")
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to cancel leave request: {str(e)}", 500)
