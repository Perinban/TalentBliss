from __future__ import annotations

import gzip
import json
import os
from pathlib import Path
from typing import Any

import requests


def publish_to_api(
    file_path: str | Path,
    *,
    api_url: str | None = None,
    token: str | None = None,
    source: str = "join",
    run_id: str | None = None,
    run_attempt: str | None = None,
    timeout: float = 180,
) -> dict[str, Any]:
    base_url = (api_url or os.getenv("TALENTBLISS_API_URL") or "").rstrip("/")
    import_token = token or os.getenv("PIPELINE_IMPORT_TOKEN")
    if not base_url:
        raise ValueError("TALENTBLISS_API_URL is required for API publishing")
    if not import_token:
        raise ValueError("PIPELINE_IMPORT_TOKEN is required for API publishing")

    source_file = Path(file_path)
    jobs = json.loads(source_file.read_text(encoding="utf-8"))
    if not isinstance(jobs, list) or not jobs:
        raise ValueError("The pipeline feed must be a non-empty JSON array")

    payload = {
        "source": source,
        "runId": run_id,
        "runAttempt": run_attempt,
        "complete": True,
        "jobs": jobs,
    }
    body = gzip.compress(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
        compresslevel=6,
    )
    response = requests.post(
        f"{base_url}/api/internal/imports/jobs",
        data=body,
        headers={
            "Authorization": f"Bearer {import_token}",
            "Content-Type": "application/json",
            "Content-Encoding": "gzip",
            "Accept": "application/json",
        },
        timeout=timeout,
    )
    response.raise_for_status()
    result = response.json()
    if not isinstance(result, dict):
        raise ValueError("The TalentBliss API returned an invalid response")
    return result
