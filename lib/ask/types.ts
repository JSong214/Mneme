import { askAnswerSchema, type AskAnswer } from "@/lib/ask/schemas";

export type AskRunDto = {
  id: string;
  projectId: string;
  question: string;
  answer: AskAnswer;
  latencyMs: number;
  tokenUsage: unknown | null;
  createdAt: string;
};

export type ProjectAskRunsDto = {
  runs: AskRunDto[];
};

export type AskRunRecord = {
  id: string;
  projectId: string;
  question: string;
  answerJson: unknown;
  latencyMs: number;
  tokenUsage: unknown | null;
  createdAt: Date;
};

export function toAskRunDto(run: AskRunRecord): AskRunDto {
  return {
    id: run.id,
    projectId: run.projectId,
    question: run.question,
    answer: askAnswerSchema.parse(run.answerJson),
    latencyMs: run.latencyMs,
    tokenUsage: run.tokenUsage ?? null,
    createdAt: run.createdAt.toISOString()
  };
}
