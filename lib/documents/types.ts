import type { Chunk, Document, DocumentStatus } from "@prisma/client";
import type { ProjectMemoryGroupsDto } from "@/lib/memories/types";

export type DocumentStatusDto = "processing" | "ready" | "failed";

type DocumentMemoryCounts = {
  chunks: number;
  decisions: number;
  actionItems: number;
  openQuestions: number;
  risks: number;
};

export type DocumentWithIngestionCounts = Document & {
  _count?: DocumentMemoryCounts;
};

export type DocumentDto = {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  status: DocumentStatusDto;
  errorMessage: string | null;
  chunkCount: number;
  extractedMemoryCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DocumentDetailDto = DocumentDto & {
  rawText: string;
  rawTextCharacterCount: number;
};

export type DocumentChunkDto = {
  id: string;
  projectId: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  createdAt: string;
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

export type ProjectDocumentDetailDto = {
  document: DocumentDetailDto;
  chunks: DocumentChunkDto[];
  memories: ProjectMemoryGroupsDto;
};

type DocumentChunkRecord = Pick<
  Chunk,
  "id" | "projectId" | "documentId" | "content" | "chunkIndex" | "tokenCount" | "createdAt"
>;

const statusMap: Record<DocumentStatus, DocumentStatusDto> = {
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed"
};

export function toDocumentDto(document: DocumentWithIngestionCounts): DocumentDto {
  const chunkCount = document._count?.chunks ?? 0;
  const extractedMemoryCount = document._count
    ? document._count.decisions +
      document._count.actionItems +
      document._count.openQuestions +
      document._count.risks
    : 0;

  return {
    id: document.id,
    projectId: document.projectId,
    fileName: document.fileName,
    mimeType: document.mimeType,
    status: statusMap[document.status],
    errorMessage: document.errorMessage,
    chunkCount,
    extractedMemoryCount,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function toDocumentDetailDto(
  document: DocumentWithIngestionCounts
): DocumentDetailDto {
  return {
    ...toDocumentDto(document),
    rawText: document.rawText,
    rawTextCharacterCount: document.rawText.length
  };
}

export function toDocumentChunkDto(chunk: DocumentChunkRecord): DocumentChunkDto {
  return {
    id: chunk.id,
    projectId: chunk.projectId,
    documentId: chunk.documentId,
    content: chunk.content,
    chunkIndex: chunk.chunkIndex,
    tokenCount: chunk.tokenCount,
    createdAt: chunk.createdAt.toISOString()
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
