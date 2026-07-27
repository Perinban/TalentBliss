from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ..domain import normalize_url
from ..infrastructure.filesystem import atomic_write_json, load_json_list
from ..infrastructure.join import JoinJobScraper


@dataclass(frozen=True, slots=True)
class ScrapeReport:
    requested: int
    accepted: int
    rejected: int


def scrape_job_chunk(
    input_file: str | Path,
    output_file: str | Path,
    rejects_file: str | Path,
    concurrency: int = 10,
    timeout: float = 25,
    max_failure_rate: float = 0.8,
) -> ScrapeReport:
    urls = sorted(
        {
            normalize_url(str(value))
            for value in load_json_list(input_file)
            if isinstance(value, str) and value.strip()
        }
    )
    if not urls:
        raise ValueError(f"No job URLs found in {input_file}")

    scraper = JoinJobScraper(workers=concurrency, timeout=timeout)
    records = scraper.scrape(urls)
    accepted = [record for record in records if record.is_valid]
    rejected = [record for record in records if not record.is_valid]

    atomic_write_json(output_file, [record.to_mapping() for record in accepted])
    atomic_write_json(rejects_file, [record.to_mapping() for record in rejected])

    failure_rate = len(rejected) / len(records) if records else 1.0
    if failure_rate > max_failure_rate:
        raise RuntimeError(
            f"Rejected {len(rejected)} of {len(records)} jobs; failure rate {failure_rate:.1%} exceeds limit"
        )
    return ScrapeReport(requested=len(urls), accepted=len(accepted), rejected=len(rejected))
