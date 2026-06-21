"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock3,
  ExternalLink,
  FileText,
  Hash,
  HelpCircle,
  LoaderCircle,
  MessageSquareText,
  Quote,
  Send,
  Sparkles,
  TableProperties,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MAX_ASK_QUESTION_LENGTH } from "@/lib/ask/constants";
import type { AskConfidence } from "@/lib/ask/schemas";
import type { AskRunDto, ProjectAskRunsDto } from "@/lib/ask/types";
import type { DocumentDto } from "@/lib/documents/types";

type AskClientProps = {
  projectId: string;
  projectName: string;
  initialRuns: AskRunDto[];
  sourceDocuments: AskSourceDocument[];
};

type AskSourceDocument = Pick<DocumentDto, "id" | "fileName">;

type ApiAskResponse =
  | {
      run: AskRunDto;
    }
  | {
      error: {
        code: string;
        message: string;
      };
    };

type ApiDeleteAskRunResponse =
  | ProjectAskRunsDto
  | {
      error: {
        code: string;
        message: string;
      };
    };

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// 置信度精细小边框样式，去除带彩色背景
const confidenceStyles: Record<AskConfidence, string> = {
  high: "border-black/[0.06] bg-slate-50 text-slate-700",
  medium: "border-black/[0.06] bg-slate-50 text-slate-700",
  low: "border-black/[0.06] bg-slate-50 text-red-600",
};

const confidenceLabels: Record<AskConfidence, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

/**
 * 问答模块客户端组件
 * 支持向项目记忆发起问题、查看生成的结构化回答、检索证据来源、以及浏览最近问答记录。
 */
export function AskClient({
  projectId,
  projectName,
  initialRuns,
  sourceDocuments,
}: AskClientProps) {
  const router = useRouter();
  const [runs, setRuns] = useState(initialRuns);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(
    initialRuns[0]?.id ?? null,
  );
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const selectedRun =
    runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("请输入一个项目问题。");
      return;
    }

    if (trimmedQuestion.length > MAX_ASK_QUESTION_LENGTH) {
      setError(`问题不能超过 ${MAX_ASK_QUESTION_LENGTH} 个字符。`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmedQuestion,
        }),
      });
      const payload = (await response.json()) as ApiAskResponse;

      if (!response.ok || "error" in payload) {
        setError(
          "error" in payload
            ? toUserFacingError(payload.error.code, payload.error.message)
            : "无法回答该问题。",
        );
        return;
      }

      setRuns((currentRuns) =>
        [
          payload.run,
          ...currentRuns.filter((run) => run.id !== payload.run.id),
        ].slice(0, 10),
      );
      setSelectedRunId(payload.run.id);
      setQuestion("");
      router.refresh();
    } catch {
      setError("无法回答该问题。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteRun(run: AskRunDto) {
    setHistoryError(null);

    const confirmed = window.confirm(
      [
        "确定要永久删除这条问答记录吗？",
        `问题：${run.question}`,
        "该操作只删除这次历史记录，不会删除原始文档。"
      ].join("\n\n")
    );

    if (!confirmed) {
      return;
    }

    setDeletingRunId(run.id);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/ask/runs/${run.id}`,
        {
          method: "DELETE"
        }
      );
      const payload = (await response.json()) as ApiDeleteAskRunResponse;

      if (!response.ok || "error" in payload) {
        setHistoryError(
          "error" in payload ? payload.error.message : "无法删除问答记录。"
        );
        return;
      }

      setRuns(payload.runs);
      setSelectedRunId((currentSelectedRunId) => {
        if (currentSelectedRunId === run.id) {
          return payload.runs[0]?.id ?? null;
        }

        return currentSelectedRunId;
      });
      router.refresh();
    } catch {
      setHistoryError("无法删除问答记录。");
    } finally {
      setDeletingRunId(null);
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* 主问答控制与回答结果展示区 */}
      <section className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{projectName}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              问答
            </h1>
            <p className="max-w-2xl text-sm text-slate-500">
              基于文档片段和结构化项目记忆回答问题。
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            <MessageSquareText
              aria-hidden="true"
              size={14}
              className="text-slate-400"
            />
            {runs.length} 次问答
          </div>
        </div>

        {/* 提问输入框 */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-card"
        >
          <div className="space-y-3">
            <label
              htmlFor="ask-question"
              className="text-xs font-semibold text-slate-600"
            >
              项目问题
            </label>
            <textarea
              id="ask-question"
              value={question}
              maxLength={MAX_ASK_QUESTION_LENGTH}
              onChange={(event) => setQuestion(event.currentTarget.value)}
              disabled={isSubmitting}
              rows={4}
              className="block min-h-24 w-full resize-none rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 text-xs leading-5 text-ink outline-none transition-all duration-300 focus:border-black/30 focus:ring-2 focus:ring-black/[0.03] disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="例如：为什么团队选择分层定价，而不是基于使用量进行定价？"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-medium text-slate-400">
                {question.length}/{MAX_ASK_QUESTION_LENGTH}
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-xs font-semibold text-white transition-all duration-300 ease-smooth hover:bg-black/85 focus:outline-none focus:ring-1 focus:ring-black/20 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? (
                  <LoaderCircle
                    aria-hidden="true"
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Send aria-hidden="true" size={14} />
                )}
                {isSubmitting ? "正在生成..." : "发起提问"}
              </button>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </p>
          ) : null}
        </form>

        {/* 回答生成态与结果面板 */}
        {isSubmitting ? (
          <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-card animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <span className="size-8 rounded-lg bg-slate-100 animate-status-pulse shrink-0" />
              <div className="h-4 w-1/3 bg-slate-100 rounded-md" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-slate-100 rounded-md" />
              <div className="h-3 w-5/6 bg-slate-100 rounded-md" />
              <div className="h-3 w-2/3 bg-slate-100 rounded-md" />
            </div>
          </div>
        ) : selectedRun ? (
          <AnswerPanel
            projectId={projectId}
            run={selectedRun}
            sourceDocuments={sourceDocuments}
          />
        ) : (
          <EmptyAskState />
        )}
      </section>

      {/* 右侧最近问答历史记录 */}
      <aside className="h-fit min-w-0 rounded-xl border border-black/[0.06] bg-white p-6 shadow-card space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-slate-50 border border-black/[0.06] text-slate-500">
            <Clock3 aria-hidden="true" size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-ink">
              最近问答
            </h2>
            <p className="text-xs text-slate-400">最多显示 10 条历史记录</p>
          </div>
        </div>

        {historyError ? (
          <p className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600">
            {historyError}
          </p>
        ) : null}

        {runs.length > 0 ? (
          <div className="grid gap-2">
            {runs.map((run) => {
              const isSelected = run.id === selectedRun?.id;

              return (
                <div
                  key={run.id}
                  className={`flex min-w-0 items-start gap-2 rounded-xl border p-2 transition-all duration-300 ease-smooth ${
                    isSelected
                      ? "border-black/20 bg-slate-50"
                      : "border-black/[0.06] bg-white hover:bg-slate-50/70"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedRunId(run.id)}
                    className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left focus:outline-none focus:ring-1 focus:ring-black/20"
                  >
                    <span className="line-clamp-2 text-xs font-semibold leading-5 text-ink">
                      {run.question}
                    </span>
                    <span className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold ${confidenceStyles[run.answer.confidence]}`}
                      >
                        置信度 {confidenceLabels[run.answer.confidence]}
                      </span>
                      <span>{formatDateTime(run.createdAt)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="删除问答记录"
                    onClick={() => handleDeleteRun(run)}
                    disabled={deletingRunId === run.id}
                    className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 transition-all duration-300 hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-200 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    {deletingRunId === run.id ? (
                      <LoaderCircle
                        aria-hidden="true"
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 aria-hidden="true" size={14} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-black/[0.08] bg-slate-50/50 px-3 py-6 text-center text-xs leading-5 text-slate-400">
            暂无历史问答。
          </p>
        )}
      </aside>
    </div>
  );
}

function AnswerPanel({
  projectId,
  run,
  sourceDocuments,
}: {
  projectId: string;
  run: AskRunDto;
  sourceDocuments: AskSourceDocument[];
}) {
  const answer = run.answer;
  const hasRelated = Object.values(answer.related).some(
    (items) => items.length > 0,
  );

  return (
    <article className="min-w-0 rounded-xl border border-black/[0.06] bg-white p-6 shadow-card space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-black/[0.04] pb-5">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
              <Sparkles aria-hidden="true" size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight text-ink leading-7">
                {run.question}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs lg:max-w-64 lg:flex-col lg:items-end font-semibold">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 font-bold ${confidenceStyles[answer.confidence]}`}
          >
            {answer.confidence === "high" && <span className="size-1.5 rounded-full bg-emerald-500" />}
            {answer.confidence === "medium" && <span className="size-1.5 rounded-full bg-amber-500" />}
            {answer.confidence === "low" && <span className="size-1.5 rounded-full bg-red-500" />}
            置信度 {confidenceLabels[answer.confidence]}
          </span>
          <MetaPill icon={Clock3} label={`${run.latencyMs} ms`} />
          <MetaPill
            icon={MessageSquareText}
            label={formatDateTime(run.createdAt)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-ink tracking-tight uppercase">
          回答
        </h2>
        <p className="whitespace-pre-wrap text-sm leading-6 tracking-wide text-slate-600 font-normal">
          {answer.answer}
        </p>
      </div>

      {answer.evidence.length > 0 ? (
        <section className="space-y-3 pt-2">
          <SectionTitle icon={Quote} label="证据来源" />
          <div className="grid gap-3">
            {answer.evidence.map((evidence, index) => (
              <EvidenceCard
                key={`${evidence.file}-${evidence.chunkId ?? index}`}
                evidence={evidence}
                projectId={projectId}
                sourceDocument={findEvidenceSourceDocument(
                  evidence,
                  sourceDocuments,
                )}
              />
            ))}
          </div>
        </section>
      ) : null}

      {answer.missingInfo.length > 0 ? (
        <section className="space-y-3 pt-2">
          <SectionTitle icon={HelpCircle} label="缺失信息" />
          <ul className="grid gap-2">
            {answer.missingInfo.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 rounded-lg border border-black/[0.06] bg-slate-50/50 px-4 py-2.5 text-xs leading-5 text-slate-500"
              >
                <span className="size-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasRelated ? (
        <section className="space-y-3 pt-2">
          <SectionTitle icon={TableProperties} label="相关记忆" />
          <div className="grid gap-3 md:grid-cols-2">
            <RelatedGroup label="决策" items={answer.related.decisions} />
            <RelatedGroup label="行动项" items={answer.related.actionItems} />
            <RelatedGroup
              label="待解问题"
              items={answer.related.openQuestions}
            />
            <RelatedGroup label="风险" items={answer.related.risks} />
          </div>
        </section>
      ) : null}
    </article>
  );
}

function EvidenceCard({
  evidence,
  projectId,
  sourceDocument,
}: {
  evidence: AskRunDto["answer"]["evidence"][number];
  projectId: string;
  sourceDocument?: AskSourceDocument;
}) {
  const hasDeletedSource = Boolean(evidence.documentId && !sourceDocument);
  const sourceDocumentId = hasDeletedSource
    ? null
    : sourceDocument?.id ?? evidence.documentId;
  const chunkIndex = evidence.chunkIndex;
  const hasChunkTarget = typeof chunkIndex === "number";
  const sourceHref = sourceDocumentId
    ? `/projects/${projectId}/documents/${sourceDocumentId}${
        hasChunkTarget ? `#chunk-${chunkIndex}` : ""
      }`
    : null;

  return (
    <div className="rounded-lg border border-black/[0.06] bg-slate-50/30 p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 truncate">
            {evidence.file}
          </span>
          {hasChunkTarget && (
            <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 border border-black/[0.04] px-1 text-xs font-bold text-slate-500">
              <Hash size={9} />
              {chunkIndex}
            </span>
          )}
        </div>
        {hasDeletedSource ? (
          <span className="inline-flex items-center rounded-lg border border-red-100 bg-red-50/60 px-2 py-1 text-xs font-semibold text-red-600">
            来源文档已删除
          </span>
        ) : null}
        {sourceHref && (
          <Link
            href={sourceHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink transition-transform duration-300 hover:translate-x-0.5"
          >
            查看原文
            <ExternalLink size={10} />
          </Link>
        )}
      </div>
      <blockquote className="border-l border-slate-300 pl-3.5 py-0.5 text-xs italic leading-6 text-slate-500">
        “{evidence.quote}”
      </blockquote>
      {evidence.relevance && (
        <p className="text-xs leading-5 text-slate-400">
          <span className="font-bold text-slate-600">相关度解析：</span>
          {evidence.relevance}
        </p>
      )}
    </div>
  );
}

function RelatedGroup({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-black/[0.06] p-4 space-y-2 bg-slate-50/10">
      <h3 className="text-xs font-bold text-slate-700 tracking-wider">
        {label}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-xs leading-5 text-slate-500"
          >
            <span className="size-1 rounded-full bg-slate-400 mt-2 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 border-t border-black/[0.04] pt-4">
      <Icon size={14} className="text-slate-400" />
      <h3 className="text-xs font-bold text-ink uppercase tracking-tight">
        {label}
      </h3>
    </div>
  );
}

function MetaPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.06] bg-slate-50 px-2.5 py-0.5 text-slate-500 font-bold">
      <Icon size={12} />
      {label}
    </span>
  );
}

function EmptyAskState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.08] bg-white px-6 py-12 text-center shadow-card animate-fade-in-up">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-black/[0.06] bg-slate-50 text-slate-500">
        <MessageSquareText aria-hidden="true" size={20} strokeWidth={1.5} />
      </div>
      <h2 className="text-base font-semibold tracking-tight text-ink">
        提问项目记忆
      </h2>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-400">
        在上方文本框中输入一个关于项目的具体问题，基于已上传文档的记忆系统将为您提供精确的回答与来源依据。
      </p>
    </div>
  );
}

function findEvidenceSourceDocument(
  evidence: AskRunDto["answer"]["evidence"][number],
  sourceDocuments: AskSourceDocument[],
) {
  if (evidence.documentId) {
    return sourceDocuments.find((doc) => doc.id === evidence.documentId);
  }

  return sourceDocuments.find(
    (doc) => doc.fileName.toLowerCase() === evidence.file.toLowerCase(),
  );
}

function toUserFacingError(code: string, fallbackMessage: string) {
  if (code === "PROJECT_NOT_READY") {
    return "项目仍在解析文档，请稍候再提问。";
  }

  if (code === "NO_SOURCE_DOCUMENTS") {
    return "请先上传至少一个文档，以便系统为您分析和回答问题。";
  }

  return fallbackMessage || "无法回答该问题。";
}

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "暂无记录";
}
