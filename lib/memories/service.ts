import { prisma } from "@/lib/db/prisma";
import {
  buildMemorySummary,
  toActionItemMemoryDto,
  toDecisionMemoryDto,
  toOpenQuestionMemoryDto,
  toRiskMemoryDto,
  type ProjectMemoriesDto
} from "@/lib/memories/types";

const memoryDocumentSelect = {
  id: true,
  fileName: true
} as const;

export async function listProjectMemories(
  projectId: string
): Promise<ProjectMemoriesDto | null> {
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

  const [decisions, actionItems, openQuestions, risks] =
    await prisma.$transaction([
      prisma.decision.findMany({
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
        ]
      }),
      prisma.actionItem.findMany({
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
        }
      }),
      prisma.openQuestion.findMany({
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
        }
      }),
      prisma.risk.findMany({
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
        ]
      })
    ]);

  const memories = {
    decisions: decisions.map(toDecisionMemoryDto),
    actionItems: actionItems.map(toActionItemMemoryDto),
    openQuestions: openQuestions.map(toOpenQuestionMemoryDto),
    risks: risks.map(toRiskMemoryDto)
  };

  return {
    memories,
    summary: buildMemorySummary(memories)
  };
}
