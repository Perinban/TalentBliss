# TalentBliss pipeline utilities

The Python package under `src/pipeline` provides local validation, scraping, feed-combination, and API-publishing utilities.

The active production data pipeline remains split across the existing repositories:

1. `Perinban/join_companies` refreshes the JOIN company catalog.
2. `Perinban/WebScrapJobs` scrapes jobs and archives `job_summary.json` in Google Drive.
3. `Perinban/job-data-processing` downloads that Drive feed, filters invalid records, and publishes idempotent batches to the TalentBliss API.

This package does not upload to Google Drive and no scheduled scraper workflow is enabled in the TalentBliss repository.

## Commands

```bash
python3 -m pip install -e pipeline
pipeline companies validate
pipeline jobs discover
pipeline jobs split
pipeline jobs scrape INPUT.json OUTPUT.json
pipeline feed combine
pipeline publish api --file pipeline/artifacts/job_summary.json
```

The API publisher reads:

```text
TALENTBLISS_API_URL
PIPELINE_IMPORT_TOKEN
```

Optional company-catalog refresh reads:

```text
GOOGLE_CSE_API_KEYS
GOOGLE_CSE_CONFIG
```

## Safety

A feed must be complete and validated before publication. The production `job-data-processing` publisher filters scraper failures, deduplicates source URLs, enforces a minimum job count, records every completed batch, and finalizes the run only after all expected batches arrive. Missing jobs are closed only during that explicit finalize step.

## Tests

```bash
PYTHONPATH=pipeline/src python3 -m unittest discover -s pipeline/tests -v
```
