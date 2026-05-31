import type { Document, DocumentStatus } from "@prisma/client";

export type DocumentStatusDto = "processing" | "ready" | "failed";

export type DocumentDto = {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  status: DocumentStatusDto;
  errorMessage: string | null;
  extractedMemoryCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DocumentSummaryDto = {
  total: number;
  processing: number;
  ready: number;
  failed: number;
};

export type ProjectDocumentsDto = {
  documents: DocumentDto[];
  summary: DocumentSummaryDto;
};

const statusMap: Record<DocumentStatus, DocumentStatusDto> = {
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed"
};

export function toDocumentDto(document: Document): DocumentDto {
  return {
    id: document.id,
    projectId: document.projectId,
    fileName: document.fileName,
    mimeType: document.mimeType,
    status: statusMap[document.status],
    errorMessage: document.errorMessage,
    extractedMemoryCount: 0,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function buildDocumentSummary(
  documents: DocumentDto[]
): DocumentSummaryDto {
  return documents.reduce<DocumentSummaryDto>(
    (summary, document) => ({
      ...summary,
      total: summary.total + 1,
      [document.status]: summary[document.status] + 1
    }),
    {
      total: 0,
      processing: 0,
      ready: 0,
      failed: 0
    }
  );
}
