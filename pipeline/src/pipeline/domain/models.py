from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class Company:
    slug: str
    url: str

    def to_mapping(self) -> dict[str, str]:
        return {"company_name": self.slug, "link": self.url}


@dataclass(frozen=True, slots=True)
class JobSection:
    header: str
    content: str

    def to_mapping(self) -> dict[str, str]:
        return {"header": self.header, "content": self.content}


@dataclass(frozen=True, slots=True)
class JobRecord:
    company_name: str | None
    company_logo_url: str | None
    job_url: str
    job_title: str | None
    job_location: str | None
    job_status: str | None
    job_domain: str | None
    job_salary: str | None
    job_details: tuple[JobSection, ...]
    last_updated: str | None
    reject_reason: str | None = None

    @property
    def is_valid(self) -> bool:
        return bool(
            self.job_url
            and self.company_name
            and self.job_title
            and self.job_domain
            and self.job_details
            and not self.reject_reason
        )

    def to_mapping(self) -> dict[str, Any]:
        return {
            "Company_Name": self.company_name,
            "Company_Logo_Url": self.company_logo_url,
            "Job_URL": self.job_url,
            "Job_Title": self.job_title,
            "Job_Location": self.job_location,
            "Job_Status": self.job_status,
            "Job_Domain": self.job_domain,
            "Job_Salary": self.job_salary,
            "Job_Details": [section.to_mapping() for section in self.job_details],
            "Last_Updated": self.last_updated,
            "reject_reason": self.reject_reason,
        }

    @classmethod
    def rejected(cls, job_url: str, reason: str) -> "JobRecord":
        return cls(
            company_name=None,
            company_logo_url=None,
            job_url=job_url,
            job_title=None,
            job_location=None,
            job_status=None,
            job_domain=None,
            job_salary=None,
            job_details=(),
            last_updated=None,
            reject_reason=reason,
        )

    @classmethod
    def from_mapping(cls, value: dict[str, Any]) -> "JobRecord":
        details: list[JobSection] = []
        for item in value.get("Job_Details", []):
            if not isinstance(item, dict):
                continue
            header = str(item.get("header", "")).strip()
            content = str(item.get("content", "")).strip()
            if header and content:
                details.append(JobSection(header=header, content=content))

        return cls(
            company_name=_optional_text(value.get("Company_Name")),
            company_logo_url=_optional_text(value.get("Company_Logo_Url")),
            job_url=str(value.get("Job_URL", "")).strip(),
            job_title=_optional_text(value.get("Job_Title")),
            job_location=_optional_text(value.get("Job_Location")),
            job_status=_optional_text(value.get("Job_Status")),
            job_domain=_optional_text(value.get("Job_Domain")),
            job_salary=_optional_text(value.get("Job_Salary")),
            job_details=tuple(details),
            last_updated=_optional_text(value.get("Last_Updated")),
            reject_reason=_optional_text(value.get("reject_reason")),
        )


def _optional_text(value: Any) -> str | None:
    if value is None:
        return None
    text = " ".join(str(value).split())
    return text or None
