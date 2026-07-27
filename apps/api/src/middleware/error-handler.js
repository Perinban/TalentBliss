import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";

export function notFoundHandler(request, _response, next) {
  next(new HttpError(404, "Route not found: " + request.method + " " + request.path, "route_not_found"));
}

export function errorHandler(error, _request, response, _next) {
  void _next;
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "validation_error",
        message: "Request validation failed",
        details: error.flatten(),
      },
    });
    return;
  }
  if (error instanceof multer.MulterError) {
    response.status(400).json({ error: { code: "upload_error", message: error.message } });
    return;
  }
  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }
  if (error?.code === "23505") {
    response.status(409).json({ error: { code: "conflict", message: "The record already exists" } });
    return;
  }
  console.error(error);
  response.status(500).json({ error: { code: "internal_error", message: "Internal server error" } });
}
