"""
Whitelist / Allowlist of trusted high-reputation domains for Tier-1 Heuristics.
"""
from urllib.parse import urlparse

TRUSTED_DOMAINS = {
    "google.com", "www.google.com", "mail.google.com", "drive.google.com", "accounts.google.com",
    "youtube.com", "www.youtube.com",
    "facebook.com", "www.facebook.com",
    "amazon.com", "www.amazon.com", "amazon.in", "www.amazon.in",
    "wikipedia.org", "en.wikipedia.org",
    "twitter.com", "x.com", "www.twitter.com",
    "instagram.com", "www.instagram.com",
    "linkedin.com", "www.linkedin.com",
    "microsoft.com", "www.microsoft.com", "office.com", "outlook.com", "live.com",
    "apple.com", "www.apple.com", "icloud.com",
    "github.com", "www.github.com",
    "stackoverflow.com", "www.stackoverflow.com",
    "reddit.com", "www.reddit.com",
    "netflix.com", "www.netflix.com",
    "sbi.co.in", "www.sbi.co.in", "onlinesbi.sbi", "onlinesbi.com",
    "hdfcbank.com", "www.hdfcbank.com",
    "icicibank.com", "www.icicibank.com",
    "irctc.co.in", "www.irctc.co.in",
    "gov.in", "india.gov.in", "uidai.gov.in",
    "cloudflare.com", "openai.com", "chatgpt.com",
    "yahoo.com", "www.yahoo.com",
    "zoom.us", "dropbox.com", "spotify.com"
}

def is_whitelisted(url: str) -> bool:
    try:
        if not url.startswith(("http://", "https://")):
            url = "http://" + url
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower().strip()
        if not hostname:
            return False
        
        # Exact match
        if hostname in TRUSTED_DOMAINS:
            return True
        
        # Root domain match (e.g., mail.google.com -> google.com)
        parts = hostname.split(".")
        if len(parts) >= 2:
            root_domain = ".".join(parts[-2:])
            if root_domain in TRUSTED_DOMAINS:
                return True
        if len(parts) >= 3:
            root_domain_3 = ".".join(parts[-3:])
            if root_domain_3 in TRUSTED_DOMAINS:
                return True
        return False
    except Exception:
        return False
