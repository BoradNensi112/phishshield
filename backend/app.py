import os
import re
import json
import joblib
import socket
import numpy as np
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from utils.feature_extractor import FEATURE_NAMES, extract_features, extract_threat_reasons
from utils.whitelist import is_whitelisted

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

class DnsInfo(BaseModel):
    exists: bool
    ip: str | None = None
    status: str

class PredictResponse(BaseModel):
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

    normalized_url = sanitize_url(raw_input)
    parsed = urlparse(normalized_url)
    hostname = (parsed.hostname or "").lower()

    # Tier 1: Fast Allowlist
    if is_whitelisted(normalized_url):
        feats = extract_features(normalized_url)
        return PredictResponse(
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

    # Log scan result to server-side JSON storage
    try:
        import datetime
        scan_log = {
            "id": f"scan_{int(datetime.datetime.now().timestamp() * 1000)}",
            "url": normalized_url,
            "prediction": prediction,
            "confidence": confidence,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "tier": tier,
            "dns_status": dns_res.get("status", "Active"),
            "timestamp": datetime.datetime.now().isoformat() + "Z",
            "threat_count": len(reasons)
        }
        _log_scan(scan_log)
    except Exception as e:
        print(f"[-] Non-critical scan log error: {e}")

    return PredictResponse(
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
# AUTHENTICATION & SOC ANALYST ACCESS SYSTEM
# ==========================================
import hashlib
import secrets

DATA_DIR = os.path.join(BASE_DIR, "data")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
SCANS_FILE = os.path.join(DATA_DIR, "scan_history.json")

def _log_scan(scan_data: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    scans = []
    if os.path.exists(SCANS_FILE):
        try:
            with open(SCANS_FILE, "r", encoding="utf-8") as f:
                scans = json.load(f)
        except Exception:
            scans = []
    scans.insert(0, scan_data)
    scans = scans[:200]
    with open(SCANS_FILE, "w", encoding="utf-8") as f:
        json.dump(scans, f, indent=2)

def _load_scans() -> list:
    if not os.path.exists(SCANS_FILE):
        return []
    try:
        with open(SCANS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

@app.get("/scans")
@app.get("/api/scans")
def get_scans():
    return _load_scans()

def _hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def _load_users() -> dict:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(USERS_FILE):
        # Seed default demo analyst accounts for presentations & viva examiners
        salt1 = secrets.token_hex(8)
        salt2 = secrets.token_hex(8)
        initial_users = {
            "analyst@phishshield.com": {
                "id": "usr_analyst_01",
                "name": "Nensi Borad",
                "email": "analyst@phishshield.com",
                "role": "Lead SOC Analyst",
                "salt": salt1,
                "hashed_password": _hash_password("analyst123", salt1),
                "created_at": "2026-01-01T00:00:00Z"
            },
            "admin@phishshield.com": {
                "id": "usr_admin_01",
                "name": "Security Operations Center Admin",
                "email": "admin@phishshield.com",
                "role": "Threat Intelligence Lead",
                "salt": salt2,
                "hashed_password": _hash_password("admin123", salt2),
                "created_at": "2026-01-01T00:00:00Z"
            }
        }
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(initial_users, f, indent=2)
        return initial_users
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_users(users: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "SOC Security Analyst"

class LoginRequest(BaseModel):
    email: str
    password: str

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

    users = _load_users()
    if email in users:
        raise HTTPException(status_code=400, detail="Analyst profile with this email already exists.")

    salt = secrets.token_hex(8)
    user_id = f"usr_{secrets.token_hex(4)}"
    new_user = {
        "id": user_id,
        "name": name,
        "email": email,
        "role": role,
        "salt": salt,
        "hashed_password": _hash_password(password, salt),
        "created_at": "2026-03-09T00:00:00Z"
    }
    users[email] = new_user
    _save_users(users)

    token = f"token_{secrets.token_hex(16)}"
    return {
        "success": True,
        "message": "Analyst account registered successfully",
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role
        },
        "token": token
    }

@app.post("/auth/login")
@app.post("/api/auth/login")
def login_user(req: LoginRequest):
    email = (req.email or "").strip().lower()
    password = req.password or ""

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    users = _load_users()
    user = users.get(email)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid analyst credentials or account not found.")

    salt = user.get("salt", "")
    if _hash_password(password, salt) != user.get("hashed_password"):
        raise HTTPException(status_code=401, detail="Incorrect password. Access denied.")

    token = f"token_{secrets.token_hex(16)}"
    return {
        "success": True,
        "message": "Authentication successful",
        "user": {
            "id": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role", "SOC Security Analyst")
        },
        "token": token
    }

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
