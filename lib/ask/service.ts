import { randomUUID } from "node:crypto";
import { createStructuredResponse } from "@/lib/ai/openai";
import {
  askAnswerJsonSchema,
  askAnswerSchema,
  type AskAnswer
} from "@/lib/ask/schemas";
import { RECENT_ASK_RUN_LIMIT } from "@/lib/ask/constants";
import {
  toAskRunDto,
  type AskRunDto,
  type AskRunRecord,
  type ProjectAskRunsDto
} from "@/lib/ask/types";
import { prisma } from "@/lib/db/prisma";
import {
  retrieveProjectContext,
  type RetrievedProjectContext
} from "@/lib/retrieval/service";

const ASK_ANSWER_SYSTEM_PROMPT =
  "你是 Project Memory Assistant 的 Ask RAG 回答器。你只能根据提供的检索片段和结构化项目记忆回答，不要猜测或补充没有证据的信息。除 source quote、文件名、API 名称、技术术语、产品名和人名外，面向用户的内容必须使用简体中文。quote 必须从上下文原文中摘取，不能翻译或改写。如果证据不足，answer 要明确说明不足，confidence 不能是 high，并在 missingInfo 中列出缺失信息。只返回符合 JSON schema 的内容，不要输出额外说明。";

export type GeneratedAskAnswer = {
  answer: AskAnswer;
  tokenUsage: unknown | null;
};

export class AskUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AskUnavailableError";
  }
}

export async function listProjectAskRuns(
  projectId: string
): Promise<ProjectAskRunsDto | null> {
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

  const runs = await prisma.$queryRaw<AskRunRecord[]>`
    SELECT
      "id",
      "projectId",
      "question",
      "answerJson",
      "latencyMs",
      "tokenUsage",
      "createdAt"
    FROM "ask_runs"
    WHERE "projectId" = ${projectId}
    ORDER BY "createdAt" DESC
    LIMIT ${RECENT_ASK_RUN_LIMIT}
  `;

  return {
    runs: runs.map(toAskRunDto)
  };
}

// 执行完整 Ask pipeline：检索上下文、生成结构化答案，并保存一次问答记录。
export async function askProjectQuestion(
  projectId: string,
  question: string
): Promise<AskRunDto | null> {
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

  const chunkCount = await prisma.chunk.count({
    where: {
      projectId
    }
  });

  if (chunkCount === 0) {
    throw new AskUnavailableError(
      "Project does not have retrievable chunks yet."
    );
  }

  const startedAt = Date.now();
  const context = await retrieveProjectContext(projectId, question);
  const { answer } = await generateProjectAnswerFromContext(question, context);
  const latencyMs = Date.now() - startedAt;

  return saveAskRun(projectId, question, answer, latencyMs);
}

export async function generateProjectAnswerFromContext(
  question: string,
  context: RetrievedProjectContext
): Promise<GeneratedAskAnswer> {
  const response = await createStructuredResponse(
    [
      {
        role: "system",
        content: ASK_ANSWER_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: [
          `用户问题: ${question}`,
          "请基于以下上下文生成结构化答案。",
          "上下文:",
          formatRetrievedContext(context)
        ].join("\n\n")
      }
    ],
    askAnswerJsonSchema,
    "project_memory_answer"
  );
  const parsedJson = JSON.parse(response.text) as unknown;

  return {
    answer: askAnswerSchema.parse(parsedJson),
    tokenUsage: response.tokenUsage
  };
}

async function saveAskRun(
  projectId: string,
  question: string,
  answer: AskAnswer,
  latencyMs: number
): Promise<AskRunDto> {
  const answerJson = JSON.stringify(answer);
  const [run] = await prisma.$queryRaw<AskRunRecord[]>`
    INSERT INTO "ask_runs" (
      "id",
      "projectId",
      "question",
      "answerJson",
      "latencyMs",
      "tokenUsage",
      "createdAt"
    )
    VALUES (
      ${randomUUID()},
      ${projectId},
      ${question},
      ${answerJson}::jsonb,
      ${latencyMs},
      NULL,
      CURRENT_TIMESTAMP
    )
    RETURNING
      "id",
      "projectId",
      "question",
      "answerJson",
      "latencyMs",
      "tokenUsage",
      "createdAt"
  `;

  return toAskRunDto(run);
}

function formatRetrievedContext(context: RetrievedProjectContext): string {
  return [
    "## Source chunks",
    context.chunks.length > 0
      ? context.chunks.map(formatRetrievedChunk).join("\n\n---\n\n")
      : "无",
    "## Structured memories",
    formatStructuredMemories(context)
  ].join("\n\n");
}

function formatRetrievedChunk(
  chunk: RetrievedProjectContext["chunks"][number],
  index: number
): string {
  return [
    `[Chunk ${index + 1}]`,
    `file: ${chunk.fileName}`,
    `chunkIndex: ${chunk.chunkIndex}`,
    `distance: ${chunk.distance.toFixed(4)}`,
    "content:",
    chunk.content
  ].join("\n");
}

function formatStructuredMemories(context: RetrievedProjectContext): string {
  return [
    "### Decisions",
    context.memories.decisions.length > 0
      ? context.memories.decisions.map((decision) =>
          [
            `title: ${decision.title}`,
            `summary: ${decision.summary}`,
            `rationale: ${decision.rationale ?? ""}`,
            `date: ${decision.date ?? ""}`,
            `file: ${decision.document.fileName}`,
            `sourceQuote: ${decision.sourceQuote}`
          ].join("\n")
        ).join("\n\n")
      : "无",
    "### Action items",
    context.memories.actionItems.length > 0
      ? context.memories.actionItems.map((actionItem) =>
          [
            `title: ${actionItem.title}`,
            `description: ${actionItem.description}`,
            `owner: ${actionItem.owner ?? ""}`,
            `dueDate: ${actionItem.dueDate ?? ""}`,
            `status: ${actionItem.status}`,
            `file: ${actionItem.document.fileName}`,
            `sourceQuote: ${actionItem.sourceQuote}`
          ].join("\n")
        ).join("\n\n")
      : "无",
    "### Open questions",
    context.memories.openQuestions.length > 0
      ? context.memories.openQuestions.map((openQuestion) =>
          [
            `question: ${openQuestion.question}`,
            `context: ${openQuestion.context}`,
            `owner: ${openQuestion.owner ?? ""}`,
            `file: ${openQuestion.document.fileName}`,
            `sourceQuote: ${openQuestion.sourceQuote}`
          ].join("\n")
        ).join("\n\n")
      : "无",
    "### Risks",
    context.memories.risks.length > 0
      ? context.memories.risks.map((risk) =>
          [
            `title: ${risk.title}`,
            `description: ${risk.description}`,
            `severity: ${risk.severity}`,
            `mitigation: ${risk.mitigation ?? ""}`,
            `file: ${risk.document.fileName}`,
            `sourceQuote: ${risk.sourceQuote}`
          ].join("\n")
        ).join("\n\n")
      : "无"
  ].join("\n\n");
}

export function getAskDebugMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Ask pipeline error.";
}
