import type { Project } from "@prisma/client";

export type ProjectDto = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectOverviewDocumentsDto = {
  total: number;
  ready: number;
  processing: number;
  failed: number;
  latestIngestionAt: string | null;
};

export type ProjectOverviewChunksDto = {
  total: number;
  averageTokenCount: number | null;
};

export type ProjectOverviewMemoriesDto = {
  total: number;
  decisions: number;
  actionItems: number;
  openQuestions: number;
  risks: number;
};

export type ProjectOverviewAskDto = {
  totalRuns: number;
  latestRunAt: string | null;
};

export type ProjectOverviewEvalDto = {
  totalCases: number;
  casesWithRuns: number;
  sourceMatches: number;
  sourceMisses: number;
  averageGroundednessScore: number | null;
  latestRunAt: string | null;
};

export type ProjectActivityType =
  | "document"
  | "decision"
  | "action_item"
  | "open_question"
  | "risk"
  | "ask"
  | "eval";

export type ProjectActivityDto = {
  id: string;
  type: ProjectActivityType;
  label: string;
  title: string;
  description: string;
  timestamp: string;
  href: string | null;
};

export type ProjectOverviewDto = {
  project: ProjectDto;
  documents: ProjectOverviewDocumentsDto;
  chunks: ProjectOverviewChunksDto;
  memories: ProjectOverviewMemoriesDto;
  ask: ProjectOverviewAskDto;
  eval: ProjectOverviewEvalDto;
  activity: ProjectActivityDto[];
};

export function toProjectDto(project: Project): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}
