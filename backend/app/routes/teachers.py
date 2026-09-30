from flask import Blueprint, request, g
from uuid import UUID
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.utils.response import success_response, error_response
from app.utils.serializers import teacher_to_dict, course_to_dict
from app.middleware.auth_middleware import require_auth, require_role
from app.database import get_db
from app.models import Teacher, Course, AttendanceSession, Attendance

teachers_bp = Blueprint("teachers", __name__)


@teachers_bp.route("/me", methods=["GET"])
@require_auth
@require_role(["teacher"])
def get_current_teacher():
    """Return the authenticated teacher's own profile and department info."""
    db = get_db()

    try:
        teacher = (
            db.query(Teacher)
            .filter(
                Teacher.profile_id == g.user_id,
                Teacher.organization_id == g.organization_id,
                Teacher.is_active.is_(True),
            )
            .one_or_none()
        )

        if not teacher:
            return error_response("Teacher profile not found for this account", 404)

        return success_response(
            data=teacher_to_dict(teacher, include_department=True, include_profile=True),
            message="Teacher profile loaded",
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load teacher profile: {str(e)}", 500)


@teachers_bp.route("/me/courses", methods=["GET"])
@require_auth
@require_role(["teacher"])
def get_teacher_courses():
    """Return courses in the authenticated teacher's department with live attendance stats."""
    db = get_db()

    try:
        teacher = (
            db.query(Teacher)
            .filter(
                Teacher.profile_id == g.user_id,
                Teacher.organization_id == g.organization_id,
                Teacher.is_active.is_(True),
            )
            .one_or_none()
        )

        if not teacher:
            return error_response("Teacher profile not found", 404)

        # Fetch courses in this teacher's department (or all org courses if no dept)
        query = db.query(Course).filter(
            Course.organization_id == g.organization_id
        )
        if teacher.department_id:
            query = query.filter(Course.department_id == teacher.department_id)

        courses = query.order_by(Course.name).all()

        result = []
        for course in courses:
            # Count sessions run by this teacher for this course
            sessions = (
                db.query(AttendanceSession)
                .filter(
                    AttendanceSession.course_id == course.id,
                    AttendanceSession.teacher_id == teacher.id,
                    AttendanceSession.organization_id == g.organization_id,
                )
                .all()
            )
            session_ids = [s.id for s in sessions]

            # Count students who appeared in at least one session
            total_records = 0
            present_records = 0
            if session_ids:
                records = (
                    db.query(Attendance)
                    .filter(
                        Attendance.session_id.in_(session_ids),
                        Attendance.organization_id == g.organization_id,
                    )
                    .all()
                )
                total_records = len(records)
                present_records = sum(1 for r in records if r.status in ("present", "late"))

            avg_attendance = (
                round((present_records / total_records) * 100, 1)
                if total_records else 0
            )

            course_data = course_to_dict(course, include_department=True)
            course_data["sessions_run"] = len(sessions)
            course_data["avg_attendance_pct"] = avg_attendance

            result.append(course_data)

        return success_response(
            data=result,
            message="Teacher's course list loaded with live stats",
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load courses: {str(e)}", 500)

@teachers_bp.route("/", methods=["GET"])
@require_auth
@require_role(["org_admin", "teacher"])
def list_teachers():
    """Retrieve all teachers records for active tenant."""
    db = get_db()
    
    try:
        query = db.query(Teacher).filter(
            Teacher.organization_id == g.organization_id,
            Teacher.is_active.is_(True),
        )
        
        # Optional filters
        department_id = request.args.get("department_id")
        if department_id:
            try:
                dept_uuid = UUID(department_id)
                query = query.filter(Teacher.department_id == dept_uuid)
            except ValueError:
                pass
                
        search = request.args.get("search")
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Teacher.full_name.ilike(search_term)) |
                (Teacher.teacher_id.ilike(search_term)) |
                (Teacher.email.ilike(search_term))
            )
            
        teachers = query.order_by(Teacher.full_name).all()
        
        return success_response(
            data=[teacher_to_dict(t, include_department=True) for t in teachers],
            message="Faculty directory loaded"
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load teachers: {str(e)}", 500)

@teachers_bp.route("/<string:teacher_id>", methods=["GET"])
@require_auth
def get_teacher(teacher_id):
    """Retrieve profile details for a specific teacher."""
    db = get_db()
    
    try:
        teacher_uuid = UUID(teacher_id)
    except ValueError:
        return error_response("Invalid teacher ID format", 400)
    
    try:
        teacher = (
            db.query(Teacher)
            .filter(
                Teacher.id == teacher_uuid,
                Teacher.organization_id == g.organization_id,
                Teacher.is_active.is_(True),
            )
            .one_or_none()
        )
        
        if not teacher:
            return error_response("Teacher not found", 404)
            
        return success_response(
            data=teacher_to_dict(teacher, include_department=True, include_profile=True)
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load teacher: {str(e)}", 500)

@teachers_bp.route("/", methods=["POST"])
@require_auth
@require_role(["org_admin"])
def add_teacher():
    """Register and invite new teacher accounts to the tenant workspace."""
    db = get_db()
    body = request.get_json() or {}
    
    full_name = body.get("full_name")
    teacher_id = body.get("teacher_id")
    email = body.get("email")
    department_id = body.get("department_id")
    designation = body.get("designation")
    
    if not full_name or not teacher_id or not email:
        return error_response("Missing required fields: full_name, teacher_id, email")
    
    try:
        new_teacher = Teacher(
            organization_id=g.organization_id,
            full_name=full_name,
            teacher_id=teacher_id,
            email=email,
            department_id=UUID(department_id) if department_id else None,
            designation=designation,
            is_active=True,
        )
        
        db.add(new_teacher)
        db.commit()
        db.refresh(new_teacher)
        
        return success_response(
            data=teacher_to_dict(new_teacher),
            message="Teacher account registered",
            status_code=201
        )
    except IntegrityError:
        db.rollback()
        return error_response("Teacher ID already exists in this organization", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to create teacher: {str(e)}", 500)

@teachers_bp.route("/<string:teacher_id>", methods=["PUT"])
@require_auth
@require_role(["org_admin"])
def update_teacher(teacher_id):
    """Update an existing teacher record."""
    db = get_db()
    
    try:
        teacher_uuid = UUID(teacher_id)
    except ValueError:
        return error_response("Invalid teacher ID format", 400)
    
    body = request.get_json() or {}
    
    try:
        teacher = (
            db.query(Teacher)
            .filter(
                Teacher.id == teacher_uuid,
                Teacher.organization_id == g.organization_id,
            )
            .one_or_none()
        )
        
        if not teacher:
            return error_response("Teacher not found", 404)
        
        if "full_name" in body:
            teacher.full_name = body["full_name"]
        if "email" in body:
            teacher.email = body["email"]
        if "teacher_id" in body:
            teacher.teacher_id = body["teacher_id"]
        if "department_id" in body:
            teacher.department_id = UUID(body["department_id"]) if body["department_id"] else None
        if "designation" in body:
            teacher.designation = body["designation"]
        if "is_active" in body:
            teacher.is_active = bool(body["is_active"])
            
        from sqlalchemy import func
        teacher.updated_at = func.current_timestamp()
        
        db.commit()
        db.refresh(teacher)
        
        return success_response(
            data=teacher_to_dict(teacher),
            message="Teacher updated successfully"
        )
    except IntegrityError:
        db.rollback()
        return error_response("Teacher ID already exists", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to update teacher: {str(e)}", 500)

@teachers_bp.route("/<string:teacher_id>", methods=["DELETE"])
@require_auth
@require_role(["org_admin"])
def deactivate_teacher(teacher_id):
    """Soft delete a teacher record."""
    db = get_db()
    
    try:
        teacher_uuid = UUID(teacher_id)
    except ValueError:
        return error_response("Invalid teacher ID format", 400)
    
    try:
        teacher = (
            db.query(Teacher)
            .filter(
                Teacher.id == teacher_uuid,
                Teacher.organization_id == g.organization_id,
            )
            .one_or_none()
        )
        
        if not teacher:
            return error_response("Teacher not found", 404)
        
        teacher.is_active = False
        from sqlalchemy import func
        teacher.updated_at = func.current_timestamp()
        
        db.commit()
        
        return success_response(
            message="Teacher deactivated successfully"
        )
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to deactivate teacher: {str(e)}", 500)
