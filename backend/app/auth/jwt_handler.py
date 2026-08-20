import jwt
import base64
from jwt import PyJWKClient
from app.config.settings import Config

# Cache JWKS client so we don't re-fetch the public keys on every request
_jwks_client: PyJWKClient | None = None
JWT_CLOCK_SKEW_LEEWAY_SECONDS = 120

def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        supabase_url = Config.SUPABASE_URL.rstrip("/")
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        # cache_keys=True caches the JWKS response; lifespan controls re-fetch interval
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)
    return _jwks_client


def decode_supabase_token(token: str) -> dict:
    """
    Decodes a JWT issued by Supabase Auth.

    Supabase newer projects use ES256 (asymmetric ECDSA) — verified via JWKS public key.
    Older projects may use HS256 — verified via the shared SUPABASE_JWT_SECRET.
    The algorithm is auto-detected from the JWT header.
    """
    try:
        header = jwt.get_unverified_header(token)
    except jwt.DecodeError as e:
        raise Exception(f"Malformed token: {e}")

    algorithm = header.get("alg", "HS256")

    try:
        if algorithm == "ES256":
            # Asymmetric signing — fetch the public key from Supabase JWKS endpoint
            jwks_client = _get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            decoded = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                audience="authenticated",
                leeway=JWT_CLOCK_SKEW_LEEWAY_SECONDS,
            )
        else:
            # Symmetric HS256 — use the shared JWT secret
            raw_secret = Config.SUPABASE_JWT_SECRET or "dev-fallback-secret"
            try:
                padded = raw_secret + "=" * (-len(raw_secret) % 4)
                secret_bytes = base64.b64decode(padded)
            except Exception:
                secret_bytes = raw_secret.encode("utf-8")

            decoded = jwt.decode(
                token,
                secret_bytes,
                algorithms=["HS256"],
                audience="authenticated",
                leeway=JWT_CLOCK_SKEW_LEEWAY_SECONDS,
            )

        return decoded

    except jwt.ExpiredSignatureError:
        raise Exception("Token signature has expired")
    except jwt.InvalidTokenError as e:
        raise Exception(f"Invalid authorization token: {e}")
    except Exception as e:
        # Catches JWKS fetch errors, network issues, etc.
        raise Exception(f"Token verification failed: {e}")
