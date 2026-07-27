import { apiRequest } from "./client";

export function getCompanies() {
  return apiRequest("/api/companies");
}

export function addNewCompany(_options, companyData) {
  const form = new FormData();
  form.append("name", companyData.name);
  form.append("logo", companyData.logo);
  return apiRequest("/api/companies", { method: "POST", body: form });
}
