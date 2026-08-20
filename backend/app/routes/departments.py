from flask import Blueprint, request, g
from uuid import UUID
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.utils.response import success_response, error_response
from app.utils.serializers import department_to_dict
from app.middleware.auth_middleware import require_auth, require_role
from app.database import get_db
from app.models import Department

departments_bp = Blueprint("departments", __name__)

@departments_bp.route("/", methods=["GET"])
@require_auth
@require_role(["org_admin", "teacher"])
def list_departments():
    """Retrieve all departments for the active organization."""
    db = get_db()
    
    try:
        departments = (
            db.query(Department)
            .filter(
                Department.organization_id == g.organization_id,
                Department.is_active.is_(True),
            )
            .order_by(Department.name)
            .all()
        )
        
        return success_response(
            data=[department_to_dict(d) for d in departments],
            message="Departments loaded successfully"
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load departments: {str(e)}", 500)

@departments_bp.route("/<string:department_id>", methods=["GET"])
@require_auth
def get_department(department_id):
    """Retrieve a single department by ID."""
    db = get_db()
    
    try:
        dept_uuid = UUID(department_id)
    except ValueError:
        return error_response("Invalid department ID format", 400)
    
    try:
        department = (
            db.query(Department)
            .filter(
                Department.id == dept_uuid,
                Department.organization_id == g.organization_id,
                Department.is_active.is_(True),
            )
            .one_or_none()
        )
        
        if not department:
            return error_response("Department not found", 404)
            
        return success_response(data=department_to_dict(department))
    except SQLAlchemyError as e:
        return error_response(f"Failed to load department: {str(e)}", 500)

@departments_bp.route("/", methods=["POST"])
@require_auth
@require_role(["org_admin"])
def create_department():
    """Create a new department."""
    db = get_db()
    body = request.get_json() or {}
    
    name = body.get("name")
    code = body.get("code")
    
    if not name or not code:
        return error_response("Missing required fields: name, code")
    
    try:
        new_dept = Department(
            organization_id=g.organization_id,
            name=name,
            code=code,
            is_active=True,
        )
        
        db.add(new_dept)
        db.commit()
        db.refresh(new_dept)
        
        return success_response(
            data=department_to_dict(new_dept),
            message="Department created successfully",
            status_code=201
        )
    except IntegrityError:
        db.rollback()
        return error_response("Department code already exists in this organization", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to create department: {str(e)}", 500)

@departments_bp.route("/<string:department_id>", methods=["PUT"])
@require_auth
@require_role(["org_admin"])
def update_department(department_id):
    """Update an existing department."""
    db = get_db()
    
    try:
        dept_uuid = UUID(department_id)
    except ValueError:
        return error_response("Invalid department ID format", 400)
    
    body = request.get_json() or {}
    
    try:
        department = (
            db.query(Department)
            .filter(
                Department.id == dept_uuid,
                Department.organization_id == g.organization_id,
            )
            .one_or_none()
        )
        
        if not department:
            return error_response("Department not found", 404)
        
        if "name" in body:
            department.name = body["name"]
        if "code" in body:
            department.code = body["code"]
        if "is_active" in body:
            department.is_active = bool(body["is_active"])
            
        from sqlalchemy import func
        department.updated_at = func.current_timestamp()
        
        db.commit()
        db.refresh(department)
        
        return success_response(
            data=department_to_dict(department),
            message="Department updated successfully"
        )
    except IntegrityError:
        db.rollback()
        return error_response("Department code already exists", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to update department: {str(e)}", 500)

@departments_bp.route("/<string:department_id>", methods=["DELETE"])
@require_auth
@require_role(["org_admin"])
def deactivate_department(department_id):
    """Soft delete a department."""
    db = get_db()
    
    try:
        dept_uuid = UUID(department_id)
    except ValueError:
        return error_response("Invalid department ID format", 400)
    
    try:
        department = (
            db.query(Department)
            .filter(
                Department.id == dept_uuid,
                Department.organization_id == g.organization_id,
            )
            .one_or_none()
        )
        
        if not department:
            return error_response("Department not found", 404)
        
        department.is_active = False
        from sqlalchemy import func
        department.updated_at = func.current_timestamp()
        
        db.commit()
        
        return success_response(
            message="Department deactivated successfully"
        )
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to deactivate department: {str(e)}", 500)
