from flask import Blueprint, g, request
from uuid import UUID
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.utils.response import success_response, error_response
from app.utils.serializers import organization_to_dict, profile_to_dict
from app.middleware.auth_middleware import require_auth
from app.database import get_db
from app.models import Organization, Profile, Department, Invitation
from app.auth.jwt_handler import decode_supabase_token

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/session", methods=["GET"])
@require_auth
def get_session():
    """Verify session token integrity and return active user claim context."""
    return success_response(
        data={
            "user": g.user,
            "profile": profile_to_dict(g.profile),
            "organization": organization_to_dict(g.profile.organization),
        },
        message="Active session verified"
    )

@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user():
    """Return the authenticated profile and tenant context for the frontend."""
    return success_response(
        data={
            "profile": profile_to_dict(g.profile),
            "organization": organization_to_dict(g.profile.organization),
            "context": {
                "user_id": str(g.user_id),
                "organization_id": str(g.organization_id),
                "role": g.role,
            },
        },
        message="Authenticated profile context loaded"
    )

@auth_bp.route("/register-org", methods=["POST"])
def register_organization():
    """Endpoint representing workspace multi-tenant registration endpoint."""
    body = request.get_json() or {}
    org_name = body.get("name")
    admin_email = body.get("email")
    
    if not org_name or not admin_email:
        return error_response("Missing required registration inputs")
        
    # Standard multi-tenant registration logic is handled inside Supabase trigger hooks
    return success_response(
        data={
            "organization": {
                "id": "org_mock_9921",
                "name": org_name,
                "status": "pending_setup"
            }
        },
        message="Organization workspace registered. Complete onboarding wizard."
    )

@auth_bp.route("/complete-setup", methods=["POST"])
def complete_setup():
    """Complete organization setup: creates org, admin profile, and initial departments."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return error_response("Authorization header is missing", 401)
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return error_response("Header format must be Bearer <token>", 401)
        
    token = parts[1]
    try:
        user_payload = decode_supabase_token(token)
    except Exception as e:
        return error_response(str(e), 401)

    user_id = user_payload.get("sub")
    user_email = user_payload.get("email")
    if not user_id or not user_email:
        return error_response("Token is missing required claims", 401)

    user_metadata = user_payload.get("user_metadata", {}) or {}
    if user_metadata.get("role") in ["teacher", "student"]:
        return error_response("Invited teacher/student accounts cannot set up an organization", 403)

    try:
        user_uuid = UUID(str(user_id))
    except ValueError:
        return error_response("Token subject is not a valid user id", 401)

    body = request.get_json() or {}
    org_name = body.get("organization_name")
    departments_data = body.get("departments", [])

    if not org_name:
        return error_response("Organization name is required", 400)

    db = get_db()
    try:
        # Check if profile already exists
        existing_profile = db.query(Profile).filter(Profile.id == user_uuid).one_or_none()
        if existing_profile:
            return success_response(
                data={
                    "profile": profile_to_dict(existing_profile),
                    "organization": organization_to_dict(existing_profile.organization)
                },
                message="Setup already completed"
            )

        existing_invitation = (
            db.query(Invitation)
            .filter(
                Invitation.email == user_email.lower(),
                Invitation.status.in_(["pending", "accepted", "expired"]),
            )
            .one_or_none()
        )
        if existing_invitation:
            return error_response("Invited users must accept their invitation instead of creating an organization", 403)

        # Create Organization
        domain = user_email.split("@")[1] if "@" in user_email else f"org-{user_uuid}.com"
        organization = Organization(
            name=org_name,
            domain=domain
        )
        db.add(organization)
        db.flush()  # Get organization.id

        # Create Profile
        full_name = user_metadata.get("full_name") or user_email.split("@")[0]
        profile = Profile(
            id=user_uuid,
            organization_id=organization.id,
            email=user_email,
            full_name=full_name,
            role="org_admin"
        )
        db.add(profile)

        # Create Departments
        departments = []
        for dept in departments_data:
            department = Department(
                organization_id=organization.id,
                name=dept.get("name"),
                code=dept.get("code")
            )
            db.add(department)
            departments.append(department)

        db.commit()

        return success_response(
            data={
                "profile": profile_to_dict(profile),
                "organization": organization_to_dict(organization),
                "departments": [
                    {"id": str(d.id), "name": d.name, "code": d.code} 
                    for d in departments
                ]
            },
            message="Organization setup completed successfully"
        )
    except IntegrityError:
        db.rollback()
        return error_response("Organization with this domain already exists", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to complete setup: {str(e)}", 500)
