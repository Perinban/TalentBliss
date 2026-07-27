from __future__ import annotations

import itertools
import json
import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Any

from ..domain import Company, company_slug_from_url, company_url
from .http import build_session


@dataclass(frozen=True, slots=True)
class SearchTarget:
    cse_id: str
    query: str


class GoogleCustomSearchClient:
    endpoint = "https://www.googleapis.com/customsearch/v1"

    def __init__(self, api_keys: list[str], targets: list[SearchTarget], timeout: float = 20) -> None:
        if not api_keys:
            raise ValueError("No Google Custom Search API keys configured")
        if not targets:
            raise ValueError("No Google Custom Search targets configured")
        self._keys = itertools.cycle(api_keys)
        self._lock = threading.Lock()
        self.targets = targets
        self.timeout = timeout

    @classmethod
    def from_environment(cls, timeout: float = 20) -> "GoogleCustomSearchClient":
        keys = _json_env("GOOGLE_CSE_API_KEYS", "API_KEYS")
        raw_targets = _json_env("GOOGLE_CSE_CONFIG", "CSE_CONFIG")
        targets = [
            SearchTarget(cse_id=str(item["cse_id"]), query=str(item["query"]))
            for item in raw_targets
            if isinstance(item, dict) and item.get("cse_id") and item.get("query")
        ]
        return cls(api_keys=[str(key) for key in keys if str(key).strip()], targets=targets, timeout=timeout)

    def discover_companies(self, max_results: int = 100, workers: int = 8) -> list[Company]:
        starts = range(1, max_results + 1, 10)
        companies: dict[str, Company] = {}
        with ThreadPoolExecutor(max_workers=max(1, workers)) as executor:
            futures = [
                executor.submit(self._fetch, target, start)
                for target in self.targets
                for start in starts
            ]
            for future in as_completed(futures):
                for item in future.result():
                    link = str(item.get("link", ""))
                    slug = company_slug_from_url(link)
                    if slug:
                        companies[slug] = Company(slug=slug, url=company_url(slug))
        return sorted(companies.values(), key=lambda company: company.slug)

    def _fetch(self, target: SearchTarget, start: int) -> list[dict[str, Any]]:
        with self._lock:
            key = next(self._keys)
        session = build_session(pool_size=2)
        try:
            response = session.get(
                self.endpoint,
                params={"q": target.query, "cx": target.cse_id, "key": key, "start": start},
                timeout=self.timeout,
            )
            response.raise_for_status()
            payload = response.json()
            items = payload.get("items", [])
            return items if isinstance(items, list) else []
        finally:
            session.close()


def _json_env(primary: str, legacy: str) -> list[Any]:
    raw = os.getenv(primary) or os.getenv(legacy)
    if not raw:
        raise ValueError(f"{primary} is not configured")
    value = json.loads(raw)
    if not isinstance(value, list):
        raise ValueError(f"{primary} must contain a JSON list")
    return value
