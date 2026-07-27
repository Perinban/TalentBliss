from __future__ import annotations

import gzip
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from pipeline.infrastructure.join import parse_job_page
from pipeline.infrastructure.publishers import publish_to_api
from pipeline.services import combine_job_summaries, load_company_catalog, split_job_urls


class PipelineTests(unittest.TestCase):
    def test_company_catalog_is_normalized_and_deduplicated(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = Path(directory) / "companies.json"
            catalog.write_text(
                json.dumps(
                    [
                        {"company_name": "acme", "link": "https://join.com/companies/acme"},
                        {"link": "https://join.com/companies/acme/"},
                    ]
                ),
                encoding="utf-8",
            )
            companies = load_company_catalog(catalog)
            self.assertEqual([company.slug for company in companies], ["acme"])
            self.assertEqual(companies[0].url, "https://join.com/companies/acme")

    def test_json_ld_job_parser_returns_valid_record(self) -> None:
        html = """
        <html><head><script type="application/ld+json">
        {
          "@type": "JobPosting",
          "title": "Engineer",
          "hiringOrganization": {"name": "Acme", "logo": "https://cdn.example/logo.png"},
          "jobLocation": {"address": {"addressLocality": "Berlin", "addressCountry": "DE"}},
          "employmentType": "FULL_TIME",
          "occupationalCategory": "Engineering",
          "description": "<h2>Role</h2><p>Build reliable systems.</p>",
          "datePosted": "2026-07-25"
        }
        </script></head></html>
        """
        record = parse_job_page("https://join.com/companies/acme/1-engineer", html)
        self.assertTrue(record.is_valid)
        self.assertEqual(record.company_name, "Acme")
        self.assertEqual(record.job_location, "Berlin, DE")
        self.assertEqual(record.job_details[0].header, "Role")

    def test_split_and_combine_are_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            urls = root / "urls.txt"
            urls.write_text(
                "https://join.com/companies/acme/2-role\n"
                "https://join.com/companies/acme/1-role\n"
                "https://join.com/companies/acme/1-role\n",
                encoding="utf-8",
            )
            chunks = root / "chunks"
            report = split_job_urls(urls, chunks, chunk_size=1)
            self.assertEqual(report.urls, 2)
            self.assertEqual(len(report.files), 2)

            summaries = root / "summaries"
            summaries.mkdir()
            valid = {
                "Company_Name": "Acme",
                "Company_Logo_Url": None,
                "Job_URL": "https://join.com/companies/acme/1-role",
                "Job_Title": "Engineer",
                "Job_Location": "Berlin, DE",
                "Job_Status": "FULL_TIME",
                "Job_Domain": "Engineering",
                "Job_Salary": None,
                "Job_Details": [{"header": "Role", "content": "Build systems"}],
                "Last_Updated": "2026-07-25",
                "reject_reason": None,
            }
            (summaries / "job_summary_0001.json").write_text(json.dumps([valid]), encoding="utf-8")
            output = root / "job_summary.json"
            combined = combine_job_summaries(summaries, output)
            self.assertEqual(combined.accepted, 1)
            self.assertEqual(len(json.loads(output.read_text(encoding="utf-8"))), 1)

    def test_api_publisher_compresses_and_authenticates_feed(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            feed = Path(directory) / "feed.json"
            feed.write_text(json.dumps([{"Job_URL": "https://join.com/example"}]), encoding="utf-8")
            response = Mock()
            response.json.return_value = {"idempotent": False, "run": {"inserted_count": 1}}
            response.raise_for_status.return_value = None

            with patch("pipeline.infrastructure.publishers.api.requests.post", return_value=response) as post:
                result = publish_to_api(
                    feed,
                    api_url="https://api.example.com",
                    token="test-token",
                    run_id="42",
                    run_attempt="1",
                )

            self.assertEqual(result["run"]["inserted_count"], 1)
            request = post.call_args
            self.assertEqual(request.args[0], "https://api.example.com/api/internal/imports/jobs")
            self.assertEqual(request.kwargs["headers"]["Authorization"], "Bearer test-token")
            self.assertEqual(request.kwargs["headers"]["Content-Encoding"], "gzip")
            self.assertIsInstance(request.kwargs["data"], bytes)
            payload = json.loads(gzip.decompress(request.kwargs["data"]).decode("utf-8"))
            self.assertTrue(payload["complete"])
            self.assertEqual(payload["jobs"], [{"Job_URL": "https://join.com/example"}])


if __name__ == "__main__":
    unittest.main()
