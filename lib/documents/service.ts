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
  toDocumentChunkDto,
  toDocumentDetailDto,
  type ProjectDocumentDetailDto,
  type ProjectDocumentsDto
} from "@/lib/documents/types";
import { processDocumentIngestion } from "@/lib/ingestion/service";
import {
  toActionItemMemoryDto,
  toDecisionMemoryDto,
  toOpenQuestionMemoryDto,
  toRiskMemoryDto
} from "@/lib/memories/types";

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

  const documents = await prisma.$transaction(
    preparedFiles.map((file) =>
      prisma.document.create({
        data: {
          projectId,
          fileName: file.fileName,
          mimeType: file.mimeType,
          rawText: file.rawText,
          status: "PROCESSING"
        }
      })
    )
  );

  for (const document of documents) {
    await processDocumentIngestion(document.id);
  }

  return getProjectDocuments(projectId);
}

// 加载单个文档的完整来源视图：原文、chunks，以及从该文档提取出的结构化记忆。
export async function getProjectDocumentDetail(
  projectId: string,
  documentId: string
): Promise<ProjectDocumentDetailDto | null> {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      projectId
    },
    include: {
      _count: {
        select: {
          chunks: true,
          decisions: true,
          actionItems: true,
          openQuestions: true,
          risks: true
        }
      }
    }
  });

  if (!document) {
    return null;
  }

  const [chunks, decisions, actionItems, openQuestions, risks] =
    await prisma.$transaction([
      prisma.chunk.findMany({
        where: {
          documentId,
          projectId
        },
        select: {
          id: true,
          projectId: true,
          documentId: true,
          content: true,
          chunkIndex: true,
          tokenCount: true,
          createdAt: true
        },
        orderBy: {
          chunkIndex: "asc"
        }
      }),
      prisma.decision.findMany({
        where: {
          documentId,
          projectId
        },
        include: {
          document: {
            select: memoryDocumentSelect
          }
        },
        orderBy: [
          {
            date: "desc"
          },
          {
            createdAt: "desc"
          }
        ]
      }),
      prisma.actionItem.findMany({
        where: {
          documentId,
          projectId
        },
        include: {
          document: {
            select: memoryDocumentSelect
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.openQuestion.findMany({
        where: {
          documentId,
          projectId
        },
        include: {
          document: {
            select: memoryDocumentSelect
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.risk.findMany({
        where: {
          documentId,
          projectId
        },
        include: {
          document: {
            select: memoryDocumentSelect
          }
        },
        orderBy: [
          {
            severity: "desc"
          },
          {
            createdAt: "desc"
          }
        ]
      })
    ]);

  return {
    document: toDocumentDetailDto(document),
    chunks: chunks.map(toDocumentChunkDto),
    memories: {
      decisions: decisions.map(toDecisionMemoryDto),
      actionItems: actionItems.map(toActionItemMemoryDto),
      openQuestions: openQuestions.map(toOpenQuestionMemoryDto),
      risks: risks.map(toRiskMemoryDto)
    }
  };
}

// 永久删除文档，并依赖级联关系清理该文档的 chunks 与结构化记忆。
export async function deleteProjectDocument(
  projectId: string,
  documentId: string
): Promise<ProjectDocumentsDto | null> {
  const result = await prisma.document.deleteMany({
    where: {
      id: documentId,
      projectId
    }
  });

  if (result.count === 0) {
    return null;
  }

  return getProjectDocuments(projectId);
}

async function getProjectDocuments(
  projectId: string
): Promise<ProjectDocumentsDto> {
  const documents = await prisma.document.findMany({
    where: {
      projectId
    },
    include: {
      _count: {
        select: {
          chunks: true,
          decisions: true,
          actionItems: true,
          openQuestions: true,
          risks: true
        }
      }
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

const memoryDocumentSelect = {
  id: true,
  fileName: true
} as const;

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
