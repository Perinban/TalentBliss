const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const csrfCookieName = import.meta.env.VITE_CSRF_COOKIE_NAME || "talentbliss_csrf";

function readCookie(name) {
  const prefix = encodeURIComponent(name) + "=";
  const cookie = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

function apiUrl(path) {
  return apiBaseUrl + path;
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  let body = options.body;

  if (body && !(body instanceof FormData) && typeof body !== "string") {
    headers.set("content-type", "application/json");
    body = JSON.stringify(body);
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = readCookie(csrfCookieName);
    if (csrfToken) headers.set("x-csrf-token", csrfToken);
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    method,
    headers,
    body,
    credentials: "include",
  });

  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = payload?.error?.message || payload || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.error?.code;
    error.details = payload?.error?.details;
    throw error;
  }
  return payload;
}

export function absoluteApiUrl(path) {
  return apiUrl(path);
}

export function assetUrl(value) {
  if (!value) return value;
  return value.startsWith("/api/") ? apiUrl(value) : value;
}
