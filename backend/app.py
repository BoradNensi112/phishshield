import os
import re
import json
import joblib
import socket
import numpy as np
from urllib.parse import urlparse, unquote
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

import database
import security

from utils.feature_extractor import FEATURE_NAMES, extract_features, extract_threat_reasons
from utils.whitelist import is_whitelisted

# Initialize SQLite database schema and migrate data
database.init_db()

security_bearer = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security_bearer)):
    """Authenticate and extract user from Bearer JWT token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Authentication token required. Please sign in.")
    token = credentials.credentials
    payload = security.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Session expired or invalid token. Please log in again.")

    email = payload.get("email")
    user = database.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="User account not found.")
    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Your account has been suspended by the SOC Administrator.")
    return user

def get_current_admin(credentials: HTTPAuthorizationCredentials | None = Depends(security_bearer)):
    """Authenticate and verify SOC Administrator clearance."""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Administrator authentication token required.")
    token = credentials.credentials
    payload = security.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Session expired or invalid token. Please log in again.")

    # Strictly verify that this token was issued from an authenticated Administrator login
    if not payload.get("is_admin"):
        raise HTTPException(status_code=403, detail="Clearance Denied: Requires SOC Administrator clearance.")

    email = payload.get("email", "").lower()
    user = database.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Administrator account not found.")
    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Your account has been suspended.")

    role = (user.get("role") or "").lower()
    is_admin_eligible = "admin" in role or "lead" in role or email == "admin@phishshield.com"
    if not is_admin_eligible:
        raise HTTPException(status_code=403, detail="Clearance Denied: Requires SOC Administrator privileges.")
    return user

app = FastAPI(
    title="PhishShield - Phishing Detection API",
    description="Machine Learning & Heuristic Phishing Detection Engine for BCA Final Year Project",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "phishing_model.pkl")
META_PATH = os.path.join(MODEL_DIR, "model_meta.json")
IMPORTANCE_PATH = os.path.join(MODEL_DIR, "feature_importance.json")

if os.path.exists(MODEL_DIR):
    app.mount("/static/model", StaticFiles(directory=MODEL_DIR), name="model_static")

model = None
if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        print(f"[+] Random Forest model loaded with {len(FEATURE_NAMES)} features.")
    except Exception as e:
        print(f"[-] Error loading model: {e}")

def check_domain_dns(hostname: str) -> dict:
    if not hostname:
        return {"exists": False, "ip": None, "status": "Invalid Hostname"}
    clean_host = hostname.split(":")[0].strip()
    try:
        socket.setdefaulttimeout(2.0)
        ip = socket.gethostbyname(clean_host)
        return {"exists": True, "ip": ip, "status": "Active (DNS Resolved)"}
    except Exception:
        return {"exists": False, "ip": None, "status": "Inactive / Unregistered Domain"}

def sanitize_url(raw_url: str) -> str:
    url = raw_url.strip()
    url = re.sub(r"^(https?):\s*/*", r"\1://", url, flags=re.IGNORECASE)
    if not url.startswith(("http://", "https://")):
        url = "http://" + url
    return url

class PredictRequest(BaseModel):
    url: str
    user_id: str | None = None
    user_email: str | None = None

class DnsInfo(BaseModel):
    exists: bool
    ip: str | None = None
    status: str

class PredictResponse(BaseModel):
    id: str | None = None
    timestamp: str | None = None
    url: str
    prediction: str
    confidence: float
    risk_score: float
    risk_level: str
    tier: str
    dns_info: DnsInfo
    threat_reasons: list[str]
    features: dict

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "PhishShield Detection Engine",
        "version": "1.2.0",
        "model_loaded": model is not None,
        "features_count": len(FEATURE_NAMES)
    }

@app.get("/model-info")
def get_model_info():
    if not os.path.exists(META_PATH):
        raise HTTPException(status_code=404, detail="Model metadata not found.")
    with open(META_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)
    return meta

@app.get("/feature-importance")
def get_feature_importance():
    if not os.path.exists(IMPORTANCE_PATH):
        raise HTTPException(status_code=404, detail="Feature importance data not found.")
    with open(IMPORTANCE_PATH, "r", encoding="utf-8") as f:
        importances = json.load(f)
    return importances

@app.post("/predict", response_model=PredictResponse)
def predict_url(req: PredictRequest):
    raw_input = (req.url or "").strip()
    if not raw_input:
        raise HTTPException(status_code=400, detail="URL cannot be empty.")

    # Enforce account suspension
    if req.user_email:
        u = database.get_user_by_email(req.user_email.strip().lower())
        if u and u.get("status") == "suspended":
            raise HTTPException(
                status_code=403,
                detail="Your analyst account has been suspended by the SOC Administrator. URL scanning is disabled."
            )

    normalized_url = sanitize_url(raw_input)
    parsed = urlparse(normalized_url)
    hostname = (parsed.hostname or "").lower()

    # Tier 1: Fast Allowlist
    if is_whitelisted(normalized_url):
        feats = extract_features(normalized_url)
        # Log whitelisted legitimate scan to SQLite database
        import datetime
        scan_id = f"scan_{int(datetime.datetime.now().timestamp() * 1000)}"
        scan_timestamp = datetime.datetime.now().isoformat() + "Z"
        try:
            scan_log = {
                "id": scan_id,
                "url": normalized_url,
                "prediction": "Legitimate",
                "confidence": 99.9,
                "risk_score": 0.1,
                "risk_level": "Safe",
                "tier": "Tier-1 Heuristic Whitelist",
                "dns_status": "Active (Trusted CDN / Whitelist)",
                "timestamp": scan_timestamp,
                "threat_count": 0,
                "user_id": (req.user_id or "").strip(),
                "user_email": (req.user_email or "").strip().lower(),
                "threat_reasons": [],
                "features": feats
            }
            database.insert_scan(scan_log)
        except Exception as e:
            print(f"[-] Whitelist SQLite scan log error: {e}")

        return PredictResponse(
            id=scan_id,
            timestamp=scan_timestamp,
            url=normalized_url,
            prediction="Legitimate",
            confidence=99.9,
            risk_score=0.1,
            risk_level="Safe",
            tier="Tier-1 Heuristic Whitelist",
            dns_info=DnsInfo(exists=True, ip="Trusted CDN", status="Verified Legitimate"),
            threat_reasons=[],
            features=feats
        )

    # Extract 33 Features & Threat Reasons
    feats = extract_features(normalized_url)
    reasons = extract_threat_reasons(feats, normalized_url)

    # Live DNS Check
    dns_res = check_domain_dns(hostname)
    if not dns_res["exists"]:
        reasons.append(f"Domain '{hostname}' does not exist on global DNS (Unregistered or Inactive website)")

    # Model inference
    if model is None:
        phishing_prob = 0.75 if reasons else 0.15
    else:
        feature_vector = np.array([[feats[name] for name in FEATURE_NAMES]], dtype=np.float32)
        proba = model.predict_proba(feature_vector)[0]
        phishing_prob = float(proba[1])

    # SEVERE SECURITY ANOMALY GUARDRAIL (Zero-Day Evasion Defense)
    # Check for obvious phishing tactics:
    # 1. Repeated characters >= 4 (e.g. "helooooo...")
    # 2. Extreme domain length (> 40 chars)
    # 3. Unregistered DNS + HTTP or length > 45
    # 4. Brand squatting + sensitive words
    is_severe_threat = False
    if feats.get("max_char_repeat", 1) >= 4:
        is_severe_threat = True
    if feats.get("domain_length", 0) > 40:
        is_severe_threat = True
    if (not dns_res["exists"]) and (feats.get("has_https", 0) == 0 or feats.get("url_length", 0) > 45 or feats.get("max_char_repeat", 1) >= 3):
        is_severe_threat = True
    if feats.get("is_ip_address", 0) == 1 and feats.get("has_sensitive_words_in_path", 0) >= 1:
        is_severe_threat = True

    if is_severe_threat:
        # Boost phishing probability to reflect severe anomalies
        phishing_prob = max(phishing_prob, 0.965)
        tier = "Tier-2 Hybrid Security Engine (Heuristics + Random Forest)"
    else:
        tier = "Tier-2 Random Forest ML Classifier"

    risk_score = round(phishing_prob * 100, 2)
    if phishing_prob >= 0.5:
        prediction = "Phishing"
        confidence = round(phishing_prob * 100, 2)
    else:
        prediction = "Legitimate"
        confidence = round((1 - phishing_prob) * 100, 2)

    if risk_score >= 70:
        risk_level = "High"
    elif risk_score >= 45:
        risk_level = "Medium"
    elif risk_score >= 20:
        risk_level = "Low"
    else:
        risk_level = "Safe"

    if prediction == "Phishing" and not reasons:
        reasons.append("Structural lexical anomalies detected by Random Forest model")

    # Log scan result to SQLite database
    import datetime
    scan_id = f"scan_{int(datetime.datetime.now().timestamp() * 1000)}"
    scan_timestamp = datetime.datetime.now().isoformat() + "Z"
    try:
        scan_log = {
            "id": scan_id,
            "url": normalized_url,
            "prediction": prediction,
            "confidence": confidence,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "tier": tier,
            "dns_status": dns_res.get("status", "Active"),
            "timestamp": scan_timestamp,
            "threat_count": len(reasons),
            "user_id": (req.user_id or "").strip(),
            "user_email": (req.user_email or "").strip().lower(),
            "threat_reasons": reasons,
            "features": feats
        }
        database.insert_scan(scan_log)
    except Exception as e:
        print(f"[-] SQLite scan log error: {e}")

    return PredictResponse(
        id=scan_id,
        timestamp=scan_timestamp,
        url=normalized_url,
        prediction=prediction,
        confidence=confidence,
        risk_score=risk_score,
        risk_level=risk_level,
        tier=tier,
        dns_info=DnsInfo(**dns_res),
        threat_reasons=reasons,
        features=feats
    )

# API Aliases (/api/...)
@app.get("/api/health")
def api_health_check():
    return health_check()

@app.get("/api/model-info")
def api_get_model_info():
    return get_model_info()

@app.get("/api/feature-importance")
def api_get_feature_importance():
    return get_feature_importance()

@app.post("/api/predict", response_model=PredictResponse)
def api_predict_url(req: PredictRequest):
    return predict_url(req)

# ==========================================
# SCAN HISTORY MANAGEMENT (SQLite BACKED)
# ==========================================

@app.get("/scans")
@app.get("/api/scans")
def get_scans(user_email: str | None = None, limit: int = 500, offset: int = 0):
    return database.get_scans(user_email=user_email, limit=limit, offset=offset)

@app.delete("/scans/{scan_id}")
@app.delete("/api/scans/{scan_id}")
def delete_scan(scan_id: str, user_email: str | None = None):
    scan = database.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found.")

    if user_email:
        clean_email = user_email.strip().lower()
        target_email = (scan.get("user_email") or "").lower()
        user_record = database.get_user_by_email(clean_email)
        role = (user_record.get("role") or "").lower() if user_record else ""
        is_admin = "admin" in role or "lead" in role or clean_email == "admin@phishshield.com"
        if target_email != clean_email and not is_admin:
            raise HTTPException(status_code=403, detail="Permission denied to delete this scan record.")

    deleted = database.delete_scan(scan_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scan record could not be deleted.")

    return {
        "success": True,
        "message": "Scan record permanently deleted from SQLite database.",
        "deleted_id": scan_id,
        "url": scan.get("url")
    }

@app.delete("/scans")
@app.delete("/api/scans")
def clear_scans(user_email: str | None = None):
    if not user_email:
        raise HTTPException(status_code=400, detail="user_email query parameter is required.")
    clean_email = user_email.strip().lower()
    deleted_count = database.clear_user_scans(clean_email)
    return {
        "success": True,
        "message": f"Successfully purged {deleted_count} private scan records for {clean_email}.",
        "deleted_count": deleted_count
    }

class BulkDeleteRequest(BaseModel):
    scan_ids: list[str]
    user_email: str | None = None

@app.post("/scans/bulk-delete")
@app.post("/api/scans/bulk-delete")
def bulk_delete_scans_endpoint(req: BulkDeleteRequest):
    if not req.scan_ids:
        return {"success": True, "deleted_count": 0}
    deleted = database.bulk_delete_scans(req.scan_ids, req.user_email)
    return {
        "success": True,
        "message": f"Successfully deleted {deleted} scan records.",
        "deleted_count": deleted
    }

# ==========================================
# AUTHENTICATION (JWT & PBKDF2-HMAC-SHA256)
# ==========================================

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "SOC Security Analyst"

ADMIN_MASTER_KEY = "PHISH_ADMIN_2026"

class LoginRequest(BaseModel):
    email: str
    password: str
    role_mode: str = "user"
    admin_secret_key: str | None = None

@app.post("/auth/register")
@app.post("/api/auth/register")
def register_user(req: RegisterRequest):
    email = (req.email or "").strip().lower()
    name = (req.name or "").strip()
    password = req.password or ""
    role = (req.role or "SOC Security Analyst").strip()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid analyst email address is required.")
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Analyst name must be at least 2 characters long.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Security password must be at least 6 characters.")

    existing = database.get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="Analyst profile with this email already exists.")

    salt = security.generate_salt()
    hashed = security.hash_password(password, salt)
    user = database.create_user(name=name, email=email, role=role, salt=salt, hashed_password=hashed)

    token = security.create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    })

    return {
        "success": True,
        "message": "Analyst account registered successfully",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "status": user["status"]
        },
        "token": token
    }

@app.post("/auth/login")
@app.post("/api/auth/login")
def login_user(req: LoginRequest):
    email = (req.email or "").strip().lower()
    password = req.password or ""

    if not email or not password:
        raise HTTPException(status_code=400, detail="Incorrect credentials")

    user = database.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect credentials")

    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended by Administrator. Access denied.")

    salt = user.get("salt", "")
    stored_hash = user.get("hashed_password", "")
    if not security.verify_password(password, salt, stored_hash):
        raise HTTPException(status_code=401, detail="Incorrect credentials")

    # Seamless migration: if user still had old SHA-256 hash, upgrade to PBKDF2
    if not stored_hash.startswith("pbkdf2_sha256$"):
        new_salt = security.generate_salt()
        new_hash = security.hash_password(password, new_salt)
        database.update_user_password(email, new_salt, new_hash)

    role = (user.get("role") or "").lower()
    is_admin_eligible = "admin" in role or "lead" in role or email == "admin@phishshield.com"

    # Strict isolation: session is ONLY admin if user chose 'admin' mode AND entered valid secret key
    if req.role_mode == "admin":
        if not req.admin_secret_key or req.admin_secret_key.strip() != ADMIN_MASTER_KEY:
            raise HTTPException(status_code=401, detail="Incorrect credentials")
        if not is_admin_eligible:
            raise HTTPException(status_code=401, detail="Incorrect credentials")
        session_is_admin = True
    else:
        # Standard user login: NEVER grant admin session
        session_is_admin = False

    token = security.create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": "SOC Administrator" if session_is_admin else user["role"],
        "is_admin": session_is_admin
    })

    return {
        "success": True,
        "message": "Authentication successful",
        "user": {
            "id": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": "SOC Administrator" if session_is_admin else user.get("role", "SOC Security Analyst"),
            "status": user.get("status", "active"),
            "is_admin": session_is_admin
        },
        "token": token
    }

# ==========================================
# SUPPORT & FEEDBACK MESSAGES
# ==========================================

class SupportMessageRequest(BaseModel):
    name: str
    email: str
    subject: str = "Issue / Help Request"
    message: str

@app.post("/api/support/message")
def submit_support_message(req: SupportMessageRequest):
    name = (req.name or "").strip()
    email = (req.email or "").strip().lower()
    subject = (req.subject or "Issue / Help Request").strip()
    msg = (req.message or "").strip()

    if not name or not email or not msg:
        raise HTTPException(status_code=400, detail="Name, email, and message are required.")

    saved = database.create_support_message(name, email, subject, msg)
    return {
        "success": True,
        "message": "Your incident / support request has been delivered to the Security Administrator.",
        "data": saved
    }

@app.get("/api/admin/support/messages")
def get_admin_support_messages(admin: dict = Depends(get_current_admin)):
    return database.get_support_messages()


# ==========================================
# USER PROFILE & SETTINGS (PROTECTED)
# ==========================================

class ProfileUpdateRequest(BaseModel):
    name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@app.get("/api/user/profile")
def get_user_profile(user: dict = Depends(get_current_user)):
    stats = database.get_user_scan_stats(user["email"])
    return {
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "status": user["status"],
            "created_at": user["created_at"]
        },
        "stats": stats
    }

@app.put("/api/user/profile")
def update_user_profile_endpoint(req: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    new_name = req.name.strip()
    if len(new_name) < 2:
        raise HTTPException(status_code=400, detail="Analyst name must be at least 2 characters.")
    database.update_user_profile(user["email"], new_name)
    return {"success": True, "message": "Profile updated successfully.", "name": new_name}

@app.put("/api/user/change-password")
def change_user_password(req: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    if not security.verify_password(req.current_password, user["salt"], user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect current security password.")

    new_salt = security.generate_salt()
    new_hash = security.hash_password(req.new_password, new_salt)
    database.update_user_password(user["email"], new_salt, new_hash)
    return {"success": True, "message": "Security credentials updated successfully."}

# ==========================================
# ADMIN PORTAL ENDPOINTS (ADMIN PROTECTED)
# ==========================================

@app.get("/api/admin/users")
def get_admin_users(admin: dict = Depends(get_current_admin)):
    return database.get_all_users_with_telemetry()

class CreateUserRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "SOC Security Analyst"
    status: str = "active"

@app.post("/api/admin/users")
def create_admin_user(req: CreateUserRequest, admin: dict = Depends(get_current_admin)):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    if len(req.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    if database.get_user_by_email(email):
        raise HTTPException(status_code=400, detail="Analyst profile with this email already exists.")

    salt = security.generate_salt()
    hashed = security.hash_password(req.password, salt)
    new_user = database.create_user(
        name=req.name.strip(),
        email=email,
        role=req.role.strip(),
        salt=salt,
        hashed_password=hashed,
        status=req.status.strip().lower()
    )
    return {
        "success": True,
        "message": f"Analyst profile {email} created successfully.",
        "user": new_user
    }

class RoleUpdateRequest(BaseModel):
    role: str

@app.put("/api/admin/users/{email}/role")
def update_user_role(email: str, req: RoleUpdateRequest, admin: dict = Depends(get_current_admin)):
    clean_email = unquote(unquote(email)).strip().lower()
    u = database.get_user_by_email(clean_email)
    if not u:
        raise HTTPException(status_code=404, detail="Analyst profile not found.")
    database.update_user_role(clean_email, req.role.strip())
    return {"success": True, "message": f"Privilege updated to {req.role}"}

class StatusUpdateRequest(BaseModel):
    status: str

@app.put("/api/admin/users/{email}/status")
def update_user_status(email: str, req: StatusUpdateRequest, admin: dict = Depends(get_current_admin)):
    clean_email = unquote(unquote(email)).strip().lower()
    if clean_email == "admin@phishshield.com":
        raise HTTPException(status_code=400, detail="Cannot suspend root system administrator.")
    u = database.get_user_by_email(clean_email)
    if not u:
        raise HTTPException(status_code=404, detail="Analyst profile not found.")
    new_status = req.status.strip().lower()
    if new_status not in ["active", "suspended"]:
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'suspended'.")
    database.update_user_status(clean_email, new_status)
    return {"success": True, "message": f"Account status set to {new_status}."}

class PasswordResetRequest(BaseModel):
    new_password: str

@app.put("/api/admin/users/{email}/password")
def reset_user_password(email: str, req: PasswordResetRequest, admin: dict = Depends(get_current_admin)):
    clean_email = unquote(unquote(email)).strip().lower()
    u = database.get_user_by_email(clean_email)
    if not u:
        raise HTTPException(status_code=404, detail="Analyst profile not found.")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    salt = security.generate_salt()
    hashed = security.hash_password(req.new_password, salt)
    database.update_user_password(clean_email, salt, hashed)
    return {"success": True, "message": f"Password for {clean_email} updated successfully."}

@app.delete("/api/admin/users/{email}")
def delete_user(email: str, admin: dict = Depends(get_current_admin)):
    clean_email = unquote(unquote(email)).strip().lower()
    if clean_email == "admin@phishshield.com":
        raise HTTPException(status_code=400, detail="Cannot delete root system administrator.")
    with database.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE LOWER(email) = LOWER(?)", (clean_email,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Analyst profile not found.")
    return {"success": True, "message": "Analyst profile permanently removed."}

@app.get("/api/admin/scans")
def get_admin_scans(admin: dict = Depends(get_current_admin)):
    return database.get_scans(limit=1000)

@app.delete("/api/admin/scans")
def clear_admin_scans(admin: dict = Depends(get_current_admin)):
    with database.get_db() as conn:
        conn.execute("DELETE FROM scans")
    return {"success": True, "message": "All global threat scan logs cleared from database."}


# Serve Frontend SPA in Production if built
FRONTEND_DIST = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))
if not os.path.exists(FRONTEND_DIST):
    FRONTEND_DIST = os.path.abspath(os.path.join(BASE_DIR, "dist"))

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend_assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        clean_path = (full_path or "").strip("/")
        if clean_path in ["health", "api/health"]:
            return health_check()
        if clean_path in ["model-info", "api/model-info"]:
            return get_model_info()
        if clean_path in ["feature-importance", "api/feature-importance"]:
            return get_feature_importance()
        if clean_path in ["scans", "api/scans"]:
            return get_scans()
        
        file_path = os.path.join(FRONTEND_DIST, clean_path)
        if clean_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Resource not found")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app:app", host=host, port=port, reload=True)
