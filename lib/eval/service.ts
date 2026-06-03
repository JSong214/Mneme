import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { createStructuredResponse } from "@/lib/ai/openai";
import { generateProjectAnswerFromContext } from "@/lib/ask/service";
import type { AskAnswer } from "@/lib/ask/schemas";
import { prisma } from "@/lib/db/prisma";
import {
  createEvalCaseSchema,
  groundednessJudgeJsonSchema,
  groundednessJudgeSchema,
  runEvalSchema
} from "@/lib/eval/schemas";
import {
  buildEvalSummary,
  toEvalCaseDto,
  toEvalRunDto,
  type EvalCaseDto,
  type EvalCaseMutationDto,
  type EvalCaseRecord,
  type EvalCaseWithLatestRunRecord,
  type EvalRetrievedSourceDto,
  type EvalRunDto,
  type EvalRunMutationDto,
  type EvalRunRecord,
  type ProjectEvalDto
} from "@/lib/eval/types";
import {
  retrieveProjectContext,
  type RetrievedProjectContext
} from "@/lib/retrieval/service";

const GROUNDNESS_JUDGE_SYSTEM_PROMPT =
  "你是 Project Memory Assistant 的 eval judge。请根据用户问题、expected facts、生成回答、回答引用证据和检索片段，判断回答是否被证据支持。只返回 JSON，不要输出额外说明。groundednessScore 必须是 1 到 5 的整数：1 表示 unsupported or hallucinated，2 表示 weakly supported，3 表示 partially supported，4 表示 mostly supported，5 表示 fully supported。";

export class EvalUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvalUnavailableError";
  }
}

export class EvalCaseNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvalCaseNotFoundError";
  }
}

export async function listProjectEval(
  projectId: string
): Promise<ProjectEvalDto | null> {
  const project = await findProject(projectId);

  if (!project) {
    return null;
  }

  return getProjectEval(projectId);
}

export async function createProjectEvalCase(
  projectId: string,
  input: unknown
): Promise<EvalCaseMutationDto | null> {
  const project = await findProject(projectId);

  if (!project) {
    return null;
  }

  const parsedInput = createEvalCaseSchema.parse(input);
  const data = {
    question: parsedInput.question,
    expectedSources: normalizeStringList(parsedInput.expectedSources),
    expectedFacts: normalizeStringList(parsedInput.expectedFacts)
  };

  const [record] = await prisma.$queryRaw<EvalCaseRecord[]>`
    INSERT INTO "eval_cases" (
      "id",
      "projectId",
      "question",
      "expectedSources",
      "expectedFacts",
      "createdAt"
    )
    VALUES (
      ${randomUUID()},
      ${projectId},
      ${data.question},
      ARRAY[${Prisma.join(data.expectedSources)}]::TEXT[],
      ARRAY[${Prisma.join(data.expectedFacts)}]::TEXT[],
      CURRENT_TIMESTAMP
    )
    RETURNING
      "id",
      "projectId",
      "question",
      "expectedSources",
      "expectedFacts",
      "createdAt"
  `;
  const projectEval = await getProjectEval(projectId);

  return {
    case: toEvalCaseDto(record, null),
    summary: projectEval.summary
  };
}

export async function runProjectEval(
  projectId: string,
  input: unknown
): Promise<EvalRunMutationDto | null> {
  const project = await findProject(projectId);

  if (!project) {
    return null;
  }

  const parsedInput = runEvalSchema.parse(input);
  const cases = parsedInput.evalCaseId
    ? [await findEvalCase(projectId, parsedInput.evalCaseId)]
    : await listEvalCases(projectId);

  if (cases.some((evalCase) => !evalCase)) {
    throw new EvalCaseNotFoundError("Eval case was not found.");
  }

  const evalCases = cases.filter(
    (evalCase): evalCase is EvalCaseRecord => Boolean(evalCase)
  );

  if (evalCases.length === 0) {
    const projectEval = await getProjectEval(projectId);

    return {
      runs: [],
      summary: projectEval.summary
    };
  }

  const chunkCount = await prisma.chunk.count({
    where: {
      projectId
    }
  });

  if (chunkCount === 0) {
    throw new EvalUnavailableError(
      "Project does not have retrievable chunks yet."
    );
  }

  const runs: EvalRunDto[] = [];

  for (const evalCase of evalCases) {
    runs.push(await runSingleEvalCase(evalCase));
  }

  const projectEval = await getProjectEval(projectId);

  return {
    runs,
    summary: projectEval.summary
  };
}

async function runSingleEvalCase(
  evalCase: EvalCaseRecord
): Promise<EvalRunDto> {
  const startedAt = Date.now();
  const context = await retrieveProjectContext(evalCase.projectId, evalCase.question);
  const { answer, tokenUsage: answerTokenUsage } =
    await generateProjectAnswerFromContext(evalCase.question, context);
  const retrievedSources = buildRetrievedSources(context);
  const sourceMatch = checkSourceMatch(evalCase.expectedSources, retrievedSources);
  const { groundednessScore, tokenUsage: judgeTokenUsage } =
    await judgeGroundedness(evalCase, answer, retrievedSources);
  const latencyMs = Date.now() - startedAt;

  return saveEvalRun({
    evalCase,
    answer,
    retrievedSources,
    sourceMatch,
    groundednessScore,
    latencyMs,
    tokenUsage: buildTokenUsage(answerTokenUsage, judgeTokenUsage)
  });
}

async function judgeGroundedness(
  evalCase: EvalCaseRecord,
  answer: AskAnswer,
  retrievedSources: EvalRetrievedSourceDto[]
) {
  const response = await createStructuredResponse(
    [
      {
        role: "system",
        content: GROUNDNESS_JUDGE_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: formatGroundednessJudgeInput(evalCase, answer, retrievedSources)
      }
    ],
    groundednessJudgeJsonSchema,
    "eval_groundedness_judge"
  );
  const parsedJson = JSON.parse(response.text) as unknown;
  const result = groundednessJudgeSchema.parse(parsedJson);

  return {
    groundednessScore: result.groundednessScore,
    tokenUsage: response.tokenUsage
  };
}

async function saveEvalRun(input: {
  evalCase: EvalCaseRecord;
  answer: AskAnswer;
  retrievedSources: EvalRetrievedSourceDto[];
  sourceMatch: boolean;
  groundednessScore: number;
  latencyMs: number;
  tokenUsage: unknown | null;
}): Promise<EvalRunDto> {
  const answerJson = JSON.stringify(input.answer);
  const retrievedSourcesJson = JSON.stringify(input.retrievedSources);
  const tokenUsageJson = input.tokenUsage ? JSON.stringify(input.tokenUsage) : null;
  const [record] = await prisma.$queryRaw<EvalRunRecord[]>`
    INSERT INTO "eval_runs" (
      "id",
      "projectId",
      "evalCaseId",
      "answerJson",
      "retrievedSources",
      "sourceMatch",
      "groundednessScore",
      "latencyMs",
      "tokenUsage",
      "createdAt"
    )
    VALUES (
      ${randomUUID()},
      ${input.evalCase.projectId},
      ${input.evalCase.id},
      ${answerJson}::jsonb,
      ${retrievedSourcesJson}::jsonb,
      ${input.sourceMatch},
      ${input.groundednessScore},
      ${input.latencyMs},
      CASE
        WHEN ${tokenUsageJson} IS NULL THEN NULL
        ELSE ${tokenUsageJson}::jsonb
      END,
      CURRENT_TIMESTAMP
    )
    RETURNING
      "id",
      "projectId",
      "evalCaseId",
      "answerJson",
      "retrievedSources",
      "sourceMatch",
      "groundednessScore",
      "latencyMs",
      "tokenUsage",
      "createdAt"
  `;

  return toEvalRunDto(record);
}

async function getProjectEval(projectId: string): Promise<ProjectEvalDto> {
  const rows = await listEvalCasesWithLatestRuns(projectId);
  const cases = rows.map(rowToEvalCaseDto);

  return {
    cases,
    summary: buildEvalSummary(cases)
  };
}

async function findProject(projectId: string) {
  return prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: {
      id: true
    }
  });
}

async function listEvalCases(projectId: string): Promise<EvalCaseRecord[]> {
  return prisma.$queryRaw<EvalCaseRecord[]>`
    SELECT
      "id",
      "projectId",
      "question",
      "expectedSources",
      "expectedFacts",
      "createdAt"
    FROM "eval_cases"
    WHERE "projectId" = ${projectId}
    ORDER BY "createdAt" DESC
  `;
}

async function findEvalCase(
  projectId: string,
  evalCaseId: string
): Promise<EvalCaseRecord | null> {
  const [record] = await prisma.$queryRaw<EvalCaseRecord[]>`
    SELECT
      "id",
      "projectId",
      "question",
      "expectedSources",
      "expectedFacts",
      "createdAt"
    FROM "eval_cases"
    WHERE "projectId" = ${projectId}
      AND "id" = ${evalCaseId}
    LIMIT 1
  `;

  return record ?? null;
}

async function listEvalCasesWithLatestRuns(
  projectId: string
): Promise<EvalCaseWithLatestRunRecord[]> {
  return prisma.$queryRaw<EvalCaseWithLatestRunRecord[]>`
    SELECT
      ec."id",
      ec."projectId",
      ec."question",
      ec."expectedSources",
      ec."expectedFacts",
      ec."createdAt",
      er."id" AS "latestRunId",
      er."answerJson" AS "latestAnswerJson",
      er."retrievedSources" AS "latestRetrievedSources",
      er."sourceMatch" AS "latestSourceMatch",
      er."groundednessScore" AS "latestGroundednessScore",
      er."latencyMs" AS "latestLatencyMs",
      er."tokenUsage" AS "latestTokenUsage",
      er."createdAt" AS "latestCreatedAt"
    FROM "eval_cases" ec
    LEFT JOIN LATERAL (
      SELECT *
      FROM "eval_runs" er
      WHERE er."evalCaseId" = ec."id"
      ORDER BY er."createdAt" DESC
      LIMIT 1
    ) er ON true
    WHERE ec."projectId" = ${projectId}
    ORDER BY ec."createdAt" DESC
  `;
}

function rowToEvalCaseDto(row: EvalCaseWithLatestRunRecord): EvalCaseDto {
  const latestRun =
    row.latestRunId && row.latestCreatedAt
      ? {
          id: row.latestRunId,
          projectId: row.projectId,
          evalCaseId: row.id,
          answerJson: row.latestAnswerJson,
          retrievedSources: row.latestRetrievedSources,
          sourceMatch: row.latestSourceMatch ?? false,
          groundednessScore: row.latestGroundednessScore ?? 1,
          latencyMs: row.latestLatencyMs ?? 0,
          tokenUsage: row.latestTokenUsage,
          createdAt: row.latestCreatedAt
        }
      : null;

  return toEvalCaseDto(row, latestRun);
}

function buildRetrievedSources(
  context: RetrievedProjectContext
): EvalRetrievedSourceDto[] {
  return context.chunks.map((chunk) => ({
    fileName: chunk.fileName,
    documentId: chunk.documentId,
    chunkId: chunk.id,
    chunkIndex: chunk.chunkIndex,
    distance: chunk.distance,
    quote: buildSourceQuote(chunk.content)
  }));
}

function checkSourceMatch(
  expectedSources: string[],
  retrievedSources: EvalRetrievedSourceDto[]
) {
  const retrievedFileNames = new Set(
    retrievedSources.map((source) => normalizeSourceName(source.fileName))
  );

  return expectedSources.every((source) =>
    retrievedFileNames.has(normalizeSourceName(source))
  );
}

function formatGroundednessJudgeInput(
  evalCase: EvalCaseRecord,
  answer: AskAnswer,
  retrievedSources: EvalRetrievedSourceDto[]
) {
  return [
    `问题: ${evalCase.question}`,
    "Expected facts:",
    evalCase.expectedFacts.map((fact) => `- ${fact}`).join("\n"),
    "生成回答:",
    answer.answer,
    "回答 confidence:",
    answer.confidence,
    "回答 evidence:",
    answer.evidence
      .map((evidence) =>
        [
          `file: ${evidence.file}`,
          `quote: ${evidence.quote}`,
          `relevance: ${evidence.relevance}`
        ].join("\n")
      )
      .join("\n\n"),
    "Retrieved source snippets:",
    retrievedSources
      .map((source) =>
        [
          `file: ${source.fileName}`,
          `chunkIndex: ${source.chunkIndex}`,
          `quote: ${source.quote}`
        ].join("\n")
      )
      .join("\n\n")
  ].join("\n\n");
}

function buildSourceQuote(content: string) {
  const normalizedContent = content.trim().replace(/\s+/g, " ");

  return normalizedContent.length > 800
    ? `${normalizedContent.slice(0, 800)}...`
    : normalizedContent;
}

function normalizeStringList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeSourceName(value: string) {
  return value.trim().toLowerCase();
}

function buildTokenUsage(answerUsage: unknown | null, judgeUsage: unknown | null) {
  if (!answerUsage && !judgeUsage) {
    return null;
  }

  return {
    answer: answerUsage,
    groundednessJudge: judgeUsage
  };
}

export function getEvalDebugMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown eval pipeline error.";
}
