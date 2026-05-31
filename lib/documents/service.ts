import { prisma } from "@/lib/db/prisma";
import {
  DocumentUploadError,
  isSupportedDocumentFileName,
  MAX_DOCUMENT_FILES_PER_UPLOAD,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  normalizeDocumentFileName
} from "@/lib/documents/schemas";
import {
  buildDocumentSummary,
  toDocumentDto,
  type ProjectDocumentsDto
} from "@/lib/documents/types";

type PreparedDocumentFile = {
  fileName: string;
  mimeType: string;
  rawText: string;
};

export async function listProjectDocuments(
  projectId: string
): Promise<ProjectDocumentsDto | null> {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: {
      id: true
    }
  });

  if (!project) {
    return null;
  }

  return getProjectDocuments(projectId);
}

export async function uploadProjectDocuments(
  projectId: string,
  files: File[]
): Promise<ProjectDocumentsDto | null> {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: {
      id: true
    }
  });

  if (!project) {
    return null;
  }

  const preparedFiles = await prepareDocumentFiles(files);

  await prisma.$transaction(
    preparedFiles.map((file) =>
      prisma.document.create({
        data: {
          projectId,
          fileName: file.fileName,
          mimeType: file.mimeType,
          rawText: file.rawText,
          status: "READY"
        }
      })
    )
  );

  return getProjectDocuments(projectId);
}

async function getProjectDocuments(
  projectId: string
): Promise<ProjectDocumentsDto> {
  const documents = await prisma.document.findMany({
    where: {
      projectId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  const documentDtos = documents.map(toDocumentDto);

  return {
    documents: documentDtos,
    summary: buildDocumentSummary(documentDtos)
  };
}

async function prepareDocumentFiles(
  files: File[]
): Promise<PreparedDocumentFile[]> {
  if (files.length === 0) {
    throw new DocumentUploadError("Upload at least one document.");
  }

  if (files.length > MAX_DOCUMENT_FILES_PER_UPLOAD) {
    throw new DocumentUploadError(
      `Upload ${MAX_DOCUMENT_FILES_PER_UPLOAD} or fewer documents at a time.`
    );
  }

  return Promise.all(files.map(prepareDocumentFile));
}

async function prepareDocumentFile(file: File): Promise<PreparedDocumentFile> {
  const fileName = normalizeDocumentFileName(file.name);

  if (!fileName || !isSupportedDocumentFileName(fileName)) {
    throw new DocumentUploadError(
      "Only .md and .txt documents are supported.",
      "UNSUPPORTED_DOCUMENT_TYPE"
    );
  }

  if (file.size === 0) {
    throw new DocumentUploadError("Documents must not be empty.");
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new DocumentUploadError("Each document must be 1 MB or smaller.");
  }

  const rawText = await file.text();

  if (rawText.length === 0) {
    throw new DocumentUploadError("Documents must not be empty.");
  }

  return {
    fileName,
    mimeType: file.type || "application/octet-stream",
    rawText
  };
}
