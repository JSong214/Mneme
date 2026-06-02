import { Prisma } from "@prisma/client";
import { createEmbeddings } from "@/lib/ai/openai";
import { prisma } from "@/lib/db/prisma";
import { toPgVector } from "@/lib/db/pgvector";
import {
  toActionItemMemoryDto,
  toDecisionMemoryDto,
  toOpenQuestionMemoryDto,
  toRiskMemoryDto,
  type ProjectMemoryGroupsDto
} from "@/lib/memories/types";

export type RetrievedChunk = {
  id: string;
  documentId: string;
  fileName: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  distance: number;
  createdAt: string;
};

export type RetrievedProjectContext = {
  chunks: RetrievedChunk[];
  memories: ProjectMemoryGroupsDto;
};

type RetrievedChunkRow = {
  id: string;
  documentId: string;
  fileName: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  distance: number;
  createdAt: Date;
};

const TOP_CHUNK_LIMIT = 6;
const MEMORY_RESULT_LIMIT = 5;
const MAX_MEMORY_SEARCH_TERMS = 8;
const memoryDocumentSelect = {
  id: true,
  fileName: true
} as const;

const ignoredSearchTerms = new Set([
  "the",
  "and",
  "for",
  "with",
  "what",
  "why",
  "who",
  "how",
  "which",
  "did",
  "does",
  "was",
  "were",
  "are",
  "is"
]);

// 组装 Ask 所需的混合检索上下文：向量片段 + 结构化项目记忆。
export async function retrieveProjectContext(
  projectId: string,
  question: string
): Promise<RetrievedProjectContext> {
  const [queryEmbedding] = await createEmbeddings([question]);
  const [chunks, memories] = await Promise.all([
    retrieveRelevantChunks(projectId, queryEmbedding),
    lookupStructuredMemories(projectId, question)
  ]);

  return {
    chunks,
    memories
  };
}

async function retrieveRelevantChunks(
  projectId: string,
  queryEmbedding: number[]
): Promise<RetrievedChunk[]> {
  const queryVector = toPgVector(queryEmbedding);
  const rows = await prisma.$queryRaw<RetrievedChunkRow[]>`
    SELECT
      c."id",
      c."documentId",
      d."fileName",
      c."content",
      c."chunkIndex",
      c."tokenCount",
      (c."embedding" <=> ${queryVector}::vector)::double precision AS "distance",
      c."createdAt"
    FROM "chunks" c
    INNER JOIN "documents" d ON d."id" = c."documentId"
    WHERE c."projectId" = ${projectId}
    ORDER BY c."embedding" <=> ${queryVector}::vector
    LIMIT ${TOP_CHUNK_LIMIT}
  `;

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString()
  }));
}

async function lookupStructuredMemories(
  projectId: string,
  question: string
): Promise<ProjectMemoryGroupsDto> {
  const terms = buildQuestionTerms(question);
  const [decisions, actionItems, openQuestions, risks] = await Promise.all([
    findDecisionMemories(projectId, terms),
    findActionItemMemories(projectId, terms),
    findOpenQuestionMemories(projectId, terms),
    findRiskMemories(projectId, terms)
  ]);

  return {
    decisions,
    actionItems,
    openQuestions,
    risks
  };
}

async function findDecisionMemories(projectId: string, terms: string[]) {
  const decisions = await prisma.decision.findMany({
    where: buildDecisionWhere(projectId, terms),
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
    ],
    take: MEMORY_RESULT_LIMIT
  });

  if (decisions.length > 0) {
    return decisions.map(toDecisionMemoryDto);
  }

  return findRecentDecisions(projectId);
}

async function findActionItemMemories(projectId: string, terms: string[]) {
  const actionItems = await prisma.actionItem.findMany({
    where: buildActionItemWhere(projectId, terms),
    include: {
      document: {
        select: memoryDocumentSelect
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: MEMORY_RESULT_LIMIT
  });

  if (actionItems.length > 0) {
    return actionItems.map(toActionItemMemoryDto);
  }

  return findRecentActionItems(projectId);
}

async function findOpenQuestionMemories(projectId: string, terms: string[]) {
  const openQuestions = await prisma.openQuestion.findMany({
    where: buildOpenQuestionWhere(projectId, terms),
    include: {
      document: {
        select: memoryDocumentSelect
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: MEMORY_RESULT_LIMIT
  });

  if (openQuestions.length > 0) {
    return openQuestions.map(toOpenQuestionMemoryDto);
  }

  return findRecentOpenQuestions(projectId);
}

async function findRiskMemories(projectId: string, terms: string[]) {
  const risks = await prisma.risk.findMany({
    where: buildRiskWhere(projectId, terms),
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
    ],
    take: MEMORY_RESULT_LIMIT
  });

  if (risks.length > 0) {
    return risks.map(toRiskMemoryDto);
  }

  return findRecentRisks(projectId);
}

async function findRecentDecisions(projectId: string) {
  const decisions = await prisma.decision.findMany({
    where: {
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
    ],
    take: MEMORY_RESULT_LIMIT
  });

  return decisions.map(toDecisionMemoryDto);
}

async function findRecentActionItems(projectId: string) {
  const actionItems = await prisma.actionItem.findMany({
    where: {
      projectId
    },
    include: {
      document: {
        select: memoryDocumentSelect
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: MEMORY_RESULT_LIMIT
  });

  return actionItems.map(toActionItemMemoryDto);
}

async function findRecentOpenQuestions(projectId: string) {
  const openQuestions = await prisma.openQuestion.findMany({
    where: {
      projectId
    },
    include: {
      document: {
        select: memoryDocumentSelect
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: MEMORY_RESULT_LIMIT
  });

  return openQuestions.map(toOpenQuestionMemoryDto);
}

async function findRecentRisks(projectId: string) {
  const risks = await prisma.risk.findMany({
    where: {
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
    ],
    take: MEMORY_RESULT_LIMIT
  });

  return risks.map(toRiskMemoryDto);
}

function buildDecisionWhere(
  projectId: string,
  terms: string[]
): Prisma.DecisionWhereInput {
  const OR = buildTextSearchClauses([
    "title",
    "summary",
    "rationale",
    "sourceQuote"
  ], terms) as Prisma.DecisionWhereInput[];

  return OR.length > 0 ? { projectId, OR } : { projectId };
}

function buildActionItemWhere(
  projectId: string,
  terms: string[]
): Prisma.ActionItemWhereInput {
  const OR = buildTextSearchClauses([
    "title",
    "description",
    "owner",
    "sourceQuote"
  ], terms) as Prisma.ActionItemWhereInput[];

  return OR.length > 0 ? { projectId, OR } : { projectId };
}

function buildOpenQuestionWhere(
  projectId: string,
  terms: string[]
): Prisma.OpenQuestionWhereInput {
  const OR = buildTextSearchClauses([
    "question",
    "context",
    "owner",
    "sourceQuote"
  ], terms) as Prisma.OpenQuestionWhereInput[];

  return OR.length > 0 ? { projectId, OR } : { projectId };
}

function buildRiskWhere(
  projectId: string,
  terms: string[]
): Prisma.RiskWhereInput {
  const OR = buildTextSearchClauses([
    "title",
    "description",
    "mitigation",
    "sourceQuote"
  ], terms) as Prisma.RiskWhereInput[];

  return OR.length > 0 ? { projectId, OR } : { projectId };
}

function buildTextSearchClauses(fields: string[], terms: string[]) {
  return terms.flatMap((term) =>
    fields.map((field) => ({
      [field]: {
        contains: term,
        mode: "insensitive" as const
      }
    }))
  );
}

function buildQuestionTerms(question: string): string[] {
  const normalizedQuestion = question.trim().replace(/\s+/g, " ");
  const terms = new Set<string>();

  if (normalizedQuestion.length > 0) {
    terms.add(normalizedQuestion);
  }

  for (const token of normalizedQuestion.split(/[^0-9A-Za-z\u4e00-\u9fff_-]+/)) {
    const normalizedToken = token.trim();
    const lowerToken = normalizedToken.toLowerCase();

    if (
      normalizedToken.length < 2 ||
      normalizedToken.length > 40 ||
      ignoredSearchTerms.has(lowerToken)
    ) {
      continue;
    }

    terms.add(normalizedToken);

    if (terms.size >= MAX_MEMORY_SEARCH_TERMS) {
      break;
    }
  }

  return [...terms];
}
