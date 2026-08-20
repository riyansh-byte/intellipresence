from flask import Blueprint, request, g
from uuid import UUID
from datetime import datetime, timedelta, timezone
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.utils.response import success_response, error_response
from app.middleware.auth_middleware import require_auth, require_role
from app.database import get_db
from app.models import Invitation, Profile, Teacher, Student, Department
import os
from supabase import create_client, Client

invitations_bp = Blueprint("invitations", __name__)

# Initialize Supabase client for auth operations
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def _invite_redirect_url():
    app_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000").rstrip("/")
    return f"{app_url}/auth/confirm?next=/auth/callback"


def _can_manage_invitation(invitation):
    if g.role == "org_admin":
        return True
    return invitation.role == "student" and invitation.inviter_id == g.user_id


def _get_active_department(db, department_id):
    try:
        dept_uuid = UUID(department_id)
    except (TypeError, ValueError):
        return None, error_response("Invalid department ID format", 400)

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
        return None, error_response("Department not found in this organization", 404)
    return department, None


@invitations_bp.route("/", methods=["GET"])
@require_auth
@require_role(["org_admin", "teacher"])
def list_invitations():
    """List pending invitations visible to the current organization user."""
    db = get_db()
    
    try:
        query = db.query(Invitation).filter(
            Invitation.organization_id == g.organization_id,
            Invitation.status == "pending"
        )

        if g.role == "teacher":
            query = query.filter(
                Invitation.role == "student",
                Invitation.inviter_id == g.user_id,
            )
        
        # Filter by role if requested
        role_filter = request.args.get("role")
        if role_filter in ["teacher", "student"]:
            query = query.filter(Invitation.role == role_filter)
            
        invitations = query.order_by(Invitation.created_at.desc()).all()
        
        return success_response(
            data=[
                {
                    "id": str(inv.id),
                    "email": inv.email,
                    "full_name": inv.full_name,
                    "role": inv.role,
                    "status": inv.status,
                    "expires_at": inv.expires_at.isoformat() if inv.expires_at else None,
                    "created_at": inv.created_at.isoformat() if inv.created_at else None
                }
                for inv in invitations
            ],
            message="Invitations loaded successfully"
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to load invitations: {str(e)}", 500)


@invitations_bp.route("/teacher", methods=["POST"])
@require_auth
@require_role(["org_admin"])
def invite_teacher():
    """Invite a new teacher to the organization."""
    db = get_db()
    body = request.get_json() or {}
    
    # Required fields
    email = body.get("email")
    full_name = body.get("full_name")
    teacher_id = body.get("teacher_id")
    
    if not email or not full_name or not teacher_id:
        return error_response("Missing required fields: email, full_name, teacher_id", 400)
        
    # Optional fields
    department_id = body.get("department_id")
    designation = body.get("designation")

    if not department_id:
        return error_response("Department is required when inviting a teacher", 400)

    department, department_error = _get_active_department(db, department_id)
    if department_error:
        return department_error
        
    try:
        # Create invitation (expires in 30 days)
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        
        invitation = Invitation(
            organization_id=g.organization_id,
            inviter_id=g.user_id,
            email=email.lower(),
            full_name=full_name,
            role="teacher",
            teacher_id=teacher_id,
            department_id=department.id,
            designation=designation,
            status="pending",
            expires_at=expires_at
        )
        
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        
        invite_link = None
        email_sent = False
        redirect_to = _invite_redirect_url()
        
        if supabase:
            # 1. Attempt to send the invite email via Supabase Auth
            try:
                print(f"[INVITE] Sending invite to {email.lower()} via Supabase Auth...")
                result = supabase.auth.admin.invite_user_by_email(
                    email.lower(),
                    options={
                        "data": {
                            "organization_id": str(g.organization_id),
                            "role": "teacher",
                            "invitation_id": str(invitation.id)
                        },
                        "redirect_to": redirect_to
                    }
                )
                email_sent = True
                print(f"[INVITE] Supabase Auth successfully accepted email request for {email.lower()}")
                # Extract link if available in response
                invite_link = getattr(result.user, "action_link", None)
            except Exception as e:
                print(f"[INVITE] Supabase invite_user_by_email failed (likely SMTP or limits): {e}")
            
            # 2. Fallback to generate the link manually so the admin can copy-paste it
            if not invite_link:
                try:
                    print(f"[INVITE] Fallback: Generating manual link for {email.lower()}...")
                    result_link = supabase.auth.admin.generate_link({
                        "type": "invite",
                        "email": email.lower(),
                        "options": {
                            "data": {
                                "organization_id": str(g.organization_id),
                                "role": "teacher",
                                "invitation_id": str(invitation.id)
                            },
                            "redirect_to": redirect_to
                        }
                    })
                    invite_link = getattr(getattr(result_link, "properties", None), "action_link", None)
                    print(f"[INVITE] Fallback link generated: {invite_link}")
                except Exception as ex:
                    print(f"[INVITE] Fallback generate_link also failed: {ex}")
        
        return success_response(
            data={
                "invitation_id": str(invitation.id),
                "invite_link": invite_link,
                "email_sent": email_sent,
                "email": email,
                "expires_at": expires_at.isoformat()
            },
            message="Teacher invitation created successfully",
            status_code=201
        )
    except IntegrityError:
        db.rollback()
        return error_response("This email has already been invited in this organization", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to create invitation: {str(e)}", 500)


@invitations_bp.route("/student", methods=["POST"])
@require_auth
@require_role(["org_admin", "teacher"])
def invite_student():
    """Invite a new student to the organization."""
    db = get_db()
    body = request.get_json() or {}
    
    # Required fields
    email = body.get("email")
    full_name = body.get("full_name")
    student_id = body.get("student_id")
    roll_number = body.get("roll_number")
    
    if not email or not full_name or not student_id or not roll_number:
        return error_response("Missing required fields: email, full_name, student_id, roll_number", 400)
        
    # Optional fields
    department_id = body.get("department_id")
    
    try:
        dept_uuid = UUID(department_id) if department_id else None
    except ValueError:
        return error_response("Invalid department ID format", 400)
        
    try:
        # Create invitation (expires in 7 days)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        invitation = Invitation(
            organization_id=g.organization_id,
            inviter_id=g.user_id,
            email=email.lower(),
            full_name=full_name,
            role="student",
            student_id=student_id,
            roll_number=roll_number,
            department_id=dept_uuid,
            status="pending",
            expires_at=expires_at
        )
        
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        
        invite_link = None
        email_sent = False
        redirect_to = _invite_redirect_url()
        
        if supabase:
            # 1. Attempt to send the invite email via Supabase Auth
            try:
                print(f"[INVITE] Sending invite to {email.lower()} via Supabase Auth...")
                result = supabase.auth.admin.invite_user_by_email(
                    email.lower(),
                    options={
                        "data": {
                            "organization_id": str(g.organization_id),
                            "role": "student",
                            "invitation_id": str(invitation.id)
                        },
                        "redirect_to": redirect_to
                    }
                )
                email_sent = True
                print(f"[INVITE] Supabase Auth successfully accepted email request for {email.lower()}")
                invite_link = getattr(result.user, "action_link", None)
            except Exception as e:
                print(f"[INVITE] Supabase invite_user_by_email failed: {e}")
            
            # 2. Fallback to generate the link manually so the admin can copy-paste it
            if not invite_link:
                try:
                    print(f"[INVITE] Fallback: Generating manual link for {email.lower()}...")
                    result_link = supabase.auth.admin.generate_link({
                        "type": "invite",
                        "email": email.lower(),
                        "options": {
                            "data": {
                                "organization_id": str(g.organization_id),
                                "role": "student",
                                "invitation_id": str(invitation.id)
                            },
                            "redirect_to": redirect_to
                        }
                    })
                    invite_link = getattr(getattr(result_link, "properties", None), "action_link", None)
                    print(f"[INVITE] Fallback link generated: {invite_link}")
                except Exception as ex:
                    print(f"[INVITE] Fallback generate_link also failed: {ex}")
        
        return success_response(
            data={
                "invitation_id": str(invitation.id),
                "invite_link": invite_link,
                "email_sent": email_sent,
                "email": email,
                "expires_at": expires_at.isoformat()
            },
            message="Student invitation created successfully",
            status_code=201
        )
    except IntegrityError:
        db.rollback()
        return error_response("This email has already been invited in this organization", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to create invitation: {str(e)}", 500)


@invitations_bp.route("/<invitation_id>/resend", methods=["POST"])
@require_auth
@require_role(["org_admin", "teacher"])
def resend_invitation(invitation_id):
    """Resend an existing invitation."""
    db = get_db()
    
    try:
        inv_uuid = UUID(invitation_id)
    except ValueError:
        return error_response("Invalid invitation ID format", 400)
        
    try:
        invitation = db.query(Invitation).filter(
            Invitation.id == inv_uuid,
            Invitation.organization_id == g.organization_id
        ).one_or_none()
        
        if not invitation:
            return error_response("Invitation not found", 404)

        if not _can_manage_invitation(invitation):
            return error_response("Forbidden: You can only manage invitations allowed for your role", 403)
            
        if invitation.status != "pending":
            return error_response("Cannot resend an invitation that is not pending", 400)
            
        # Update expiration date
        invitation.expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        invitation.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        
        invite_link = None
        email_sent = False
        redirect_to = _invite_redirect_url()
        
        if supabase:
            try:
                result = supabase.auth.admin.invite_user_by_email(
                    invitation.email,
                    options={
                        "data": {
                            "organization_id": str(g.organization_id),
                            "role": invitation.role,
                            "invitation_id": str(invitation.id)
                        },
                        "redirect_to": redirect_to
                    }
                )
                email_sent = True
                invite_link = getattr(result.user, "action_link", None)
            except Exception as e:
                print(f"Supabase invite email sending failed: {e}")
                
            if not invite_link:
                try:
                    result_link = supabase.auth.admin.generate_link({
                        "type": "invite",
                        "email": invitation.email,
                        "options": {
                            "data": {
                                "organization_id": str(g.organization_id),
                                "role": invitation.role,
                                "invitation_id": str(invitation.id)
                            },
                            "redirect_to": redirect_to
                        }
                    })
                    invite_link = getattr(getattr(result_link, "properties", None), "action_link", None)
                except Exception as ex:
                    print(f"Fallback generate_link failed: {ex}")
        
        return success_response(
            data={
                "invite_link": invite_link,
                "email_sent": email_sent,
                "new_expires_at": invitation.expires_at.isoformat()
            },
            message="Invitation resent successfully"
        )
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to resend invitation: {str(e)}", 500)


@invitations_bp.route("/<invitation_id>/cancel", methods=["POST"])
@require_auth
@require_role(["org_admin", "teacher"])
def cancel_invitation(invitation_id):
    """Cancel a pending invitation."""
    db = get_db()
    
    try:
        inv_uuid = UUID(invitation_id)
    except ValueError:
        return error_response("Invalid invitation ID format", 400)
        
    try:
        invitation = db.query(Invitation).filter(
            Invitation.id == inv_uuid,
            Invitation.organization_id == g.organization_id
        ).one_or_none()
        
        if not invitation:
            return error_response("Invitation not found", 404)

        if not _can_manage_invitation(invitation):
            return error_response("Forbidden: You can only manage invitations allowed for your role", 403)
            
        if invitation.status != "pending":
            return error_response("Cannot cancel an invitation that is not pending", 400)
            
        invitation.status = "cancelled"
        invitation.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        
        return success_response(
            message="Invitation cancelled successfully"
        )
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to cancel invitation: {str(e)}", 500)


@invitations_bp.route("/accept", methods=["POST"])
@require_auth(allow_no_profile=True)
def accept_invitation():
    """Accept an invitation (called after user signs up via Supabase)."""
    db = get_db()
    body = request.get_json(silent=True) or {}
    
    # Get user info from authenticated context
    user_email = g.user.get("email")
    user_id = g.user_id

    if not user_email:
        return error_response("Authenticated user email is required to accept an invitation", 400)
    
    try:
        # Check if profile already exists (idempotency check)
        existing_profile = db.query(Profile).filter(Profile.id == user_id).one_or_none()
        if existing_profile:
            return success_response(
                message="Invitation already accepted",
                data={
                    "role": existing_profile.role,
                    "organization_id": str(existing_profile.organization_id)
                }
            )

        # Find the most recent invitation for this email (pending, accepted, or expired)
        # We look beyond just "pending" to handle cases where:
        # - The invitation was marked accepted but profile creation failed
        # - The invitation expired but the user still needs to set up their account
        invitation = db.query(Invitation).filter(
            Invitation.email == user_email.lower(),
            Invitation.status.in_(["pending", "accepted", "expired"])
        ).order_by(Invitation.created_at.desc()).first()
        
        if not invitation:
            return error_response("No invitation found for this email", 404)
            
        # Auto-renew expired invitations — teacher/student shouldn't be locked out
        # just because the original invite link expired before they could accept it
        if invitation.expires_at and datetime.now(timezone.utc) > invitation.expires_at:
            invitation.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
            invitation.status = "pending"
            invitation.updated_at = datetime.now(timezone.utc)
            db.flush()
            
        # Create profile
        profile = Profile(
            id=user_id,
            organization_id=invitation.organization_id,
            email=user_email.lower(),
            full_name=invitation.full_name,
            role=invitation.role,
            is_active=True
        )
        db.add(profile)
        
        # Create teacher or student record based on role
        if invitation.role == "teacher":
            teacher = Teacher(
                organization_id=invitation.organization_id,
                profile_id=user_id,
                teacher_id=invitation.teacher_id,
                full_name=invitation.full_name,
                email=user_email.lower(),
                department_id=invitation.department_id,
                designation=invitation.designation,
                is_active=True
            )
            db.add(teacher)
        elif invitation.role == "student":
            student = Student(
                organization_id=invitation.organization_id,
                profile_id=user_id,
                student_id=invitation.student_id,
                full_name=invitation.full_name,
                email=user_email.lower(),
                roll_number=invitation.roll_number,
                department_id=invitation.department_id,
                is_active=True
            )
            db.add(student)
            
        # Update invitation status
        invitation.status = "accepted"
        invitation.accepted_at = datetime.now(timezone.utc)
        invitation.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        
        return success_response(
            message="Invitation accepted successfully",
            data={
                "role": invitation.role,
                "organization_id": str(invitation.organization_id)
            }
        )
    except IntegrityError:
        db.rollback()
        return error_response("Database integrity error while accepting invitation", 409)
    except SQLAlchemyError as e:
        db.rollback()
        return error_response(f"Failed to accept invitation: {str(e)}", 500)


@invitations_bp.route("/check", methods=["GET"])
def check_invitation():
    """Check if an email has a pending invitation (called before sign up)."""
    email = request.args.get("email")
    
    if not email:
        return error_response("Email parameter is required", 400)
        
    db = get_db()
    
    try:
        invitation = db.query(Invitation).filter(
            Invitation.email == email.lower(),
            Invitation.status == "pending"
        ).one_or_none()
        
        if not invitation:
            return success_response(
                data={"has_invitation": False},
                message="No pending invitation found"
            )
            
        if invitation.expires_at and datetime.now(timezone.utc) > invitation.expires_at:
            return success_response(
                data={"has_invitation": False},
                message="Invitation has expired"
            )
            
        return success_response(
            data={
                "has_invitation": True,
                "role": invitation.role,
                "full_name": invitation.full_name
            },
            message="Pending invitation found"
        )
    except SQLAlchemyError as e:
        return error_response(f"Failed to check invitation: {str(e)}", 500)
