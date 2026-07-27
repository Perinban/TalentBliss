from __future__ import annotations

from pathlib import Path

from ..domain import Company, company_slug_from_url, company_url
from ..infrastructure.filesystem import atomic_write_json, load_json_list
from ..infrastructure.google_search import GoogleCustomSearchClient


def load_company_catalog(path: str | Path) -> list[Company]:
    companies: dict[str, Company] = {}
    for value in load_json_list(path):
        if not isinstance(value, dict):
            continue
        slug = str(value.get("company_name", "")).strip().strip("/")
        link = str(value.get("link", "")).strip()
        if not slug and link:
            slug = company_slug_from_url(link) or ""
        if slug:
            companies[slug] = Company(slug=slug, url=company_url(slug))
    if not companies:
        raise ValueError(f"No valid companies found in {path}")
    return sorted(companies.values(), key=lambda company: company.slug)


def refresh_company_catalog(
    path: str | Path,
    client: GoogleCustomSearchClient,
    max_results: int = 100,
    workers: int = 8,
) -> tuple[int, int]:
    existing = {company.slug: company for company in load_company_catalog(path)}
    discovered = client.discover_companies(max_results=max_results, workers=workers)
    for company in discovered:
        existing[company.slug] = company
    merged = sorted(existing.values(), key=lambda company: company.slug)
    atomic_write_json(path, [company.to_mapping() for company in merged])
    return len(discovered), len(merged)
