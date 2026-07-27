BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    first_name text NOT NULL DEFAULT '',
    last_name text NOT NULL DEFAULT '',
    role text CHECK (role IN ('candidate', 'recruiter', 'admin')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    email_verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email));

CREATE TABLE IF NOT EXISTS password_credentials (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash text NOT NULL,
    password_changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash char(64) NOT NULL UNIQUE,
    csrf_token_hash char(64) NOT NULL,
    ip_address inet,
    user_agent text,
    expires_at timestamptz NOT NULL,
    last_used_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions(expires_at);

CREATE TABLE IF NOT EXISTS companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    logo_url text,
    website_url text,
    source text NOT NULL DEFAULT 'portal',
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS companies_name_idx ON companies(name);

CREATE TABLE IF NOT EXISTS jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source text NOT NULL DEFAULT 'portal',
    source_url text,
    recruiter_id uuid REFERENCES users(id) ON DELETE SET NULL,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    title text NOT NULL,
    description text NOT NULL,
    requirements text,
    country text,
    state text,
    location text,
    mode text,
    domain text,
    salary text,
    employment_type text,
    is_open boolean NOT NULL DEFAULT true,
    is_active boolean NOT NULL DEFAULT true,
    posted_at timestamptz,
    first_seen_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT jobs_source_url_required CHECK (source = 'portal' OR source_url IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS jobs_source_url_unique ON jobs(source_url) WHERE source_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_company_id_idx ON jobs(company_id);
CREATE INDEX IF NOT EXISTS jobs_recruiter_id_idx ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_active_search_idx ON jobs(is_active, is_open, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_title_lower_idx ON jobs(lower(title));

CREATE TABLE IF NOT EXISTS saved_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, job_id)
);
CREATE INDEX IF NOT EXISTS saved_jobs_user_id_idx ON saved_jobs(user_id);

CREATE TABLE IF NOT EXISTS applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
    candidate_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    first_name text NOT NULL,
    last_name text NOT NULL,
    mobile_number text NOT NULL,
    country text NOT NULL,
    address text NOT NULL,
    higher_education text NOT NULL,
    passed_out_year integer NOT NULL,
    languages_known text NOT NULL,
    skills text NOT NULL,
    experience_years numeric(5,2) NOT NULL DEFAULT 0,
    gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    career_level text NOT NULL CHECK (career_level IN ('fresher', 'experienced')),
    expected_salary numeric(14,2) NOT NULL DEFAULT 0,
    resume_path text NOT NULL,
    resume_name text NOT NULL,
    resume_mime_type text NOT NULL,
    status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'interviewing', 'hired', 'rejected')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (candidate_id, job_id)
);
CREATE INDEX IF NOT EXISTS applications_job_id_idx ON applications(job_id);
CREATE INDEX IF NOT EXISTS applications_candidate_id_idx ON applications(candidate_id);

CREATE TABLE IF NOT EXISTS pipeline_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source text NOT NULL,
    external_run_id text,
    external_run_attempt text,
    checksum char(64) NOT NULL,
    status text NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    complete_feed boolean NOT NULL DEFAULT false,
    discovered_count integer NOT NULL DEFAULT 0,
    inserted_count integer NOT NULL DEFAULT 0,
    updated_count integer NOT NULL DEFAULT 0,
    rejected_count integer NOT NULL DEFAULT 0,
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pipeline_runs_external_unique
    ON pipeline_runs(source, external_run_id, external_run_attempt)
    WHERE external_run_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pipeline_runs_checksum_unique ON pipeline_runs(source, checksum);

CREATE TABLE IF NOT EXISTS pipeline_errors (
    id bigserial PRIMARY KEY,
    pipeline_run_id uuid NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
    source_url text,
    reason text NOT NULL,
    payload jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pipeline_errors_run_id_idx ON pipeline_errors(pipeline_run_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS companies_set_updated_at ON companies;
CREATE TRIGGER companies_set_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS jobs_set_updated_at ON jobs;
CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS applications_set_updated_at ON applications;
CREATE TRIGGER applications_set_updated_at BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
