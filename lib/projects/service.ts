import type { DocumentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  createProjectSchema,
  deleteProjectSchema
} from "@/lib/projects/schemas";
import {
  toProjectDto,
  type ProjectActivityDto,
  type ProjectDto,
  type ProjectOverviewDocumentsDto,
  type ProjectOverviewDto,
  type ProjectOverviewEvalDto
} from "@/lib/projects/types";

type DocumentStatusCount = {
  status: DocumentStatus;
  _count?: true | {
    _all?: number;
  };
};

type EvalOverviewRow = {
  totalCases: number;
  casesWithRuns: number;
  sourceMatches: number;
  sourceMisses: number;
  averageGroundednessScore: number | null;
  latestRunAt: Date | null;
};

const PROJECT_ACTIVITY_LIMIT = 8;

export class ProjectDeleteConfirmationError extends Error {
  constructor() {
    super("Project name confirmation does not match.");
    this.name = "ProjectDeleteConfirmationError";
  }
}

export async function listProjects(): Promise<ProjectDto[]> {
  const projects = await prisma.project.findMany({
    orderBy: {
      updatedAt: "desc"
    }
  });

  return projects.map(toProjectDto);
}

export async function getProject(projectId: string): Promise<ProjectDto | null> {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    }
  });

  return project ? toProjectDto(project) : null;
}

// 汇总单个项目的核心运行状态，供 Overview 页面和 API 共用。
export async function getProjectOverview(
  projectId: string
): Promise<ProjectOverviewDto | null> {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    }
  });

  if (!project) {
    return null;
  }

  const [
    documentStatusCounts,
    latestDocument,
    chunkStats,
    decisionCount,
    actionItemCount,
    openQuestionCount,
    riskCount,
    askRunCount,
    latestAskRun,
    evalOverviewRows,
    recentDocuments,
    recentDecisions,
    recentActionItems,
    recentOpenQuestions,
    recentRisks,
    recentAskRuns,
    recentEvalRuns
  ] = await prisma.$transaction([
    prisma.document.groupBy({
      by: ["status"],
      where: {
        projectId
      },
      orderBy: {
        status: "asc"
      },
      _count: {
        _all: true
      }
    }),
    prisma.document.findFirst({
      where: {
        projectId
      },
      orderBy: {
        updatedAt: "desc"
      },
      select: {
        updatedAt: true
      }
    }),
    prisma.chunk.aggregate({
      where: {
        projectId
      },
      _count: {
        _all: true
      },
      _avg: {
        tokenCount: true
      }
    }),
    prisma.decision.count({
      where: {
        projectId
      }
    }),
    prisma.actionItem.count({
      where: {
        projectId
      }
    }),
    prisma.openQuestion.count({
      where: {
        projectId
      }
    }),
    prisma.risk.count({
      where: {
        projectId
      }
    }),
    prisma.askRun.count({
      where: {
        projectId
      }
    }),
    prisma.askRun.findFirst({
      where: {
        projectId
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        createdAt: true
      }
    }),
    prisma.$queryRaw<EvalOverviewRow[]>`
      SELECT
        COUNT(ec."id")::int AS "totalCases",
        COUNT(er."id")::int AS "casesWithRuns",
        COUNT(er."id") FILTER (WHERE er."sourceMatch" = true)::int AS "sourceMatches",
        COUNT(er."id") FILTER (WHERE er."sourceMatch" = false)::int AS "sourceMisses",
        ROUND(AVG(er."groundednessScore")::numeric, 1)::double precision AS "averageGroundednessScore",
        MAX(er."createdAt") AS "latestRunAt"
      FROM "eval_cases" ec
      LEFT JOIN LATERAL (
        SELECT
          "id",
          "sourceMatch",
          "groundednessScore",
          "createdAt"
        FROM "eval_runs" er
        WHERE er."evalCaseId" = ec."id"
        ORDER BY er."createdAt" DESC
        LIMIT 1
      ) er ON true
      WHERE ec."projectId" = ${projectId}
    `,
    prisma.document.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        fileName: true,
        status: true,
        errorMessage: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: PROJECT_ACTIVITY_LIMIT
    }),
    prisma.decision.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        title: true,
        summary: true,
        documentId: true,
        createdAt: true,
        document: {
          select: {
            fileName: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: PROJECT_ACTIVITY_LIMIT
    }),
    prisma.actionItem.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        title: true,
        owner: true,
        status: true,
        documentId: true,
        createdAt: true,
        document: {
          select: {
            fileName: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: PROJECT_ACTIVITY_LIMIT
    }),
    prisma.openQuestion.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        question: true,
        owner: true,
        documentId: true,
        createdAt: true,
        document: {
          select: {
            fileName: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: PROJECT_ACTIVITY_LIMIT
    }),
    prisma.risk.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        title: true,
        severity: true,
        documentId: true,
        createdAt: true,
        document: {
          select: {
            fileName: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: PROJECT_ACTIVITY_LIMIT
    }),
    prisma.askRun.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        question: true,
        latencyMs: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: PROJECT_ACTIVITY_LIMIT
    }),
    prisma.evalRun.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        sourceMatch: true,
        groundednessScore: true,
        createdAt: true,
        evalCase: {
          select: {
            question: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: PROJECT_ACTIVITY_LIMIT
    })
  ]);
  const memoryCounts = {
    decisions: decisionCount,
    actionItems: actionItemCount,
    openQuestions: openQuestionCount,
    risks: riskCount
  };
  const evalOverview = evalOverviewRows[0] ?? {
    totalCases: 0,
    casesWithRuns: 0,
    sourceMatches: 0,
    sourceMisses: 0,
    averageGroundednessScore: null,
    latestRunAt: null
  };

  return {
    project: toProjectDto(project),
    documents: buildDocumentOverview(documentStatusCounts, latestDocument?.updatedAt ?? null),
    chunks: {
      total: chunkStats._count._all,
      averageTokenCount:
        chunkStats._avg.tokenCount === null
          ? null
          : Math.round(chunkStats._avg.tokenCount)
    },
    memories: {
      ...memoryCounts,
      total:
        memoryCounts.decisions +
        memoryCounts.actionItems +
        memoryCounts.openQuestions +
        memoryCounts.risks
    },
    ask: {
      totalRuns: askRunCount,
      latestRunAt: latestAskRun?.createdAt.toISOString() ?? null
    },
    eval: toEvalOverviewDto(evalOverview),
    activity: buildProjectActivity({
      projectId,
      documents: recentDocuments,
      decisions: recentDecisions,
      actionItems: recentActionItems,
      openQuestions: recentOpenQuestions,
      risks: recentRisks,
      askRuns: recentAskRuns,
      evalRuns: recentEvalRuns
    })
  };
}

export async function createProject(
  input: unknown
): Promise<ProjectDto> {
  const data = createProjectSchema.parse(input);
  const description =
    data.description && data.description.length > 0 ? data.description : null;

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description
    }
  });

  return toProjectDto(project);
}

// 永久删除项目，并依赖数据库级联清理文档、chunks、结构化记忆、Ask 与 Eval 数据。
export async function deleteProject(
  projectId: string,
  input: unknown
): Promise<{ deletedProjectId: string } | null> {
  const data = deleteProjectSchema.parse(input);
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!project) {
    return null;
  }

  if (data.confirmationName !== project.name) {
    throw new ProjectDeleteConfirmationError();
  }

  await prisma.project.delete({
    where: {
      id: project.id
    }
  });

  return {
    deletedProjectId: project.id
  };
}

function buildDocumentOverview(
  statusCounts: DocumentStatusCount[],
  latestIngestionAt: Date | null
): ProjectOverviewDocumentsDto {
  const counts: Record<DocumentStatus, number> = {
    PROCESSING: 0,
    READY: 0,
    FAILED: 0
  };

  statusCounts.forEach((statusCount) => {
    counts[statusCount.status] =
      typeof statusCount._count === "object" ? statusCount._count._all ?? 0 : 0;
  });

  return {
    total: counts.PROCESSING + counts.READY + counts.FAILED,
    ready: counts.READY,
    processing: counts.PROCESSING,
    failed: counts.FAILED,
    latestIngestionAt: latestIngestionAt?.toISOString() ?? null
  };
}

function toEvalOverviewDto(row: EvalOverviewRow): ProjectOverviewEvalDto {
  return {
    totalCases: row.totalCases,
    casesWithRuns: row.casesWithRuns,
    sourceMatches: row.sourceMatches,
    sourceMisses: row.sourceMisses,
    averageGroundednessScore: row.averageGroundednessScore,
    latestRunAt: row.latestRunAt?.toISOString() ?? null
  };
}

// 将不同子系统的最近记录合并成项目首页可读的活动流。
function buildProjectActivity(input: {
  projectId: string;
  documents: Array<{
    id: string;
    fileName: string;
    status: DocumentStatus;
    errorMessage: string | null;
    updatedAt: Date;
  }>;
  decisions: Array<{
    id: string;
    title: string;
    summary: string;
    documentId: string;
    createdAt: Date;
    document: {
      fileName: string;
    };
  }>;
  actionItems: Array<{
    id: string;
    title: string;
    owner: string | null;
    status: string;
    documentId: string;
    createdAt: Date;
    document: {
      fileName: string;
    };
  }>;
  openQuestions: Array<{
    id: string;
    question: string;
    owner: string | null;
    documentId: string;
    createdAt: Date;
    document: {
      fileName: string;
    };
  }>;
  risks: Array<{
    id: string;
    title: string;
    severity: string;
    documentId: string;
    createdAt: Date;
    document: {
      fileName: string;
    };
  }>;
  askRuns: Array<{
    id: string;
    question: string;
    latencyMs: number;
    createdAt: Date;
  }>;
  evalRuns: Array<{
    id: string;
    sourceMatch: boolean;
    groundednessScore: number;
    createdAt: Date;
    evalCase: {
      question: string;
    };
  }>;
}): ProjectActivityDto[] {
  const documentActivities = input.documents.map((document) => ({
    id: `document-${document.id}`,
    type: "document" as const,
    label: "文档",
    title: document.fileName,
    description:
      document.status === "FAILED"
        ? document.errorMessage ?? "文档摄取失败。"
        : `摄取状态：${formatDocumentStatus(document.status)}`,
    timestamp: document.updatedAt.toISOString(),
    href: `/projects/${input.projectId}/documents/${document.id}`
  }));
  const memoryActivities: ProjectActivityDto[] = [
    ...input.decisions.map((decision) => ({
      id: `decision-${decision.id}`,
      type: "decision" as const,
      label: "决策",
      title: decision.title,
      description: `${decision.summary} 来源：${decision.document.fileName}`,
      timestamp: decision.createdAt.toISOString(),
      href: `/projects/${input.projectId}/documents/${decision.documentId}#memories`
    })),
    ...input.actionItems.map((actionItem) => ({
      id: `action-${actionItem.id}`,
      type: "action_item" as const,
      label: "行动项",
      title: actionItem.title,
      description: `${formatActionStatus(actionItem.status)} · 负责人：${
        actionItem.owner ?? "未分配"
      } · 来源：${actionItem.document.fileName}`,
      timestamp: actionItem.createdAt.toISOString(),
      href: `/projects/${input.projectId}/documents/${actionItem.documentId}#memories`
    })),
    ...input.openQuestions.map((openQuestion) => ({
      id: `question-${openQuestion.id}`,
      type: "open_question" as const,
      label: "待解问题",
      title: openQuestion.question,
      description: `负责人：${openQuestion.owner ?? "未分配"} · 来源：${
        openQuestion.document.fileName
      }`,
      timestamp: openQuestion.createdAt.toISOString(),
      href: `/projects/${input.projectId}/documents/${openQuestion.documentId}#memories`
    })),
    ...input.risks.map((risk) => ({
      id: `risk-${risk.id}`,
      type: "risk" as const,
      label: "风险",
      title: risk.title,
      description: `严重程度：${formatRiskSeverity(risk.severity)} · 来源：${
        risk.document.fileName
      }`,
      timestamp: risk.createdAt.toISOString(),
      href: `/projects/${input.projectId}/documents/${risk.documentId}#memories`
    }))
  ];
  const askActivities = input.askRuns.map((run) => ({
    id: `ask-${run.id}`,
    type: "ask" as const,
    label: "问答",
    title: run.question,
    description: `生成结构化回答，用时 ${run.latencyMs} ms。`,
    timestamp: run.createdAt.toISOString(),
    href: `/projects/${input.projectId}/ask`
  }));
  const evalActivities = input.evalRuns.map((run) => ({
    id: `eval-${run.id}`,
    type: "eval" as const,
    label: "评估",
    title: run.evalCase.question,
    description: `${run.sourceMatch ? "来源命中" : "来源缺失"} · 依据分 ${
      run.groundednessScore
    }/5`,
    timestamp: run.createdAt.toISOString(),
    href: `/projects/${input.projectId}/eval`
  }));

  return [
    ...documentActivities,
    ...memoryActivities,
    ...askActivities,
    ...evalActivities
  ]
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    )
    .slice(0, PROJECT_ACTIVITY_LIMIT);
}

function formatDocumentStatus(status: DocumentStatus) {
  const labels: Record<DocumentStatus, string> = {
    PROCESSING: "处理中",
    READY: "可用",
    FAILED: "失败"
  };

  return labels[status];
}

function formatActionStatus(status: string) {
  const labels: Record<string, string> = {
    OPEN: "未开始",
    IN_PROGRESS: "进行中",
    DONE: "已完成"
  };

  return labels[status] ?? status;
}

function formatRiskSeverity(severity: string) {
  const labels: Record<string, string> = {
    LOW: "低",
    MEDIUM: "中",
    HIGH: "高"
  };

  return labels[severity] ?? severity;
}
