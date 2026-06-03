import { askAnswerSchema, type AskAnswer } from "@/lib/ask/schemas";
import {
  evalRetrievedSourcesSchema,
  type CreateEvalCaseInput
} from "@/lib/eval/schemas";

export type EvalRetrievedSourceDto = {
  fileName: string;
  documentId: string;
  chunkId: string;
  chunkIndex: number;
  distance: number;
  quote: string;
};

export type EvalRunDto = {
  id: string;
  projectId: string;
  evalCaseId: string;
  answer: AskAnswer;
  retrievedSources: EvalRetrievedSourceDto[];
  sourceMatch: boolean;
  groundednessScore: number;
  latencyMs: number;
  tokenUsage: unknown | null;
  createdAt: string;
};

export type EvalCaseDto = {
  id: string;
  projectId: string;
  question: string;
  expectedSources: string[];
  expectedFacts: string[];
  latestRun: EvalRunDto | null;
  createdAt: string;
};

export type EvalSummaryDto = {
  totalCases: number;
  casesWithRuns: number;
  sourceMatches: number;
  sourceMisses: number;
  averageGroundednessScore: number | null;
  latestRunAt: string | null;
};

export type ProjectEvalDto = {
  cases: EvalCaseDto[];
  summary: EvalSummaryDto;
};

export type EvalCaseMutationDto = {
  case: EvalCaseDto;
  summary: EvalSummaryDto;
};

export type EvalRunMutationDto = {
  runs: EvalRunDto[];
  summary: EvalSummaryDto;
};

export type EvalCaseRecord = {
  id: string;
  projectId: string;
  question: string;
  expectedSources: string[];
  expectedFacts: string[];
  createdAt: Date;
};

export type EvalRunRecord = {
  id: string;
  projectId: string;
  evalCaseId: string;
  answerJson: unknown;
  retrievedSources: unknown;
  sourceMatch: boolean;
  groundednessScore: number;
  latencyMs: number;
  tokenUsage: unknown | null;
  createdAt: Date;
};

export type EvalCaseWithLatestRunRecord = EvalCaseRecord & {
  latestRunId: string | null;
  latestAnswerJson: unknown | null;
  latestRetrievedSources: unknown | null;
  latestSourceMatch: boolean | null;
  latestGroundednessScore: number | null;
  latestLatencyMs: number | null;
  latestTokenUsage: unknown | null;
  latestCreatedAt: Date | null;
};

export function toEvalRunDto(run: EvalRunRecord): EvalRunDto {
  return {
    id: run.id,
    projectId: run.projectId,
    evalCaseId: run.evalCaseId,
    answer: askAnswerSchema.parse(run.answerJson),
    retrievedSources: evalRetrievedSourcesSchema.parse(run.retrievedSources),
    sourceMatch: run.sourceMatch,
    groundednessScore: run.groundednessScore,
    latencyMs: run.latencyMs,
    tokenUsage: run.tokenUsage ?? null,
    createdAt: run.createdAt.toISOString()
  };
}

export function toEvalCaseDto(
  evalCase: EvalCaseRecord,
  latestRun: EvalRunRecord | null
): EvalCaseDto {
  return {
    id: evalCase.id,
    projectId: evalCase.projectId,
    question: evalCase.question,
    expectedSources: evalCase.expectedSources,
    expectedFacts: evalCase.expectedFacts,
    latestRun: latestRun ? toEvalRunDto(latestRun) : null,
    createdAt: evalCase.createdAt.toISOString()
  };
}

export function toEvalCaseRecord(
  input: CreateEvalCaseInput & { id: string; projectId: string; createdAt: Date }
): EvalCaseRecord {
  return {
    id: input.id,
    projectId: input.projectId,
    question: input.question,
    expectedSources: input.expectedSources,
    expectedFacts: input.expectedFacts,
    createdAt: input.createdAt
  };
}

export function buildEvalSummary(cases: EvalCaseDto[]): EvalSummaryDto {
  const latestRuns = cases.flatMap((evalCase) =>
    evalCase.latestRun ? [evalCase.latestRun] : []
  );
  const scoreTotal = latestRuns.reduce(
    (total, run) => total + run.groundednessScore,
    0
  );
  const latestRunAt = latestRuns
    .map((run) => run.createdAt)
    .sort()
    .at(-1) ?? null;

  return {
    totalCases: cases.length,
    casesWithRuns: latestRuns.length,
    sourceMatches: latestRuns.filter((run) => run.sourceMatch).length,
    sourceMisses: latestRuns.filter((run) => !run.sourceMatch).length,
    averageGroundednessScore:
      latestRuns.length > 0
        ? Math.round((scoreTotal / latestRuns.length) * 10) / 10
        : null,
    latestRunAt
  };
}
