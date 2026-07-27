export class HttpError extends Error {
  constructor(status, message, code = "request_error", details = undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFound(message = "Resource not found") {
  return new HttpError(404, message, "not_found");
}
