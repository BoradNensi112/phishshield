"""
SQLite Database Layer for PhishShield SOC Platform
Supports WAL mode, thread-safe connections, automatic migration from JSON files,
and full CRUD for users and scans.
"""

import os
import json
import sqlite3
import datetime
from contextlib import contextmanager

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "phishshield.db")

USERS_JSON = os.path.join(DATA_DIR, "users.json")
SCANS_JSON = os.path.join(DATA_DIR, "scan_history.json")

@contextmanager
def get_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    try:
        # Enable WAL mode for high concurrency
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Initialize SQLite schema and run auto-migration if needed."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                salt TEXT NOT NULL,
                hashed_password TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")

        # 2. Scans Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                prediction TEXT NOT NULL,
                confidence REAL NOT NULL,
                risk_score REAL NOT NULL,
                risk_level TEXT NOT NULL,
                tier TEXT NOT NULL,
                dns_status TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                threat_count INTEGER DEFAULT 0,
                user_id TEXT,
                user_email TEXT NOT NULL,
                threat_reasons TEXT,
                features TEXT
            );
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_user_email ON scans(user_email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp);")

        # Check if migration is needed
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]

        if user_count == 0:
            _migrate_from_json(conn)

def _migrate_from_json(conn):
    """Migrate legacy users.json and scan_history.json into SQLite seamlessly."""
    cursor = conn.cursor()
    print("[*] Initiating SQLite migration from legacy JSON stores...")

    # 1. Migrate Users
    if os.path.exists(USERS_JSON):
        try:
            with open(USERS_JSON, "r", encoding="utf-8") as f:
                users_data = json.load(f)
            
            for email, u in users_data.items():
                cursor.execute("""
                    INSERT OR IGNORE INTO users (id, name, email, role, status, salt, hashed_password, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    u.get("id") or f"usr_{os.urandom(4).hex()}",
                    u.get("name") or "SOC Analyst",
                    email.strip().lower(),
                    u.get("role") or "SOC Security Analyst",
                    u.get("status") or "active",
                    u.get("salt") or os.urandom(8).hex(),
                    u.get("hashed_password") or "",
                    u.get("created_at") or datetime.datetime.now().isoformat() + "Z"
                ))
            print(f"[+] Successfully migrated {len(users_data)} users into SQLite.")
        except Exception as e:
            print(f"[-] Users migration warning: {e}")

    # 2. Migrate Scans
    if os.path.exists(SCANS_JSON):
        try:
            with open(SCANS_JSON, "r", encoding="utf-8") as f:
                scans_data = json.load(f)

            migrated_scans = 0
            for s in scans_data:
                sid = s.get("id") or f"scan_{int(datetime.datetime.now().timestamp() * 1000)}_{os.urandom(2).hex()}"
                url = s.get("url", "").strip()
                if not url:
                    continue

                threat_reasons_json = json.dumps(s.get("threat_reasons", []))
                features_json = json.dumps(s.get("features", {}))

                cursor.execute("""
                    INSERT OR IGNORE INTO scans (
                        id, url, prediction, confidence, risk_score, risk_level, tier,
                        dns_status, timestamp, threat_count, user_id, user_email, threat_reasons, features
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    sid,
                    url,
                    s.get("prediction", "Legitimate"),
                    float(s.get("confidence", 0)),
                    float(s.get("risk_score", 0)),
                    s.get("risk_level", "Safe"),
                    s.get("tier", "Tier-2 Random Forest ML Classifier"),
                    s.get("dns_status") or s.get("dns") or "Active",
                    s.get("timestamp") or datetime.datetime.now().isoformat() + "Z",
                    int(s.get("threat_count", 0)),
                    s.get("user_id") or "",
                    (s.get("user_email") or "anonymous").strip().lower(),
                    threat_reasons_json,
                    features_json
                ))
                migrated_scans += 1
            print(f"[+] Successfully migrated {migrated_scans} scans into SQLite.")
        except Exception as e:
            print(f"[-] Scans migration warning: {e}")

# ==========================================
# USER OPERATIONS
# ==========================================

def get_user_by_email(email: str):
    if not email:
        return None
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_user_by_id(user_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_all_users_with_telemetry():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                u.id, u.name, u.email, u.role, u.status, u.created_at,
                COUNT(s.id) as total_scans,
                SUM(CASE WHEN s.prediction = 'Phishing' THEN 1 ELSE 0 END) as total_threats
            FROM users u
            LEFT JOIN scans s ON LOWER(u.email) = LOWER(s.user_email)
            GROUP BY u.id
            ORDER BY u.created_at DESC
        """)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["total_scans"] = d["total_scans"] or 0
            d["total_threats"] = d["total_threats"] or 0
            result.append(d)
        return result

def create_user(name: str, email: str, role: str, salt: str, hashed_password: str, status: str = "active"):
    clean_email = email.strip().lower()
    user_id = f"usr_{os.urandom(4).hex()}"
    created_at = datetime.datetime.now().isoformat() + "Z"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (id, name, email, role, status, salt, hashed_password, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, name.strip(), clean_email, role.strip(), status, salt, hashed_password, created_at))
    return {
        "id": user_id,
        "name": name.strip(),
        "email": clean_email,
        "role": role.strip(),
        "status": status,
        "created_at": created_at
    }

def update_user_role(email: str, new_role: str):
    clean_email = email.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role = ? WHERE LOWER(email) = LOWER(?)", (new_role.strip(), clean_email))
        return cursor.rowcount > 0

def update_user_status(email: str, new_status: str):
    clean_email = email.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET status = ? WHERE LOWER(email) = LOWER(?)", (new_status.strip().lower(), clean_email))
        return cursor.rowcount > 0

def update_user_password(email: str, salt: str, hashed_password: str):
    clean_email = email.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users 
            SET salt = ?, hashed_password = ? 
            WHERE LOWER(email) = LOWER(?)
        """, (salt, hashed_password, clean_email))
        return cursor.rowcount > 0

def update_user_profile(email: str, new_name: str):
    clean_email = email.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET name = ? WHERE LOWER(email) = LOWER(?)", (new_name.strip(), clean_email))
        return cursor.rowcount > 0

# ==========================================
# SCAN OPERATIONS
# ==========================================

def insert_scan(scan_dict: dict):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO scans (
                id, url, prediction, confidence, risk_score, risk_level, tier,
                dns_status, timestamp, threat_count, user_id, user_email, threat_reasons, features
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            scan_dict.get("id"),
            scan_dict.get("url"),
            scan_dict.get("prediction"),
            float(scan_dict.get("confidence", 0)),
            float(scan_dict.get("risk_score", 0)),
            scan_dict.get("risk_level"),
            scan_dict.get("tier"),
            scan_dict.get("dns_status") or "Active",
            scan_dict.get("timestamp"),
            int(scan_dict.get("threat_count", 0)),
            scan_dict.get("user_id") or "",
            (scan_dict.get("user_email") or "anonymous").strip().lower(),
            json.dumps(scan_dict.get("threat_reasons", [])),
            json.dumps(scan_dict.get("features", {}))
        ))
    return scan_dict

def get_scans(user_email: str | None = None, limit: int = 500, offset: int = 0):
    with get_db() as conn:
        cursor = conn.cursor()
        if user_email:
            clean = user_email.strip().lower()
            cursor.execute("""
                SELECT * FROM scans 
                WHERE LOWER(user_email) = LOWER(?) 
                ORDER BY datetime(timestamp) DESC 
                LIMIT ? OFFSET ?
            """, (clean, limit, offset))
        else:
            cursor.execute("""
                SELECT * FROM scans 
                ORDER BY datetime(timestamp) DESC 
                LIMIT ? OFFSET ?
            """, (limit, offset))
        
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            try:
                d["threat_reasons"] = json.loads(d.get("threat_reasons") or "[]")
            except Exception:
                d["threat_reasons"] = []
            try:
                d["features"] = json.loads(d.get("features") or "{}")
            except Exception:
                d["features"] = {}
            result.append(d)
        return result

def get_scan_by_id(scan_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM scans WHERE id = ?", (scan_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        try:
            d["threat_reasons"] = json.loads(d.get("threat_reasons") or "[]")
        except Exception:
            d["threat_reasons"] = []
        try:
            d["features"] = json.loads(d.get("features") or "{}")
        except Exception:
            d["features"] = {}
        return d

def delete_scan(scan_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
        return cursor.rowcount > 0

def clear_user_scans(user_email: str):
    clean = user_email.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM scans WHERE LOWER(user_email) = LOWER(?)", (clean,))
        return cursor.rowcount

def bulk_delete_scans(scan_ids: list, user_email: str | None = None):
    if not scan_ids:
        return 0
    with get_db() as conn:
        cursor = conn.cursor()
        placeholders = ",".join(["?"] * len(scan_ids))
        if user_email:
            clean = user_email.strip().lower()
            query = f"DELETE FROM scans WHERE id IN ({placeholders}) AND LOWER(user_email) = LOWER(?)"
            cursor.execute(query, (*scan_ids, clean))
        else:
            query = f"DELETE FROM scans WHERE id IN ({placeholders})"
            cursor.execute(query, scan_ids)
        return cursor.rowcount

def get_user_scan_stats(user_email: str):
    clean = user_email.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COUNT(*) as total_scans,
                SUM(CASE WHEN prediction = 'Phishing' THEN 1 ELSE 0 END) as phishing_count,
                SUM(CASE WHEN prediction = 'Legitimate' THEN 1 ELSE 0 END) as safe_count,
                SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high_risk_count
            FROM scans 
            WHERE LOWER(user_email) = LOWER(?)
        """, (clean,))
        row = cursor.fetchone()
        if not row:
            return {"total_scans": 0, "phishing_count": 0, "safe_count": 0, "high_risk_count": 0}
        return {
            "total_scans": row["total_scans"] or 0,
            "phishing_count": row["phishing_count"] or 0,
            "safe_count": row["safe_count"] or 0,
            "high_risk_count": row["high_risk_count"] or 0
        }
