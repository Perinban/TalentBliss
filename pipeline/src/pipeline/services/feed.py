from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from ..domain import JobRecord, normalize_url
from ..infrastructure.filesystem import atomic_write_json, load_json_list, load_lines


@dataclass(frozen=True, slots=True)
class SplitReport:
    urls: int
    files: tuple[Path, ...]


@dataclass(frozen=True, slots=True)
class CombineReport:
    source_files: int
    accepted: int
    rejected: int


def split_job_urls(
    input_file: str | Path,
    output_dir: str | Path,
    chunk_size: int = 2000,
    github_output: str | Path | None = None,
) -> SplitReport:
    if chunk_size < 1:
        raise ValueError("chunk_size must be greater than zero")
    urls = sorted({normalize_url(url) for url in load_lines(input_file)})
    if not urls:
        raise ValueError(f"No job URLs found in {input_file}")

    target = Path(output_dir)
    target.mkdir(parents=True, exist_ok=True)
    for stale in target.glob("job_urls_*.json"):
        stale.unlink()

    files: list[Path] = []
    for index, start in enumerate(range(0, len(urls), chunk_size), start=1):
        output = target / f"job_urls_{index:04d}.json"
        atomic_write_json(output, urls[start : start + chunk_size])
        files.append(output)

    if github_output:
        matrix = json.dumps([path.name for path in files], separators=(",", ":"))
        with Path(github_output).open("a", encoding="utf-8") as handle:
            handle.write(f"files={matrix}\n")
    return SplitReport(urls=len(urls), files=tuple(files))


def combine_job_summaries(input_dir: str | Path, output_file: str | Path) -> CombineReport:
    source_files = sorted(
        path
        for path in Path(input_dir).rglob("job_summary_*.json")
        if "reject" not in path.stem.lower()
    )
    if not source_files:
        raise ValueError(f"No job summary files found in {input_dir}")

    jobs: dict[str, JobRecord] = {}
    rejected = 0
    for source_file in source_files:
        for value in load_json_list(source_file):
            if not isinstance(value, dict):
                rejected += 1
                continue
            record = JobRecord.from_mapping(value)
            if record.is_valid:
                jobs[normalize_url(record.job_url)] = record
            else:
                rejected += 1

    if not jobs:
        raise RuntimeError("No valid jobs remained after validation")
    ordered = [jobs[url].to_mapping() for url in sorted(jobs)]
    atomic_write_json(output_file, ordered)
    return CombineReport(source_files=len(source_files), accepted=len(ordered), rejected=rejected)
