import { listProjectAskRuns } from "@/lib/ask/service";
import { buildProjectBriefSummary, type ProjectBriefDto } from "@/lib/brief/types";
import { listProjectDocuments } from "@/lib/documents/service";
import { listProjectEval } from "@/lib/eval/service";
import { listProjectMemories } from "@/lib/memories/service";
import { getProjectOverview } from "@/lib/projects/service";
import type { ProjectDocumentsDto } from "@/lib/documents/types";
import type { ProjectEvalDto } from "@/lib/eval/types";
import type { ProjectMemoriesDto } from "@/lib/memories/types";
import type { ProjectOverviewDto } from "@/lib/projects/types";
import type { ProjectAskRunsDto } from "@/lib/ask/types";

const BRIEF_ITEM_LIMIT = 8;
const RECENT_ASK_LIMIT = 5;

// 生成可复制/可下载的项目简报，用于 onboarding 或作品集演示交付物。
export async function getProjectBrief(
  projectId: string
): Promise<ProjectBriefDto | null> {
  const [overview, documents, memories, askRuns, evalResult] = await Promise.all([
    getProjectOverview(projectId),
    listProjectDocuments(projectId),
    listProjectMemories(projectId),
    listProjectAskRuns(projectId),
    listProjectEval(projectId)
  ]);

  if (!overview || !documents || !memories || !askRuns || !evalResult) {
    return null;
  }

  const generatedAt = new Date().toISOString();

  return {
    project: overview.project,
    generatedAt,
    summary: buildProjectBriefSummary(overview),
    markdown: buildBriefMarkdown({
      overview,
      documents,
      memories,
      askRuns,
      evalResult,
      generatedAt
    })
  };
}

function buildBriefMarkdown(input: {
  overview: ProjectOverviewDto;
  documents: ProjectDocumentsDto;
  memories: ProjectMemoriesDto;
  askRuns: ProjectAskRunsDto;
  evalResult: ProjectEvalDto;
  generatedAt: string;
}) {
  const { overview, documents, memories, askRuns, evalResult, generatedAt } = input;
  const { project } = overview;
  const lines = [
    `# ${project.name} 项目简报`,
    "",
    `生成时间：${formatDateTime(generatedAt)}`,
    "",
    "## 项目背景",
    normalizeParagraph(project.description ?? "暂无项目简介。"),
    "",
    "## 当前状态",
    `- 文档：${overview.documents.ready}/${overview.documents.total} 个可用，${overview.documents.failed} 个失败。`,
    `- 可检索片段：${overview.chunks.total} 个。`,
    `- 结构化记忆：${overview.memories.total} 条，包括 ${overview.memories.decisions} 个决策、${overview.memories.actionItems} 个行动项、${overview.memories.openQuestions} 个待解问题、${overview.memories.risks} 个风险。`,
    `- Ask：${overview.ask.totalRuns} 次问答。`,
    `- Eval：${overview.eval.casesWithRuns}/${overview.eval.totalCases} 个用例已运行，平均依据分 ${overview.eval.averageGroundednessScore ?? "未评估"}。`,
    "",
    "## 关键决策",
    ...formatDecisionSection(memories),
    "",
    "## 行动项",
    ...formatActionItemSection(memories),
    "",
    "## 待解问题",
    ...formatOpenQuestionSection(memories),
    "",
    "## 风险与缓解",
    ...formatRiskSection(memories),
    "",
    "## 来源文档",
    ...formatDocumentSection(documents),
    "",
    "## 质量摘要",
    ...formatEvalSection(evalResult),
    "",
    "## 最近问答",
    ...formatAskSection(askRuns),
    "",
    "## 建议使用方式",
    "- 新成员 onboarding：先读项目背景和关键决策，再进入来源文档核验细节。",
    "- 项目复盘：优先检查待解问题、风险和 Eval 缺失来源。",
    "- 简历展示：用该简报说明系统不只是 document chatbot，而是带来源、结构化记忆和质量闭环的 project memory system。"
  ];

  return lines.join("\n");
}

function formatDecisionSection({ memories }: ProjectMemoriesDto) {
  if (memories.decisions.length === 0) {
    return ["暂无关键决策。"];
  }

  return memories.decisions.slice(0, BRIEF_ITEM_LIMIT).map((decision) =>
    [
      `- ${decision.title}`,
      `  - 摘要：${normalizeInline(decision.summary)}`,
      decision.rationale ? `  - 理由：${normalizeInline(decision.rationale)}` : null,
      `  - 来源：${decision.document.fileName}`,
      `  - Quote：${normalizeInline(decision.sourceQuote)}`
    ]
      .filter(Boolean)
      .join("\n")
  );
}

function formatActionItemSection({ memories }: ProjectMemoriesDto) {
  if (memories.actionItems.length === 0) {
    return ["暂无行动项。"];
  }

  return memories.actionItems.slice(0, BRIEF_ITEM_LIMIT).map((actionItem) =>
    [
      `- ${actionItem.title}`,
      `  - 描述：${normalizeInline(actionItem.description)}`,
      `  - 负责人：${actionItem.owner ?? "未分配"}`,
      `  - 状态：${actionItem.status}`,
      `  - 截止：${formatNullableDate(actionItem.dueDate)}`,
      `  - 来源：${actionItem.document.fileName}`
    ].join("\n")
  );
}

function formatOpenQuestionSection({ memories }: ProjectMemoriesDto) {
  if (memories.openQuestions.length === 0) {
    return ["暂无待解问题。"];
  }

  return memories.openQuestions.slice(0, BRIEF_ITEM_LIMIT).map((question) =>
    [
      `- ${question.question}`,
      `  - 背景：${normalizeInline(question.context)}`,
      `  - 负责人：${question.owner ?? "未分配"}`,
      `  - 来源：${question.document.fileName}`
    ].join("\n")
  );
}

function formatRiskSection({ memories }: ProjectMemoriesDto) {
  if (memories.risks.length === 0) {
    return ["暂无风险记录。"];
  }

  return memories.risks.slice(0, BRIEF_ITEM_LIMIT).map((risk) =>
    [
      `- ${risk.title}`,
      `  - 严重程度：${risk.severity}`,
      `  - 描述：${normalizeInline(risk.description)}`,
      risk.mitigation ? `  - 缓解：${normalizeInline(risk.mitigation)}` : null,
      `  - 来源：${risk.document.fileName}`
    ]
      .filter(Boolean)
      .join("\n")
  );
}

function formatDocumentSection({ documents }: ProjectDocumentsDto) {
  if (documents.length === 0) {
    return ["暂无来源文档。"];
  }

  return documents.map((document) =>
    `- ${document.fileName}：${document.status}，${document.chunkCount} chunks，${document.extractedMemoryCount} 条记忆。`
  );
}

function formatEvalSection(evalResult: ProjectEvalDto) {
  if (evalResult.cases.length === 0) {
    return ["暂无 Eval 用例。"];
  }

  const summary = evalResult.summary;
  const lines = [
    `- 用例数量：${summary.totalCases}`,
    `- 已运行：${summary.casesWithRuns}`,
    `- 来源命中：${summary.sourceMatches}`,
    `- 来源缺失：${summary.sourceMisses}`,
    `- 平均依据分：${summary.averageGroundednessScore ?? "未评估"}`
  ];
  const missingCases = evalResult.cases.filter(
    (evalCase) =>
      evalCase.latestRun &&
      evalCase.latestRun.diagnostics.missingExpectedSources.length > 0
  );

  if (missingCases.length > 0) {
    lines.push("", "### 需要关注的缺失来源");
    missingCases.slice(0, BRIEF_ITEM_LIMIT).forEach((evalCase) => {
      lines.push(
        `- ${evalCase.question}：${evalCase.latestRun?.diagnostics.missingExpectedSources.join("、")}`
      );
    });
  }

  return lines;
}

function formatAskSection({ runs }: ProjectAskRunsDto) {
  if (runs.length === 0) {
    return ["暂无 Ask 历史。"];
  }

  return runs.slice(0, RECENT_ASK_LIMIT).map((run) =>
    [
      `- ${run.question}`,
      `  - 置信度：${run.answer.confidence}`,
      `  - 回答：${normalizeInline(run.answer.answer)}`,
      `  - 时间：${formatDateTime(run.createdAt)}`
    ].join("\n")
  );
}

function normalizeParagraph(value: string) {
  return value.trim().replace(/\n{3,}/g, "\n\n");
}

function normalizeInline(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function formatNullableDate(value: string | null) {
  return value ? formatDateTime(value) : "未记录";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
