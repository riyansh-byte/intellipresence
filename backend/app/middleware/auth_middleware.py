from functools import wraps
from uuid import UUID
from flask import request, g
from sqlalchemy.exc import SQLAlchemyError
from app.auth.jwt_handler import decode_supabase_token
from app.database import get_db
from app.models import Profile
from app.utils.response import error_response

def require_auth(f_or_allow_no_profile=None, **decorator_kwargs):
    """Decorator to require authenticated token verification for endpoints."""
    allow_no_profile = decorator_kwargs.get("allow_no_profile", False)
    
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
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
            if not user_id:
                return error_response("Token is missing authenticated subject", 401)
    
            try:
                user_uuid = UUID(str(user_id))
            except ValueError:
                return error_response("Token subject is not a valid user id", 401)
    
            try:
                profile = (
                    get_db()
                    .query(Profile)
                    .filter(
                        Profile.id == user_uuid,
                        Profile.is_active.is_(True),
                        Profile.deleted_at.is_(None),
                    )
                    .one_or_none()
                )
            except RuntimeError as e:
                return error_response(str(e), 503)
            except SQLAlchemyError as e:
                print("SQLAlchemyError in require_auth:", str(e))
                import traceback
                traceback.print_exc()
                return error_response(f"Unable to load authenticated profile: {str(e)}", 503)
    
            if profile is None and not allow_no_profile:
                return error_response("Authenticated profile was not found or is inactive", 403)
    
            g.user = user_payload
            g.user_id = user_uuid
            
            if profile is not None:
                g.organization_id = profile.organization_id
                g.role = profile.role
                g.profile = profile
            else:
                g.organization_id = None
                g.role = None
                g.profile = None
                
            return f(*args, **kwargs)
        return decorated

    if callable(f_or_allow_no_profile):
        return decorator(f_or_allow_no_profile)
    elif f_or_allow_no_profile is not None:
        allow_no_profile = bool(f_or_allow_no_profile)
        
    def wrapper(f):
        return decorator(f)
    return wrapper

def require_role(roles):
    """Decorator to assert user has specific authorization role access."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(g, "user"):
                return error_response("User context not established", 401)
            
            user_role = getattr(g, "role", None)
            
            if user_role not in roles:
                return error_response("Forbidden: Insufficient privileges", 403)
                
            return f(*args, **kwargs)
        return decorated
    return decorator
