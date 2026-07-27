from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

from ..domain import company_slug_from_url, normalize_url
from ..infrastructure.filesystem import atomic_write_lines, load_lines
from ..infrastructure.join import JoinCatalogClient
from .company_catalog import load_company_catalog


@dataclass(frozen=True, slots=True)
class DiscoveryReport:
    companies: int
    failed_companies: int
    job_urls: int


def discover_job_urls(
    company_catalog: str | Path,
    output_file: str | Path,
    existing_file: str | Path | None = None,
    workers: int = 6,
    timeout: float = 20,
    max_pages: int = 100,
) -> DiscoveryReport:
    companies = load_company_catalog(company_catalog)
    existing_by_company: dict[str, set[str]] = {}
    for url in load_lines(existing_file or output_file):
        slug = company_slug_from_url(url)
        if slug:
            existing_by_company.setdefault(slug, set()).add(normalize_url(url))

    client = JoinCatalogClient(timeout=timeout, max_pages=max_pages)
    urls: set[str] = set()
    failures = 0
    with ThreadPoolExecutor(max_workers=max(1, workers)) as executor:
        futures = {executor.submit(client.discover, company.slug): company.slug for company in companies}
        for future in as_completed(futures):
            result = future.result()
            if result.error:
                failures += 1
                urls.update(existing_by_company.get(result.company_slug, set()))
            else:
                urls.update(result.urls)

    if failures == len(companies):
        raise RuntimeError("Every company request failed; the previous snapshot was preserved")
    if not urls and existing_by_company:
        raise RuntimeError("No job URLs were discovered; refusing to replace a non-empty snapshot")

    atomic_write_lines(output_file, sorted(urls))
    return DiscoveryReport(companies=len(companies), failed_companies=failures, job_urls=len(urls))
