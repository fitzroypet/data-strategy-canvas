const DEFAULT_MAX_MB = 10;
const DEFAULT_TTL_HOURS = 24;

export const IMPORT_BUCKET = "workspace-imports";

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const ALLOWED_EXTENSIONS = new Set(["pdf", "docx"]);

export function getImportMaxFileBytes() {
  const parsed = Number(process.env.IMPORT_MAX_FILE_MB ?? DEFAULT_MAX_MB);
  const maxMb = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_MB;
  return Math.floor(maxMb * 1024 * 1024);
}

export function getImportTtlHours() {
  const parsed = Number(process.env.IMPORT_FILE_TTL_HOURS ?? DEFAULT_TTL_HOURS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_HOURS;
}

export function getImportExpirationIso(now = new Date()) {
  const expiry = new Date(now.getTime());
  expiry.setHours(expiry.getHours() + getImportTtlHours());
  return expiry.toISOString();
}

export function fileExtension(filename: string) {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function isSupportedImportFile(file: File) {
  const ext = fileExtension(file.name);
  return ALLOWED_EXTENSIONS.has(ext) || ALLOWED_MIME_TYPES.has(file.type);
}

