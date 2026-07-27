BEGIN;

ALTER TABLE pipeline_runs
    ALTER COLUMN checksum DROP NOT NULL;

ALTER TABLE pipeline_runs
    ADD COLUMN IF NOT EXISTS expected_batch_count integer
    CHECK (expected_batch_count IS NULL OR expected_batch_count > 0);

DROP INDEX IF EXISTS pipeline_runs_external_unique;
CREATE UNIQUE INDEX pipeline_runs_external_unique
    ON pipeline_runs(source, external_run_id, COALESCE(external_run_attempt, ''))
    WHERE external_run_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS pipeline_run_batches (
    id bigserial PRIMARY KEY,
    pipeline_run_id uuid NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
    batch_index integer NOT NULL CHECK (batch_index >= 0),
    batch_count integer NOT NULL CHECK (batch_count > 0),
    checksum char(64) NOT NULL,
    status text NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    discovered_count integer NOT NULL DEFAULT 0,
    inserted_count integer NOT NULL DEFAULT 0,
    updated_count integer NOT NULL DEFAULT 0,
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (batch_index < batch_count),
    UNIQUE (pipeline_run_id, batch_index)
);

CREATE INDEX IF NOT EXISTS pipeline_run_batches_run_id_idx
    ON pipeline_run_batches(pipeline_run_id);

COMMIT;
