import { apiRequest } from "./client";

function queryString(values) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values || {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const rendered = params.toString();
  return rendered ? "?" + rendered : "";
}

export function getJobs(options) {
  return apiRequest("/api/jobs" + queryString(options));
}

export function saveJob({ alreadySaved }, saveData) {
  return apiRequest("/api/jobs/" + saveData.job_id + "/saved", {
    method: "PUT",
    body: { saved: !alreadySaved },
  });
}

export function getSingleJob({ job_id }) {
  return apiRequest("/api/jobs/" + job_id);
}

export function updateHiringStatus({ job_id }, isOpen) {
  return apiRequest("/api/jobs/" + job_id + "/status", {
    method: "PATCH",
    body: { isOpen },
  });
}

export async function addNewJob(_options, jobData) {
  const created = await apiRequest("/api/jobs", { method: "POST", body: jobData });
  return [created];
}

export function getSavedJobs() {
  return apiRequest("/api/jobs/saved");
}

export function getMyJobs(options) {
  const { recruiter_id: _recruiterId, ...query } = options || {};
  return apiRequest("/api/jobs/mine" + queryString(query));
}

export async function deleteJob({ job_id }) {
  return apiRequest("/api/jobs/" + job_id, { method: "DELETE" });
}
