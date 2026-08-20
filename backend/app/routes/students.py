from flask import Blueprint, request, g
from uuid import UUID
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.utils.response import success_response, error_response
from app.utils.serializers import student_to_dict
from app.middleware.auth_middleware import require_auth, require_role
from app.database import get_db
from app.models import Student, Attendance

students_bp = Blueprint("students", __name__)

@students_bp.route("/", methods=["GET"])
@require_auth
@require_role(["org_admin", "teacher"])
def list_students():
    """Retrieve all students filtered by active organization tenant scope."""
    db = get_db()
    
    try:
        query = db.query(Student).filter(
            Student.organization_id == g.organization_id,
            Student.is_active.is_(True),
        )
        
        # Optional filters
        department_id = request.args.get("department_id")
        if department_id:
            try:
                dept_uuid = UUID(department_id)
                query = query.filter(Student.department_id == dept_uuid)
            except ValueError:
                pass
                
        search = request.args.get("search")
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Student.full_name.ilike(search_term)) |
                (Student.student_id.ilike(search_term)) |
                (Student.email.ilike(search_term))
            )
            
        students = query.order_by(Student.full_name).all()
        
        return success_response(
            data=[student_to_dict(s, include_department=True) for s in students],
            message="Students database records fetched successfully"
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load students: {str(e)}", 500)

@students_bp.route("/me", methods=["GET"])
@require_auth
def get_current_student():
    """Return the authenticated student's live profile and attendance summary."""
    db = get_db()

    try:
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
            return error_response("Student profile not found for the authenticated session", 404)

        attendance_rows = (
            db.query(Attendance)
            .filter(
                Attendance.organization_id == g.organization_id,
                Attendance.student_id == student.id,
            )
            .all()
        )

        total_sessions = len(attendance_rows)
        present_count = sum(1 for record in attendance_rows if record.status == "present")
        absent_count = sum(1 for record in attendance_rows if record.status == "absent")
        late_count = sum(1 for record in attendance_rows if record.status == "late")
        excused_count = sum(1 for record in attendance_rows if record.status == "excused")
        attendance_percentage = round((present_count / total_sessions) * 100) if total_sessions else 0

        payload = student_to_dict(student, include_department=True, include_profile=True)
        payload["attendance_percentage"] = attendance_percentage
        payload["attendance_summary"] = {
            "total_sessions": total_sessions,
            "present_count": present_count,
            "absent_count": absent_count,
            "late_count": late_count,
            "excused_count": excused_count,
            "attendance_percentage": attendance_percentage,
        }

        return success_response(
            data=payload,
            message="Authenticated student profile fetched successfully"
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load student profile: {str(e)}", 500)

@students_bp.route("/<string:student_id>", methods=["GET"])
@require_auth
def get_student(student_id):
    """Retrieve profile metrics detail for a specific student."""
    db = get_db()
    
    try:
        student_uuid = UUID(student_id)
    except ValueError:
        return error_response("Invalid student ID format", 400)
    
    try:
        student = (
            db.query(Student)
            .filter(
                Student.id == student_uuid,
                Student.organization_id == g.organization_id,
                Student.is_active.is_(True),
            )
            .one_or_none()
        )
        
        if not student:
            return error_response("Student not found", 404)
            
        return success_response(
            data=student_to_dict(student, include_department=True, include_profile=True)
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load student: {str(e)}", 500)

@students_bp.route("/", methods=["POST"])
@require_auth
@require_role(["org_admin"])
def add_student():
    """Create and validate a new student record inside the organization database."""
    db = get_db()
    body = request.get_json() or {}
    
    full_name = body.get("full_name")
    student_id = body.get("student_id")
    email = body.get("email")
    roll_number = body.get("roll_number")
    department_id = body.get("department_id")
    
    if not full_name or not student_id or not email or not roll_number:
        return error_response("Missing required fields: full_name, student_id, email, roll_number")
    
    try:
        new_student = Student(
            organization_id=g.organization_id,
            full_name=full_name,
            student_id=student_id,
            email=email,
            roll_number=roll_number,
            department_id=UUID(department_id) if department_id else None,
            is_active=True,
        )
        
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
        
        return success_response(
            data=student_to_dict(new_student),
            message="Student created successfully",
            status_code=201
        )
    except IntegrityError:
        db.rollback()
        return error_response("Student ID or roll number already exists in this organization", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to create student: {str(e)}", 500)

@students_bp.route("/<string:student_id>", methods=["PUT"])
@require_auth
@require_role(["org_admin"])
def update_student(student_id):
    """Update an existing student record."""
    db = get_db()
    
    try:
        student_uuid = UUID(student_id)
    except ValueError:
        return error_response("Invalid student ID format", 400)
    
    body = request.get_json() or {}
    
    try:
        student = (
            db.query(Student)
            .filter(
                Student.id == student_uuid,
                Student.organization_id == g.organization_id,
            )
            .one_or_none()
        )
        
        if not student:
            return error_response("Student not found", 404)
        
        if "full_name" in body:
            student.full_name = body["full_name"]
        if "email" in body:
            student.email = body["email"]
        if "student_id" in body:
            student.student_id = body["student_id"]
        if "roll_number" in body:
            student.roll_number = body["roll_number"]
        if "department_id" in body:
            student.department_id = UUID(body["department_id"]) if body["department_id"] else None
        if "is_active" in body:
            student.is_active = bool(body["is_active"])
            
        from sqlalchemy import func
        student.updated_at = func.current_timestamp()
        
        db.commit()
        db.refresh(student)
        
        return success_response(
            data=student_to_dict(student),
            message="Student updated successfully"
        )
    except IntegrityError:
        db.rollback()
        return error_response("Student ID or roll number already exists", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to update student: {str(e)}", 500)

@students_bp.route("/<string:student_id>", methods=["DELETE"])
@require_auth
@require_role(["org_admin"])
def deactivate_student(student_id):
    """Soft delete a student record."""
    db = get_db()
    
    try:
        student_uuid = UUID(student_id)
    except ValueError:
        return error_response("Invalid student ID format", 400)
    
    try:
        student = (
            db.query(Student)
            .filter(
                Student.id == student_uuid,
                Student.organization_id == g.organization_id,
            )
            .one_or_none()
        )
        
        if not student:
            return error_response("Student not found", 404)
        
        student.is_active = False
        from sqlalchemy import func
        student.updated_at = func.current_timestamp()
        
        db.commit()
        
        return success_response(
            message="Student deactivated successfully"
        )
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to deactivate student: {str(e)}", 500)
