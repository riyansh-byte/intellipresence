from flask import Blueprint, request, g
from uuid import UUID
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.utils.response import success_response, error_response
from app.utils.serializers import teacher_to_dict
from app.middleware.auth_middleware import require_auth, require_role
from app.database import get_db
from app.models import Teacher

teachers_bp = Blueprint("teachers", __name__)

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
