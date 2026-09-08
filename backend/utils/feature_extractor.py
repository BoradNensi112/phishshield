import re
import math
import ipaddress
from urllib.parse import urlparse

FEATURE_NAMES = [
    "url_length",
    "domain_length",
    "path_length",
    "query_length",
    "num_dots",
    "num_hyphens",
    "num_underscores",
    "num_slashes",
    "num_question_marks",
    "num_equals",
    "num_at_symbol",
    "num_percent",
    "num_digits",
    "num_special_chars",
    "has_https",
    "is_ip_address",
    "count_subdomains",
    "has_double_slash_redirect",
    "has_port_number",
    "shannon_entropy",
    "is_url_shortened",
    "brand_spoofing_keyword",
    "tld_length",
    "suspicious_tld_flag",
    "digit_to_letter_ratio",
    "consecutive_hyphens_count",
    "homograph_punycode_flag",
    "count_vowels_in_domain",
    "count_consonants_in_domain",
    "has_sensitive_words_in_path",
    "max_char_repeat",
    "vowel_ratio_domain",
    "is_domain_length_abnormal"
]

SHORTENERS = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "is.gd", "cli.gs", "ow.ly",
    "yfrog.com", "migre.me", "ff.im", "tiny.cc", "url4.eu", "twit.ac",
    "su.pr", "twurl.nl", "snipurl.com", "short.to", "budurl.com", "ping.fm",
    "post.ly", "just.as", "bkite.com", "snipr.com", "fic.kr", "loopt.us",
    "doiop.com", "short.ie", "kl.am", "wp.me", "rubyurl.com", "om.ly",
    "to.ly", "bit.do", "t2mio.com", "lnkd.in", "db.tt", "qr.ae", "adf.ly",
    "ity.im", "q.gs", "po.st", "bc.vc", "twitthis.com", "u.to", "j.mp",
    "buzurl.com", "cutt.us", "u.bb", "yourls.org", "prettylinkpro.com",
    "scrnch.me", "filoops.info", "vzturl.com", "qr.net", "1url.com",
    "tweez.me", "v.gd", "tr.im", "link.zip.net"
}

SUSPICIOUS_TLDS = {
    "xyz", "top", "work", "buzz", "club", "tk", "ml", "ga", "cf", "gq",
    "fit", "country", "kim", "cricket", "science", "party", "gdn", "date",
    "racing", "review", "download", "stream", "trade", "accountant", "faith"
}

SENSITIVE_KEYWORDS = [
    "login", "signin", "verify", "verification", "secure", "security",
    "account", "update", "banking", "password", "credential", "confirm",
    "wallet", "billing", "authenticate", "auth", "support", "recovery",
    "ebayisapi", "webscr", "pay", "service"
]

TOP_BRANDS = [
    "paypal", "netflix", "apple", "google", "microsoft", "amazon",
    "sbi", "hdfc", "icici", "facebook", "instagram", "whatsapp",
    "chase", "wellsfargo", "bankofamerica", "binance", "coinbase"
]

def calculate_shannon_entropy(text: str) -> float:
    if not text:
        return 0.0
    entropy = 0.0
    length = len(text)
    freq = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 4)

def check_ip_address(hostname: str) -> int:
    if not hostname:
        return 0
    clean_host = hostname.split(":")[0]
    try:
        ipaddress.ip_address(clean_host)
        return 1
    except ValueError:
        pass
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", clean_host):
        return 1
    return 0

def extract_features(raw_url: str) -> dict:
    url = raw_url.strip()
    if not url.startswith(("http://", "https://")):
        url_for_parsing = "http://" + url
    else:
        url_for_parsing = url

    try:
        parsed = urlparse(url_for_parsing)
        hostname = (parsed.hostname or "").lower()
        path = parsed.path or ""
        query = parsed.query or ""
    except Exception:
        hostname = ""
        path = ""
        query = ""

    url_lower = url.lower()
    clean_host = hostname.split(":")[0] if hostname else ""

    url_length = len(url)
    domain_length = len(hostname)
    path_length = len(path)
    query_length = len(query)

    num_dots = url.count(".")
    num_hyphens = url.count("-")
    num_underscores = url.count("_")
    num_slashes = url.count("/")
    num_question_marks = url.count("?")
    num_equals = url.count("=")
    num_at_symbol = url.count("@")
    num_percent = url.count("%")
    num_digits = sum(c.isdigit() for c in url)
    num_special_chars = len(re.findall(r"[\!\$\&\'\*\+\,\;\:\~\^]", url))

    has_https = 1 if url_lower.startswith("https://") else 0
    is_ip = check_ip_address(clean_host)

    if clean_host:
        parts = clean_host.split(".")
        if is_ip:
            count_subdomains = 0
        elif len(parts) > 2:
            count_subdomains = len(parts) - 2
        else:
            count_subdomains = 0
    else:
        count_subdomains = 0

    has_double_slash_redirect = 1 if ("//" in url[7:]) else 0
    has_port_number = 1 if (parsed.port is not None) else 0
    shannon_entropy = calculate_shannon_entropy(url)
    is_shortened = 1 if (clean_host in SHORTENERS) else 0

    brand_spoofing = 0
    for brand in TOP_BRANDS:
        if brand in url_lower:
            if clean_host and not clean_host.endswith(f".{brand}.com") and clean_host != f"{brand}.com" and not clean_host.endswith(f".{brand}.co.in") and clean_host != f"{brand}.co.in":
                brand_spoofing = 1
                break

    tld = clean_host.split(".")[-1] if ("." in clean_host) else ""
    tld_length = len(tld)
    suspicious_tld_flag = 1 if (tld in SUSPICIOUS_TLDS) else 0

    letter_count = sum(c.isalpha() for c in url)
    digit_to_letter_ratio = round(num_digits / (letter_count + 1), 4)
    consecutive_hyphens = len(re.findall(r"-{2,}", url))
    homograph_punycode = 1 if ("xn--" in clean_host) else 0

    vowels = set("aeiou")
    domain_letters = [c for c in clean_host if c.isalpha()]
    count_vowels_in_domain = sum(1 for c in domain_letters if c in vowels)
    count_consonants_in_domain = len(domain_letters) - count_vowels_in_domain

    path_and_query = (path + "?" + query).lower()
    has_sensitive_words = sum(1 for w in SENSITIVE_KEYWORDS if w in path_and_query)

    # NEW CRUCIAL FEATURES
    # 31. Max consecutive character repetition (e.g. "helooooo..." -> 130)
    char_repeats = re.findall(r"((.)\2+)", url)
    max_char_repeat = max([len(m[0]) for m in char_repeats]) if char_repeats else 1

    # 32. Vowel ratio in domain
    vowel_ratio_domain = round(count_vowels_in_domain / (len(clean_host) + 1), 4)

    # 33. Is domain length abnormal (> 40 chars)
    is_domain_length_abnormal = 1 if domain_length > 40 else 0

    features = {
        "url_length": url_length,
        "domain_length": domain_length,
        "path_length": path_length,
        "query_length": query_length,
        "num_dots": num_dots,
        "num_hyphens": num_hyphens,
        "num_underscores": num_underscores,
        "num_slashes": num_slashes,
        "num_question_marks": num_question_marks,
        "num_equals": num_equals,
        "num_at_symbol": num_at_symbol,
        "num_percent": num_percent,
        "num_digits": num_digits,
        "num_special_chars": num_special_chars,
        "has_https": has_https,
        "is_ip_address": is_ip,
        "count_subdomains": count_subdomains,
        "has_double_slash_redirect": has_double_slash_redirect,
        "has_port_number": has_port_number,
        "shannon_entropy": shannon_entropy,
        "is_url_shortened": is_shortened,
        "brand_spoofing_keyword": brand_spoofing,
        "tld_length": tld_length,
        "suspicious_tld_flag": suspicious_tld_flag,
        "digit_to_letter_ratio": digit_to_letter_ratio,
        "consecutive_hyphens_count": consecutive_hyphens,
        "homograph_punycode_flag": homograph_punycode,
        "count_vowels_in_domain": count_vowels_in_domain,
        "count_consonants_in_domain": count_consonants_in_domain,
        "has_sensitive_words_in_path": has_sensitive_words,
        "max_char_repeat": max_char_repeat,
        "vowel_ratio_domain": vowel_ratio_domain,
        "is_domain_length_abnormal": is_domain_length_abnormal
    }
    return features

def extract_threat_reasons(features: dict, raw_url: str) -> list:
    reasons = []
    if features.get("is_ip_address", 0) == 1:
        reasons.append("Raw IP address used instead of legitimate domain name")
    if features.get("count_subdomains", 0) >= 2:
        reasons.append(f"Excessive subdomains ({features.get('count_subdomains')} detected) indicating subdomain spoofing")
    if features.get("max_char_repeat", 1) >= 4:
        reasons.append(f"Unusual character repetition detected ({features.get('max_char_repeat')} consecutive letters in sequence)")
    if features.get("is_domain_length_abnormal", 0) == 1:
        reasons.append(f"Extremely long domain name ({features.get('domain_length')} characters, strong evasion indicator)")
    if features.get("shannon_entropy", 0) >= 4.4:
        reasons.append(f"High Shannon Entropy ({features.get('shannon_entropy')}) indicating randomly obfuscated characters")
    if features.get("brand_spoofing_keyword", 0) == 1:
        reasons.append("Brand name impersonation detected in URL path or subdomain")
    if features.get("has_sensitive_words_in_path", 0) >= 1:
        reasons.append(f"Credential harvesting keywords detected in path ({features.get('has_sensitive_words_in_path')} keywords)")
    if features.get("is_url_shortened", 0) == 1:
        reasons.append("URL shortening service used to obscure destination target")
    if features.get("suspicious_tld_flag", 0) == 1:
        reasons.append("High-risk top-level domain (TLD) commonly used in phishing campaigns")
    if features.get("has_https", 0) == 0:
        reasons.append("Insecure HTTP protocol connection (No SSL/TLS encryption)")
    if features.get("num_at_symbol", 0) > 0:
        reasons.append("Presence of '@' symbol used for credential spoofing / redirect attack")
    if features.get("consecutive_hyphens_count", 0) > 0:
        reasons.append("Consecutive hyphens detected, typical in typosquatting")
    if features.get("url_length", 0) > 85:
        reasons.append(f"Abnormally long URL ({features.get('url_length')} characters)")
    if features.get("has_double_slash_redirect", 0) == 1:
        reasons.append("Double slash redirect found in URL path")
    return reasons
