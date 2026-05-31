import type { ApiErrorCode } from "@/lib/api/errors";

export const DOCUMENT_FILE_FIELD = "files";
export const MAX_DOCUMENT_FILES_PER_UPLOAD = 10;
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 1024 * 1024;
export const SUPPORTED_DOCUMENT_EXTENSIONS = [".md", ".txt"] as const;

export class DocumentUploadError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode = "DOCUMENT_UPLOAD_ERROR"
  ) {
    super(message);
    this.name = "DocumentUploadError";
  }
}

export function normalizeDocumentFileName(fileName: string): string {
  return fileName.trim().split(/[\\/]/).pop() ?? "";
}

export function isSupportedDocumentFileName(fileName: string): boolean {
  const lowerFileName = fileName.toLowerCase();

  return SUPPORTED_DOCUMENT_EXTENSIONS.some((extension) =>
    lowerFileName.endsWith(extension)
  );
}
