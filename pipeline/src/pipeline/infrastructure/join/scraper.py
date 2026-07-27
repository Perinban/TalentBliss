from __future__ import annotations

import threading
from collections.abc import Sequence
from concurrent.futures import ThreadPoolExecutor

import requests

from ...domain import JobRecord, normalize_url
from ..http import build_session
from .parser import parse_job_page


class JoinJobScraper:
    def __init__(self, workers: int = 10, timeout: float = 25) -> None:
        self.workers = max(1, workers)
        self.timeout = timeout
        self._local = threading.local()

    def scrape(self, urls: Sequence[str]) -> list[JobRecord]:
        normalized = [normalize_url(url) for url in urls]
        with ThreadPoolExecutor(max_workers=self.workers) as executor:
            return list(executor.map(self._fetch, normalized))

    def _fetch(self, url: str) -> JobRecord:
        try:
            response = self._session().get(url, timeout=self.timeout)
            response.raise_for_status()
            return parse_job_page(url, response.text)
        except (requests.RequestException, ValueError) as exc:
            return JobRecord.rejected(job_url=url, reason=str(exc))

    def _session(self) -> requests.Session:
        session = getattr(self._local, "session", None)
        if session is None:
            session = build_session(pool_size=2)
            self._local.session = session
        return session
