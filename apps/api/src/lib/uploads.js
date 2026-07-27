import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { HttpError } from "./errors.js";

const logoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const resumeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function safeExtension(originalName) {
  const extension = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, "");
  return extension.slice(0, 10);
}

export function createUpload(config, kind) {
  const directory = path.resolve(config.uploadDir, kind);
  fs.mkdirSync(directory, { recursive: true, mode: 0o750 });
  const allowed = kind === "company-logos" ? logoTypes : resumeTypes;
  const maxSize = kind === "company-logos" ? 1_000_000 : 5_000_000;

  return multer({
    storage: multer.diskStorage({
      destination: directory,
      filename: (_request, file, callback) => {
        callback(null, crypto.randomUUID() + safeExtension(file.originalname));
      },
    }),
    limits: { fileSize: maxSize, files: 1 },
    fileFilter: (_request, file, callback) => {
      if (!allowed.has(file.mimetype)) {
        callback(new HttpError(400, "Unsupported file type", "invalid_file_type"));
        return;
      }
      callback(null, true);
    },
  });
}
