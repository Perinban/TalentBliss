from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from ...domain import company_url, is_job_url, normalize_url
from ..http import build_session


@dataclass(frozen=True, slots=True)
class CompanyJobs:
    company_slug: str
    urls: tuple[str, ...]
    error: str | None = None


class JoinCatalogClient:
    def __init__(self, timeout: float = 20, max_pages: int = 100) -> None:
        self.timeout = timeout
        self.max_pages = max_pages

    def discover(self, company_slug: str) -> CompanyJobs:
        session = build_session(pool_size=4)
        discovered: set[str] = set()
        try:
            for page in range(1, self.max_pages + 1):
                url = company_url(company_slug)
                if page > 1:
                    url = f"{url}?page={page}"
                response = session.get(url, timeout=self.timeout)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, "html.parser")
                discovered.update(self._extract_links(soup, company_slug))
                if soup.select_one('a[rel="next"], a[aria-label="Next page"], a[aria-label="next page"]') is None:
                    break
            return CompanyJobs(company_slug=company_slug, urls=tuple(sorted(discovered)))
        except requests.RequestException as exc:
            return CompanyJobs(company_slug=company_slug, urls=(), error=str(exc))
        finally:
            session.close()

    @staticmethod
    def _extract_links(soup: BeautifulSoup, company_slug: str) -> set[str]:
        links: set[str] = set()
        for anchor in soup.find_all("a", href=True):
            href = normalize_url(str(anchor["href"]))
            parsed = urlparse(href)
            if parsed.netloc in {"join.com", "www.join.com"} and is_job_url(href, company_slug):
                links.add(href)
        return links
