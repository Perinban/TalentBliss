from __future__ import annotations

from urllib.parse import urljoin, urlparse, urlunparse


JOIN_BASE_URL = "https://join.com"


def normalize_url(value: str, base_url: str = JOIN_BASE_URL) -> str:
    absolute = urljoin(base_url, value.strip())
    parsed = urlparse(absolute)
    normalized = parsed._replace(fragment="", query="")
    return urlunparse(normalized).rstrip("/")


def company_slug_from_url(value: str) -> str | None:
    parsed = urlparse(normalize_url(value))
    parts = [part for part in parsed.path.split("/") if part]
    if parsed.netloc in {"join.com", "www.join.com"} and len(parts) >= 2 and parts[0] == "companies":
        return parts[1]
    return None


def company_url(slug: str) -> str:
    return f"{JOIN_BASE_URL}/companies/{slug.strip().strip('/')}"


def is_job_url(value: str, company_slug: str | None = None) -> bool:
    parsed = urlparse(normalize_url(value))
    parts = [part for part in parsed.path.split("/") if part]
    if parsed.netloc not in {"join.com", "www.join.com"} or len(parts) < 3 or parts[0] != "companies":
        return False
    return company_slug is None or parts[1] == company_slug
