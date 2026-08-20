from flask import Blueprint, request, g
from uuid import UUID
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.utils.response import success_response, error_response
from app.utils.serializers import course_to_dict
from app.middleware.auth_middleware import require_auth, require_role
from app.database import get_db
from app.models import Course

courses_bp = Blueprint("courses", __name__)

@courses_bp.route("/", methods=["GET"])
@require_auth
@require_role(["org_admin", "teacher"])
def list_courses():
    """Retrieve all courses for the active organization."""
    db = get_db()
    
    try:
        query = db.query(Course).filter(
            Course.organization_id == g.organization_id,
        )
        
        # Optional filters
        department_id = request.args.get("department_id")
        if department_id:
            try:
                dept_uuid = UUID(department_id)
                query = query.filter(Course.department_id == dept_uuid)
            except ValueError:
                pass
                
        courses = query.order_by(Course.name).all()
        
        return success_response(
            data=[course_to_dict(c, include_department=True) for c in courses],
            message="Courses loaded successfully"
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load courses: {str(e)}", 500)

@courses_bp.route("/<string:course_id>", methods=["GET"])
@require_auth
def get_course(course_id):
    """Retrieve a single course by ID."""
    db = get_db()
    
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        return error_response("Invalid course ID format", 400)
    
    try:
        course = (
            db.query(Course)
            .filter(
                Course.id == course_uuid,
                Course.organization_id == g.organization_id,
            )
            .one_or_none()
        )
        
        if not course:
            return error_response("Course not found", 404)
            
        return success_response(
            data=course_to_dict(course, include_department=True)
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load course: {str(e)}", 500)

@courses_bp.route("/", methods=["POST"])
@require_auth
@require_role(["org_admin"])
def create_course():
    """Create a new course."""
    db = get_db()
    body = request.get_json() or {}
    
    name = body.get("name")
    code = body.get("code")
    department_id = body.get("department_id")
    
    if not name or not code:
        return error_response("Missing required fields: name, code")
    
    try:
        new_course = Course(
            organization_id=g.organization_id,
            name=name,
            code=code,
            department_id=UUID(department_id) if department_id else None,
        )
        
        db.add(new_course)
        db.commit()
        db.refresh(new_course)
        
        return success_response(
            data=course_to_dict(new_course),
            message="Course created successfully",
            status_code=201
        )
    except IntegrityError:
        db.rollback()
        return error_response("Course code already exists in this organization", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to create course: {str(e)}", 500)

@courses_bp.route("/<string:course_id>", methods=["PUT"])
@require_auth
@require_role(["org_admin"])
def update_course(course_id):
    """Update an existing course."""
    db = get_db()
    
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        return error_response("Invalid course ID format", 400)
    
    body = request.get_json() or {}
    
    try:
        course = (
            db.query(Course)
            .filter(
                Course.id == course_uuid,
                Course.organization_id == g.organization_id,
            )
            .one_or_none()
        )
        
        if not course:
            return error_response("Course not found", 404)
        
        if "name" in body:
            course.name = body["name"]
        if "code" in body:
            course.code = body["code"]
        if "department_id" in body:
            course.department_id = UUID(body["department_id"]) if body["department_id"] else None
            
        from sqlalchemy import func
        course.updated_at = func.current_timestamp()
        
        db.commit()
        db.refresh(course)
        
        return success_response(
            data=course_to_dict(course),
            message="Course updated successfully"
        )
    except IntegrityError:
        db.rollback()
        return error_response("Course code already exists", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to update course: {str(e)}", 500)

@courses_bp.route("/<string:course_id>", methods=["DELETE"])
@require_auth
@require_role(["org_admin"])
def delete_course(course_id):
    """Delete a course (hard delete for simplicity as no soft delete field)."""
    db = get_db()
    
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        return error_response("Invalid course ID format", 400)
    
    try:
        course = (
            db.query(Course)
            .filter(
                Course.id == course_uuid,
                Course.organization_id == g.organization_id,
            )
            .one_or_none()
        )
        
        if not course:
            return error_response("Course not found", 404)
        
        db.delete(course)
        db.commit()
        
        return success_response(
            message="Course deleted successfully"
        )
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to delete course: {str(e)}", 500)
