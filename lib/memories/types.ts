import type {
  ActionItem,
  ActionItemStatus,
  Decision,
  Document,
  OpenQuestion,
  Risk,
  RiskSeverity
} from "@prisma/client";

export type ActionItemStatusDto = "open" | "in_progress" | "done";
export type RiskSeverityDto = "low" | "medium" | "high";

export type MemoryDocumentDto = {
  id: string;
  fileName: string;
};

export type DecisionMemoryDto = {
  id: string;
  projectId: string;
  documentId: string;
  document: MemoryDocumentDto;
  title: string;
  summary: string;
  rationale: string | null;
  date: string | null;
  participants: string[];
  sourceQuote: string;
  createdAt: string;
};

export type ActionItemMemoryDto = {
  id: string;
  projectId: string;
  documentId: string;
  document: MemoryDocumentDto;
  title: string;
  description: string;
  owner: string | null;
  dueDate: string | null;
  status: ActionItemStatusDto;
  sourceQuote: string;
  createdAt: string;
};

export type OpenQuestionMemoryDto = {
  id: string;
  projectId: string;
  documentId: string;
  document: MemoryDocumentDto;
  question: string;
  context: string;
  owner: string | null;
  sourceQuote: string;
  createdAt: string;
};

export type RiskMemoryDto = {
  id: string;
  projectId: string;
  documentId: string;
  document: MemoryDocumentDto;
  title: string;
  description: string;
  severity: RiskSeverityDto;
  mitigation: string | null;
  sourceQuote: string;
  createdAt: string;
};

export type ProjectMemoryGroupsDto = {
  decisions: DecisionMemoryDto[];
  actionItems: ActionItemMemoryDto[];
  openQuestions: OpenQuestionMemoryDto[];
  risks: RiskMemoryDto[];
};

export type MemorySummaryDto = {
  total: number;
  decisions: number;
  actionItems: number;
  openQuestions: number;
  risks: number;
};

export type ProjectMemoriesDto = {
  memories: ProjectMemoryGroupsDto;
  summary: MemorySummaryDto;
};

type MemoryDocument = Pick<Document, "id" | "fileName">;

export type DecisionWithDocument = Decision & {
  document: MemoryDocument;
};

export type ActionItemWithDocument = ActionItem & {
  document: MemoryDocument;
};

export type OpenQuestionWithDocument = OpenQuestion & {
  document: MemoryDocument;
};

export type RiskWithDocument = Risk & {
  document: MemoryDocument;
};

const actionItemStatusMap: Record<ActionItemStatus, ActionItemStatusDto> = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  DONE: "done"
};

const riskSeverityMap: Record<RiskSeverity, RiskSeverityDto> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
};

export function toDecisionMemoryDto(
  decision: DecisionWithDocument
): DecisionMemoryDto {
  return {
    id: decision.id,
    projectId: decision.projectId,
    documentId: decision.documentId,
    document: toMemoryDocumentDto(decision.document),
    title: decision.title,
    summary: decision.summary,
    rationale: decision.rationale,
    date: decision.date?.toISOString() ?? null,
    participants: decision.participants,
    sourceQuote: decision.sourceQuote,
    createdAt: decision.createdAt.toISOString()
  };
}

export function toActionItemMemoryDto(
  actionItem: ActionItemWithDocument
): ActionItemMemoryDto {
  return {
    id: actionItem.id,
    projectId: actionItem.projectId,
    documentId: actionItem.documentId,
    document: toMemoryDocumentDto(actionItem.document),
    title: actionItem.title,
    description: actionItem.description,
    owner: actionItem.owner,
    dueDate: actionItem.dueDate?.toISOString() ?? null,
    status: actionItemStatusMap[actionItem.status],
    sourceQuote: actionItem.sourceQuote,
    createdAt: actionItem.createdAt.toISOString()
  };
}

export function toOpenQuestionMemoryDto(
  openQuestion: OpenQuestionWithDocument
): OpenQuestionMemoryDto {
  return {
    id: openQuestion.id,
    projectId: openQuestion.projectId,
    documentId: openQuestion.documentId,
    document: toMemoryDocumentDto(openQuestion.document),
    question: openQuestion.question,
    context: openQuestion.context,
    owner: openQuestion.owner,
    sourceQuote: openQuestion.sourceQuote,
    createdAt: openQuestion.createdAt.toISOString()
  };
}

export function toRiskMemoryDto(risk: RiskWithDocument): RiskMemoryDto {
  return {
    id: risk.id,
    projectId: risk.projectId,
    documentId: risk.documentId,
    document: toMemoryDocumentDto(risk.document),
    title: risk.title,
    description: risk.description,
    severity: riskSeverityMap[risk.severity],
    mitigation: risk.mitigation,
    sourceQuote: risk.sourceQuote,
    createdAt: risk.createdAt.toISOString()
  };
}

export function buildMemorySummary(
  memories: ProjectMemoryGroupsDto
): MemorySummaryDto {
  const decisions = memories.decisions.length;
  const actionItems = memories.actionItems.length;
  const openQuestions = memories.openQuestions.length;
  const risks = memories.risks.length;

  return {
    total: decisions + actionItems + openQuestions + risks,
    decisions,
    actionItems,
    openQuestions,
    risks
  };
}

function toMemoryDocumentDto(document: MemoryDocument): MemoryDocumentDto {
  return {
    id: document.id,
    fileName: document.fileName
  };
}
