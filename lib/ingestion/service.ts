import { randomUUID } from "node:crypto";
import { Prisma, type Document } from "@prisma/client";
import { createEmbeddings } from "@/lib/ai/openai";
import { prisma } from "@/lib/db/prisma";
import { splitTextIntoChunks, type TextChunk } from "@/lib/ingestion/chunking";
import {
  extractStructuredMemories,
  type StructuredMemoryExtraction
} from "@/lib/ingestion/memory-extraction";
import { toPgVector } from "@/lib/db/pgvector";

type IngestionResult = {
  status: "ready" | "failed";
};

type ChunkWithEmbedding = TextChunk & {
  embedding: number[];
};

const actionItemStatusMap = {
  open: "OPEN",
  in_progress: "IN_PROGRESS",
  done: "DONE"
} as const;

const riskSeverityMap = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH"
} as const;

export async function processDocumentIngestion(
  documentId: string
): Promise<IngestionResult | null> {
  const document = await prisma.document.findUnique({
    where: {
      id: documentId
    }
  });

  if (!document) {
    return null;
  }

  await prisma.document.update({
    where: {
      id: documentId
    },
    data: {
      status: "PROCESSING",
      errorMessage: null
    }
  });

  try {
    const chunks = splitTextIntoChunks(document.rawText);

    if (chunks.length === 0) {
      throw new Error("Document text did not produce any chunks.");
    }

    const embeddings = await createEmbeddings(chunks.map((chunk) => chunk.content));
    const chunksWithEmbeddings = chunks.map<ChunkWithEmbedding>((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index]
    }));
    const memories = await extractStructuredMemories(document.fileName, chunks);

    await saveIngestionArtifacts(document, chunksWithEmbeddings, memories);

    return {
      status: "ready"
    };
  } catch (error) {
    const failureMessage = getFailureMessage(error);

    console.error("Document ingestion failed", getDebugMessage(error));
    await markDocumentFailed(documentId, failureMessage);

    return {
      status: "failed"
    };
  }
}

async function saveIngestionArtifacts(
  document: Document,
  chunks: ChunkWithEmbedding[],
  memories: StructuredMemoryExtraction
) {
  await prisma.$transaction(async (tx) => {
    await clearDocumentIngestionArtifacts(tx, document.id);

    for (const chunk of chunks) {
      await insertChunk(tx, document, chunk);
    }

    if (memories.decisions.length > 0) {
      await tx.decision.createMany({
        data: memories.decisions.map((decision) => ({
          id: randomUUID(),
          projectId: document.projectId,
          documentId: document.id,
          title: decision.title.trim(),
          summary: decision.summary.trim(),
          rationale: emptyToNull(decision.rationale),
          date: parseNullableDate(decision.date),
          participants: decision.participants.map((participant) => participant.trim()).filter(Boolean),
          sourceQuote: decision.sourceQuote.trim()
        }))
      });
    }

    if (memories.actionItems.length > 0) {
      await tx.actionItem.createMany({
        data: memories.actionItems.map((actionItem) => ({
          id: randomUUID(),
          projectId: document.projectId,
          documentId: document.id,
          title: actionItem.title.trim(),
          description: actionItem.description.trim(),
          owner: emptyToNull(actionItem.owner),
          dueDate: parseNullableDate(actionItem.dueDate),
          status: actionItemStatusMap[actionItem.status],
          sourceQuote: actionItem.sourceQuote.trim()
        }))
      });
    }

    if (memories.openQuestions.length > 0) {
      await tx.openQuestion.createMany({
        data: memories.openQuestions.map((openQuestion) => ({
          id: randomUUID(),
          projectId: document.projectId,
          documentId: document.id,
          question: openQuestion.question.trim(),
          context: openQuestion.context.trim(),
          owner: emptyToNull(openQuestion.owner),
          sourceQuote: openQuestion.sourceQuote.trim()
        }))
      });
    }

    if (memories.risks.length > 0) {
      await tx.risk.createMany({
        data: memories.risks.map((risk) => ({
          id: randomUUID(),
          projectId: document.projectId,
          documentId: document.id,
          title: risk.title.trim(),
          description: risk.description.trim(),
          severity: riskSeverityMap[risk.severity],
          mitigation: emptyToNull(risk.mitigation),
          sourceQuote: risk.sourceQuote.trim()
        }))
      });
    }

    await tx.document.update({
      where: {
        id: document.id
      },
      data: {
        status: "READY",
        errorMessage: null
      }
    });
  });
}

async function clearDocumentIngestionArtifacts(
  tx: Prisma.TransactionClient,
  documentId: string
) {
  await tx.$executeRaw`DELETE FROM "chunks" WHERE "documentId" = ${documentId}`;
  await tx.decision.deleteMany({ where: { documentId } });
  await tx.actionItem.deleteMany({ where: { documentId } });
  await tx.openQuestion.deleteMany({ where: { documentId } });
  await tx.risk.deleteMany({ where: { documentId } });
}

async function insertChunk(
  tx: Prisma.TransactionClient,
  document: Document,
  chunk: ChunkWithEmbedding
) {
  const vector = toPgVector(chunk.embedding);

  await tx.$executeRaw`
    INSERT INTO "chunks" (
      "id",
      "projectId",
      "documentId",
      "content",
      "chunkIndex",
      "tokenCount",
      "embedding",
      "createdAt"
    )
    VALUES (
      ${randomUUID()},
      ${document.projectId},
      ${document.id},
      ${chunk.content},
      ${chunk.chunkIndex},
      ${chunk.tokenCount},
      ${vector}::vector,
      CURRENT_TIMESTAMP
    )
  `;
}

async function markDocumentFailed(documentId: string, errorMessage: string) {
  await prisma.document.update({
    where: {
      id: documentId
    },
    data: {
      status: "FAILED",
      errorMessage
    }
  });
}

function emptyToNull(value: string): string | null {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function parseNullableDate(value: string): Date | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const date = new Date(trimmedValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message === "OPENAI_API_KEY is not configured.") {
    return "AI processing is not configured.";
  }

  return "AI processing failed. Check OpenAI configuration and try again.";
}

function getDebugMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown ingestion error.";
}
