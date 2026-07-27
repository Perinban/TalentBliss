from __future__ import annotations

import json
from typing import Any, Iterable
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from ...domain import JobRecord, JobSection, normalize_url


def parse_job_page(url: str, html: str) -> JobRecord:
    soup = BeautifulSoup(html, "html.parser")
    posting = _extract_json_ld(soup) or {}
    company_name, logo_url = _extract_company(posting)
    title = _text(posting.get("title"))
    if not title:
        heading = soup.find("h1")
        title = heading.get_text(" ", strip=True) if heading else None

    description = posting.get("description") if isinstance(posting.get("description"), str) else None
    sections = _extract_sections(description, soup.select_one("#about-job"))
    domain = _text(posting.get("occupationalCategory")) or _text(posting.get("industry"))

    return JobRecord(
        company_name=company_name,
        company_logo_url=logo_url,
        job_url=normalize_url(url),
        job_title=title,
        job_location=_extract_location(posting),
        job_status=_text(posting.get("employmentType")),
        job_domain=domain,
        job_salary=_extract_salary(posting),
        job_details=tuple(sections),
        last_updated=_text(posting.get("datePosted")) or _text(posting.get("validThrough")),
    )


def _iter_job_postings(value: Any) -> Iterable[dict[str, Any]]:
    if isinstance(value, list):
        for item in value:
            yield from _iter_job_postings(item)
        return
    if not isinstance(value, dict):
        return

    item_type = value.get("@type")
    types = item_type if isinstance(item_type, list) else [item_type]
    if "JobPosting" in types:
        yield value
    for key in ("@graph", "mainEntity", "itemListElement"):
        if key in value:
            yield from _iter_job_postings(value[key])


def _extract_json_ld(soup: BeautifulSoup) -> dict[str, Any] | None:
    for script in soup.select('script[type="application/ld+json"]'):
        text = script.string or script.get_text()
        if not text.strip():
            continue
        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            continue
        posting = next(_iter_job_postings(payload), None)
        if posting:
            return posting
    return None


def _text(value: Any) -> str | None:
    if isinstance(value, str):
        cleaned = " ".join(value.split())
        return cleaned or None
    if isinstance(value, list):
        values = [_text(item) for item in value]
        rendered = ", ".join(item for item in values if item)
        return rendered or None
    return None


def _extract_company(posting: dict[str, Any]) -> tuple[str | None, str | None]:
    organization = posting.get("hiringOrganization")
    if not isinstance(organization, dict):
        return None, None
    logo = organization.get("logo")
    if isinstance(logo, dict):
        logo = logo.get("url") or logo.get("contentUrl")
    logo_url = urljoin("https://join.com", logo) if isinstance(logo, str) else None
    return _text(organization.get("name")), logo_url


def _extract_location(posting: dict[str, Any]) -> str | None:
    if str(posting.get("jobLocationType", "")).upper() == "TELECOMMUTE":
        requirements = posting.get("applicantLocationRequirements")
        region = None
        if isinstance(requirements, dict):
            region = _text(requirements.get("name"))
        elif isinstance(requirements, list):
            region = _text([item.get("name") for item in requirements if isinstance(item, dict)])
        return f"Remote ({region})" if region else "Remote"

    locations = posting.get("jobLocation")
    if isinstance(locations, dict):
        locations = [locations]
    rendered: list[str] = []
    if isinstance(locations, list):
        for location in locations:
            if not isinstance(location, dict):
                continue
            address = location.get("address", location)
            if not isinstance(address, dict):
                continue
            parts = [
                _text(address.get("addressLocality")),
                _text(address.get("addressRegion")),
                _text(address.get("addressCountry")),
            ]
            value = ", ".join(part for part in parts if part)
            if value:
                rendered.append(value)
    return "; ".join(dict.fromkeys(rendered)) or None


def _extract_salary(posting: dict[str, Any]) -> str | None:
    salary = posting.get("baseSalary")
    if not isinstance(salary, dict):
        return _text(salary)
    currency = _text(salary.get("currency")) or ""
    value = salary.get("value")
    if not isinstance(value, dict):
        return _text(value)

    minimum = value.get("minValue")
    maximum = value.get("maxValue")
    exact = value.get("value")
    unit = _text(value.get("unitText"))
    if minimum is not None and maximum is not None:
        amount = f"{minimum} to {maximum} {currency}".strip()
    elif exact is not None:
        amount = f"{exact} {currency}".strip()
    else:
        amount = f"{minimum or maximum or ''} {currency}".strip()
    return f"{amount} / {unit.lower()}" if amount and unit else amount or None


def _extract_sections(description_html: str | None, fallback: Tag | None) -> list[JobSection]:
    root = BeautifulSoup(description_html or "", "html.parser") if description_html else fallback
    if root is None:
        return []

    headings = root.find_all(["h2", "h3", "h4"])
    if not headings:
        content = root.get_text("\n", strip=True)
        return [JobSection(header="Description", content=content)] if content else []

    sections: list[JobSection] = []
    for heading in headings:
        nodes: list[Any] = []
        sibling = heading.next_sibling
        while sibling is not None:
            if isinstance(sibling, Tag) and sibling.name in {"h2", "h3", "h4"}:
                break
            nodes.append(sibling)
            sibling = sibling.next_sibling
        content = _render_nodes(nodes)
        header = heading.get_text(" ", strip=True)
        if header and content:
            sections.append(JobSection(header=header, content=content))
    return sections


def _render_nodes(nodes: Iterable[Any]) -> str:
    chunks: list[str] = []
    for node in nodes:
        text = node.get_text("\n", strip=True) if isinstance(node, Tag) else str(node).strip()
        if text:
            chunks.append(text)
    return "\n".join(chunks).strip()
