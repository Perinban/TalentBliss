from __future__ import annotations

import argparse
import logging
from pathlib import Path

from .infrastructure import GoogleCustomSearchClient
from .infrastructure.publishers import publish_to_api
from .services import (
    combine_job_summaries,
    discover_job_urls,
    load_company_catalog,
    refresh_company_catalog,
    scrape_job_chunk,
    split_job_urls,
)
from .settings import PipelinePaths


logger = logging.getLogger("pipeline")


def build_parser(paths: PipelinePaths | None = None) -> argparse.ArgumentParser:
    paths = paths or PipelinePaths.from_environment()
    parser = argparse.ArgumentParser(prog="pipeline")
    groups = parser.add_subparsers(dest="group", required=True)

    companies = groups.add_parser("companies")
    company_commands = companies.add_subparsers(dest="command", required=True)

    validate = company_commands.add_parser("validate")
    validate.add_argument("--catalog", type=Path, default=paths.company_catalog)
    validate.set_defaults(handler=_validate_companies)

    refresh = company_commands.add_parser("refresh")
    refresh.add_argument("--catalog", type=Path, default=paths.company_catalog)
    refresh.add_argument("--max-results", type=int, default=100)
    refresh.add_argument("--workers", type=int, default=8)
    refresh.add_argument("--timeout", type=float, default=20)
    refresh.set_defaults(handler=_refresh_companies)

    jobs = groups.add_parser("jobs")
    job_commands = jobs.add_subparsers(dest="command", required=True)

    discover = job_commands.add_parser("discover")
    discover.add_argument("--catalog", type=Path, default=paths.company_catalog)
    discover.add_argument("--output", type=Path, default=paths.job_urls)
    discover.add_argument("--existing", type=Path)
    discover.add_argument("--workers", type=int, default=6)
    discover.add_argument("--timeout", type=float, default=20)
    discover.add_argument("--max-pages", type=int, default=100)
    discover.set_defaults(handler=_discover_jobs)

    split = job_commands.add_parser("split")
    split.add_argument("--input", type=Path, default=paths.job_urls)
    split.add_argument("--output-dir", type=Path, default=paths.job_url_chunks)
    split.add_argument("--chunk-size", type=int, default=2000)
    split.add_argument("--github-output", type=Path)
    split.set_defaults(handler=_split_jobs)

    scrape = job_commands.add_parser("scrape")
    scrape.add_argument("input_file", type=Path)
    scrape.add_argument("output_file", type=Path)
    scrape.add_argument("--rejects-file", type=Path)
    scrape.add_argument("--concurrency", type=int, default=10)
    scrape.add_argument("--timeout", type=float, default=25)
    scrape.add_argument("--max-failure-rate", type=float, default=0.8)
    scrape.set_defaults(handler=_scrape_jobs)

    feed = groups.add_parser("feed")
    feed_commands = feed.add_subparsers(dest="command", required=True)
    combine = feed_commands.add_parser("combine")
    combine.add_argument("--input-dir", type=Path, default=paths.job_summaries)
    combine.add_argument("--output", type=Path, default=paths.job_feed)
    combine.set_defaults(handler=_combine_feed)

    publish = groups.add_parser("publish")
    publish_commands = publish.add_subparsers(dest="command", required=True)
    api = publish_commands.add_parser("api")
    api.add_argument("--file", type=Path, default=paths.job_feed)
    api.add_argument("--api-url")
    api.add_argument("--source", default="join")
    api.add_argument("--run-id")
    api.add_argument("--run-attempt")
    api.add_argument("--timeout", type=float, default=180)
    api.set_defaults(handler=_publish_api)
    return parser


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    args = build_parser().parse_args(argv)
    try:
        return int(args.handler(args))
    except Exception as exc:
        logger.error("%s", exc)
        return 1


def _validate_companies(args: argparse.Namespace) -> int:
    companies = load_company_catalog(args.catalog)
    logger.info("Validated %d companies", len(companies))
    return 0


def _refresh_companies(args: argparse.Namespace) -> int:
    client = GoogleCustomSearchClient.from_environment(timeout=args.timeout)
    discovered, total = refresh_company_catalog(
        args.catalog,
        client,
        max_results=args.max_results,
        workers=args.workers,
    )
    logger.info("Discovered %d companies; catalog contains %d", discovered, total)
    return 0


def _discover_jobs(args: argparse.Namespace) -> int:
    report = discover_job_urls(
        company_catalog=args.catalog,
        output_file=args.output,
        existing_file=args.existing,
        workers=args.workers,
        timeout=args.timeout,
        max_pages=args.max_pages,
    )
    logger.info(
        "Discovered %d job URLs from %d companies; %d companies failed",
        report.job_urls,
        report.companies,
        report.failed_companies,
    )
    return 0


def _split_jobs(args: argparse.Namespace) -> int:
    report = split_job_urls(
        input_file=args.input,
        output_dir=args.output_dir,
        chunk_size=args.chunk_size,
        github_output=args.github_output,
    )
    logger.info("Split %d URLs into %d files", report.urls, len(report.files))
    return 0


def _scrape_jobs(args: argparse.Namespace) -> int:
    rejects = args.rejects_file or args.output_file.with_name(f"{args.output_file.stem}_rejects.json")
    report = scrape_job_chunk(
        input_file=args.input_file,
        output_file=args.output_file,
        rejects_file=rejects,
        concurrency=args.concurrency,
        timeout=args.timeout,
        max_failure_rate=args.max_failure_rate,
    )
    logger.info("Scraped %d jobs: %d accepted, %d rejected", report.requested, report.accepted, report.rejected)
    return 0


def _combine_feed(args: argparse.Namespace) -> int:
    report = combine_job_summaries(args.input_dir, args.output)
    logger.info(
        "Combined %d files into %d jobs; %d records rejected",
        report.source_files,
        report.accepted,
        report.rejected,
    )
    return 0


def _publish_api(args: argparse.Namespace) -> int:
    result = publish_to_api(
        args.file,
        api_url=args.api_url,
        source=args.source,
        run_id=args.run_id,
        run_attempt=args.run_attempt,
        timeout=args.timeout,
    )
    run = result.get("run", {})
    logger.info(
        "Published feed: %s discovered, %s inserted, %s updated%s",
        run.get("discovered_count", "?"),
        run.get("inserted_count", "?"),
        run.get("updated_count", "?"),
        " (idempotent)" if result.get("idempotent") else "",
    )
    return 0
