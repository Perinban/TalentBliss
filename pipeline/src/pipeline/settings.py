from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class PipelinePaths:
    repository_root: Path

    @classmethod
    def from_environment(cls) -> "PipelinePaths":
        root = Path(os.getenv("TALENTBLISS_ROOT", Path.cwd())).expanduser().resolve()
        return cls(repository_root=root)

    @property
    def pipeline_root(self) -> Path:
        return self.repository_root / "pipeline"

    @property
    def company_catalog(self) -> Path:
        return self.pipeline_root / "data" / "companies.json"

    @property
    def artifacts(self) -> Path:
        return self.pipeline_root / "artifacts"

    @property
    def job_urls(self) -> Path:
        return self.artifacts / "job_urls.txt"

    @property
    def job_url_chunks(self) -> Path:
        return self.artifacts / "job-url-chunks"

    @property
    def job_summaries(self) -> Path:
        return self.artifacts / "job-summaries"

    @property
    def job_feed(self) -> Path:
        return self.artifacts / "job_summary.json"
