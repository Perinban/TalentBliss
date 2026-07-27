import { apiRequest } from "./client";

export function applyToJob(_options, applicationData) {
  const form = new FormData();
  for (const [key, value] of Object.entries(applicationData)) {
    if (["job_id", "candidate_id", "status", "resume"].includes(key)) continue;
    form.append(key, String(value));
  }
  form.append("resume", applicationData.resume);
  return apiRequest("/api/applications/jobs/" + applicationData.job_id, {
    method: "POST",
    body: form,
  });
}

export function updateApplicationStatus({ application_id }, status) {
  return apiRequest("/api/applications/" + application_id + "/status", {
    method: "PATCH",
    body: { status },
  });
}

export function getApplications() {
  return apiRequest("/api/applications/mine");
}
