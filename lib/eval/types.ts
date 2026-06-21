import { askAnswerSchema, type AskAnswer } from "@/lib/ask/schemas";
import {
  evalRetrievedSourcesSchema,
  type CreateEvalCaseInput
} from "@/lib/eval/schemas";
import type { RetrievalMetrics, RetrievalMode } from "@/lib/retrieval/service";

export type RetrievalModeDto = RetrievalMode;

export const retrievalModeLabels: Record<RetrievalModeDto, string> = {
  baseline: "Baseline",
  rerank: "Rerank"
};

export type EvalRetrievedSourceDto = {
  fileName: string;
  documentId: string;
  chunkId: string;
  chunkIndex: number;
  distance: number;
  quote: string;
  matchesExpectedSource: boolean;
};

export type EvalExpectedSourceCoverageDto = {
  source: string;
  matched: boolean;
};

export type EvalRunDiagnosticsDto = {
  expectedSourceCoverage: EvalExpectedSourceCoverageDto[];
  missingExpectedSources: string[];
  matchedRetrievedSourceCount: number;
  retrievedSourceCount: number;
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
  retrievalMode: RetrievalModeDto;
  retrievalMetrics: RetrievalMetrics | null;
  tokenUsage: unknown | null;
  diagnostics: EvalRunDiagnosticsDto;
  createdAt: string;
};

export type EvalCaseDto = {
  id: string;
  projectId: string;
  question: string;
  expectedSources: string[];
  expectedFacts: string[];
  latestRun: EvalRunDto | null;
  latestRunsByMode: Record<RetrievalModeDto, EvalRunDto | null>;
  createdAt: string;
};

export type EvalModeSummaryDto = {
  retrievalMode: RetrievalModeDto;
  totalCases: number;
  casesWithRuns: number;
  sourceMatches: number;
  sourceMisses: number;
  averageGroundednessScore: number | null;
  averageLatencyMs: number | null;
  latestRunAt: string | null;
};

export type EvalSummaryDto = {
  totalCases: number;
  casesWithRuns: number;
  sourceMatches: number;
  sourceMisses: number;
  averageGroundednessScore: number | null;
  latestRunAt: string | null;
  modeSummaries: Record<RetrievalModeDto, EvalModeSummaryDto>;
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
  retrievalMode?: string | null;
  retrievalMetrics?: unknown | null;
  tokenUsage: unknown | null;
  createdAt: Date;
};

const retrievalModes: RetrievalModeDto[] = ["baseline", "rerank"];

export function toEvalRunDto(
  run: EvalRunRecord,
  expectedSources: string[] = []
): EvalRunDto {
  const retrievalMode = normalizeRetrievalMode(run.retrievalMode);
  const retrievedSources = enrichRetrievedSources(
    evalRetrievedSourcesSchema.parse(run.retrievedSources),
    expectedSources
  );

  return {
    id: run.id,
    projectId: run.projectId,
    evalCaseId: run.evalCaseId,
    answer: askAnswerSchema.parse(run.answerJson),
    retrievedSources,
    sourceMatch: run.sourceMatch,
    groundednessScore: run.groundednessScore,
    latencyMs: run.latencyMs,
    retrievalMode,
    retrievalMetrics: isRetrievalMetrics(run.retrievalMetrics)
      ? run.retrievalMetrics
      : null,
    tokenUsage: run.tokenUsage ?? null,
    diagnostics: buildRunDiagnostics(expectedSources, retrievedSources),
    createdAt: run.createdAt.toISOString()
  };
}

export function toEvalCaseDto(
  evalCase: EvalCaseRecord,
  latestRuns: EvalRunRecord[] | null = null
): EvalCaseDto {
  const runs = (latestRuns ?? []).map((run) =>
    toEvalRunDto(run, evalCase.expectedSources)
  );
  const latestRunsByMode = Object.fromEntries(
    retrievalModes.map((mode) => [
      mode,
      runs.find((run) => run.retrievalMode === mode) ?? null
    ])
  ) as Record<RetrievalModeDto, EvalRunDto | null>;
  const latestRun =
    runs
      .slice()
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )[0] ?? null;

  return {
    id: evalCase.id,
    projectId: evalCase.projectId,
    question: evalCase.question,
    expectedSources: evalCase.expectedSources,
    expectedFacts: evalCase.expectedFacts,
    latestRun,
    latestRunsByMode,
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
  const modeSummaries = Object.fromEntries(
    retrievalModes.map((mode) => [mode, buildModeSummary(cases, mode)])
  ) as Record<RetrievalModeDto, EvalModeSummaryDto>;
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
    latestRunAt,
    modeSummaries
  };
}

function buildModeSummary(
  cases: EvalCaseDto[],
  retrievalMode: RetrievalModeDto
): EvalModeSummaryDto {
  const runs = cases.flatMap((evalCase) => {
    const run = evalCase.latestRunsByMode[retrievalMode];

    return run ? [run] : [];
  });
  const scoreTotal = runs.reduce(
    (total, run) => total + run.groundednessScore,
    0
  );
  const latencyTotal = runs.reduce((total, run) => total + run.latencyMs, 0);
  const latestRunAt = runs
    .map((run) => run.createdAt)
    .sort()
    .at(-1) ?? null;

  return {
    retrievalMode,
    totalCases: cases.length,
    casesWithRuns: runs.length,
    sourceMatches: runs.filter((run) => run.sourceMatch).length,
    sourceMisses: runs.filter((run) => !run.sourceMatch).length,
    averageGroundednessScore:
      runs.length > 0 ? Math.round((scoreTotal / runs.length) * 10) / 10 : null,
    averageLatencyMs:
      runs.length > 0 ? Math.round(latencyTotal / runs.length) : null,
    latestRunAt
  };
}

function enrichRetrievedSources(
  sources: Array<Omit<EvalRetrievedSourceDto, "matchesExpectedSource">>,
  expectedSources: string[]
): EvalRetrievedSourceDto[] {
  const expectedSourceNames = new Set(expectedSources.map(normalizeSourceName));

  return sources.map((source) => ({
    ...source,
    matchesExpectedSource: expectedSourceNames.has(
      normalizeSourceName(source.fileName)
    )
  }));
}

function buildRunDiagnostics(
  expectedSources: string[],
  retrievedSources: EvalRetrievedSourceDto[]
): EvalRunDiagnosticsDto {
  const retrievedFileNames = new Set(
    retrievedSources.map((source) => normalizeSourceName(source.fileName))
  );
  const expectedSourceCoverage = expectedSources.map((source) => ({
    source,
    matched: retrievedFileNames.has(normalizeSourceName(source))
  }));

  return {
    expectedSourceCoverage,
    missingExpectedSources: expectedSourceCoverage
      .filter((source) => !source.matched)
      .map((source) => source.source),
    matchedRetrievedSourceCount: retrievedSources.filter(
      (source) => source.matchesExpectedSource
    ).length,
    retrievedSourceCount: retrievedSources.length
  };
}

function normalizeRetrievalMode(value: string | null | undefined): RetrievalModeDto {
  return value === "rerank" ? "rerank" : "baseline";
}

function normalizeSourceName(value: string) {
  return value.trim().toLowerCase();
}

function isRetrievalMetrics(value: unknown): value is RetrievalMetrics {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<RetrievalMetrics>;

  return record.mode === "baseline" || record.mode === "rerank";
}
