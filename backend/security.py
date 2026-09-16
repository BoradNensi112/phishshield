"""
Security & Cryptography Layer for PhishShield SOC Platform
- PBKDF2-HMAC-SHA256 (100,000 iterations) with legacy SHA256 migration
- Standard RFC 7519 HMAC-SHA256 Signed JWT implementation with expiration
"""

import os
import json
import time
import hmac
import base64
import hashlib
import secrets
from datetime import datetime, timedelta

JWT_SECRET = os.getenv("JWT_SECRET", "phishshield_enterprise_jwt_secret_key_2026_soc_tier1")
JWT_ALGORITHM = "HS256"
DEFAULT_EXPIRE_HOURS = 24

def generate_salt() -> str:
    return secrets.token_hex(16)

def hash_password(password: str, salt: str) -> str:
    """Derive secure password hash using PBKDF2-HMAC-SHA256 with 100,000 iterations."""
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"pbkdf2_sha256${key.hex()}"

def verify_password(plain_password: str, salt: str, stored_hash: str) -> bool:
    """Verify password against PBKDF2 hash, with automatic legacy SHA256 compatibility."""
    if not stored_hash:
        return False

    if stored_hash.startswith("pbkdf2_sha256$"):
        expected = hash_password(plain_password, salt)
        return hmac.compare_digest(expected, stored_hash)

    # Legacy SHA256 fallback for existing accounts
    legacy_hash = hashlib.sha256((salt + plain_password).encode("utf-8")).hexdigest()
    if hmac.compare_digest(legacy_hash, stored_hash):
        return True

    return False

# ==========================================
# STANDARD RFC 7519 JWT IMPLEMENTATION
# ==========================================

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')

def _base64url_decode(data: str) -> bytes:
    padding = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode('ascii'))

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Generate a standard cryptographically signed JWT token with expiration."""
    header = {
        "alg": JWT_ALGORITHM,
        "typ": "JWT"
    }
    
    payload = data.copy()
    now = int(time.time())
    if expires_delta:
        expire = now + int(expires_delta.total_seconds())
    else:
        expire = now + (DEFAULT_EXPIRE_HOURS * 3600)

    payload["iat"] = now
    payload["exp"] = expire

    header_bytes = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')

    encoded_header = _base64url_encode(header_bytes)
    encoded_payload = _base64url_encode(payload_bytes)

    signing_input = f"{encoded_header}.{encoded_payload}".encode('ascii')
    signature = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
    encoded_signature = _base64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def decode_access_token(token: str) -> dict | None:
    """Validate signature and expiration of JWT token and return payload."""
    try:
        parts = token.strip().split('.')
        if len(parts) != 3:
            return None

        encoded_header, encoded_payload, encoded_signature = parts

        # Verify Signature
        signing_input = f"{encoded_header}.{encoded_payload}".encode('ascii')
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(encoded_signature)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        # Verify Header
        header = json.loads(_base64url_decode(encoded_header).decode('utf-8'))
        if header.get("alg") != JWT_ALGORITHM:
            return None

        # Verify Expiry
        payload = json.loads(_base64url_decode(encoded_payload).decode('utf-8'))
        now = int(time.time())
        if payload.get("exp") and payload["exp"] < now:
            return None

        return payload
    except Exception:
        return None
