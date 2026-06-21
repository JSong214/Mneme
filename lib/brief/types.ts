import type { ProjectDto, ProjectOverviewDto } from "@/lib/projects/types";

export type ProjectBriefSummaryDto = {
  documentCount: number;
  readyDocumentCount: number;
  failedDocumentCount: number;
  chunkCount: number;
  memoryCount: number;
  askRunCount: number;
  evalCaseCount: number;
  evalRunsCompleted: number;
  averageGroundednessScore: number | null;
};

export type ProjectBriefDto = {
  project: ProjectDto;
  generatedAt: string;
  markdown: string;
  summary: ProjectBriefSummaryDto;
};

export function buildProjectBriefSummary(
  overview: ProjectOverviewDto
): ProjectBriefSummaryDto {
  return {
    documentCount: overview.documents.total,
    readyDocumentCount: overview.documents.ready,
    failedDocumentCount: overview.documents.failed,
    chunkCount: overview.chunks.total,
    memoryCount: overview.memories.total,
    askRunCount: overview.ask.totalRuns,
    evalCaseCount: overview.eval.totalCases,
    evalRunsCompleted: overview.eval.casesWithRuns,
    averageGroundednessScore: overview.eval.averageGroundednessScore
  };
}
