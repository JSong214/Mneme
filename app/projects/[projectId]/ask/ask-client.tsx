"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  FileText,
  HelpCircle,
  LoaderCircle,
  MessageSquareText,
  Quote,
  Send,
  Sparkles,
  TableProperties,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MAX_ASK_QUESTION_LENGTH } from "@/lib/ask/constants";
import type { AskConfidence } from "@/lib/ask/schemas";
import type { AskRunDto } from "@/lib/ask/types";

type AskClientProps = {
  projectId: string;
  projectName: string;
  initialRuns: AskRunDto[];
};

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

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const confidenceStyles: Record<AskConfidence, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-red-200 bg-red-50 text-red-700",
};

const confidenceLabels: Record<AskConfidence, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function AskClient({
  projectId,
  projectName,
  initialRuns,
}: AskClientProps) {
  const router = useRouter();
  const [runs, setRuns] = useState(initialRuns);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(
    initialRuns[0]?.id ?? null,
  );
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-3">
            <p className="text-sm font-semibold text-teal-700">{projectName}</p>
            <h1 className="text-4xl font-semibold tracking-normal text-ink">
              问答
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              基于文档片段和结构化项目记忆回答问题。
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700">
            <MessageSquareText
              aria-hidden="true"
              size={18}
              className="text-teal-600"
            />
            {runs.length} 次问答
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-line bg-white p-5 shadow-soft"
        >
          <div className="space-y-3">
            <label
              htmlFor="ask-question"
              className="text-sm font-medium text-ink"
            >
              项目问题
            </label>
            <textarea
              id="ask-question"
              value={question}
              maxLength={MAX_ASK_QUESTION_LENGTH}
              onChange={(event) => setQuestion(event.currentTarget.value)}
              disabled={isSubmitting}
              rows={5}
              className="block min-h-32 w-full resize-y rounded-lg border border-line bg-white px-3 py-3 text-sm leading-6 text-ink focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="例如：为什么团队选择分层定价，而不是基于使用量进行定价？"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {question.length}/{MAX_ASK_QUESTION_LENGTH}
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? (
                  <LoaderCircle
                    aria-hidden="true"
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Send aria-hidden="true" size={18} />
                )}
                {isSubmitting ? "生成中..." : "提问"}
              </button>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </form>

        {selectedRun ? <AnswerPanel run={selectedRun} /> : <EmptyAskState />}
      </section>

      <aside className="h-fit min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Clock3 aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-normal text-ink">
              最近问答
            </h2>
            <p className="text-sm text-slate-500">最多显示 10 条记录</p>
          </div>
        </div>

        {runs.length > 0 ? (
          <div className="mt-5 grid gap-2">
            {runs.map((run) => {
              const isSelected = run.id === selectedRun?.id;

              return (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => setSelectedRunId(run.id)}
                  className={`min-w-0 rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                    isSelected
                      ? "border-teal-300 bg-teal-50"
                      : "border-line bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="line-clamp-2 text-sm font-semibold leading-6 text-ink">
                    {run.question}
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span
                      className={`rounded-lg border px-2 py-1 font-semibold ${confidenceStyles[run.answer.confidence]}`}
                    >
                      置信度 {confidenceLabels[run.answer.confidence]}
                    </span>
                    <span>{formatDateTime(run.createdAt)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 rounded-lg border border-dashed border-line bg-slate-50 px-3 py-6 text-center text-sm leading-6 text-slate-600">
            暂无问答记录。
          </p>
        )}
      </aside>
    </div>
  );
}

function AnswerPanel({ run }: { run: AskRunDto }) {
  const answer = run.answer;
  const hasRelated = Object.values(answer.related).some(
    (items) => items.length > 0,
  );

  return (
    <article className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
              <Sparkles aria-hidden="true" size={20} />
            </span>
            <div className="min-w-0 space-y-2">
              <p className="text-xl font-semibold text-teal-700 ">
                {run.question}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm lg:max-w-64 lg:flex-col lg:items-end">
          <span
            className={`inline-flex items-center gap-2 rounded-lg border px-2 py-1 font-semibold ${confidenceStyles[answer.confidence]}`}
          >
            <CheckCircle2 aria-hidden="true" size={15} />
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
        <h2 className="text-2xl font-semibold tracking-normal text-ink">
          回答
        </h2>
        <p className="whitespace-pre-wrap text-base leading-8 text-slate-700">
          {answer.answer}
        </p>
      </div>

      {answer.evidence.length > 0 ? (
        <section className="mt-6 space-y-3">
          <SectionTitle icon={Quote} label="证据" />
          <div className="grid gap-3">
            {answer.evidence.map((evidence, index) => (
              <div
                key={`${evidence.file}-${index}`}
                className="rounded-lg border border-line bg-slate-50 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
                  <MetaPill icon={FileText} label={evidence.file} />
                  {evidence.date ? (
                    <MetaPill icon={Clock3} label={evidence.date} />
                  ) : null}
                </div>
                <p className="mt-3 break-words text-sm leading-6 text-slate-700">
                  {evidence.quote}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {evidence.relevance}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {answer.missingInfo.length > 0 ? (
        <section className="mt-6 space-y-3">
          <SectionTitle icon={HelpCircle} label="缺失信息" />
          <ul className="grid gap-2">
            {answer.missingInfo.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasRelated ? (
        <section className="mt-6 space-y-3">
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

function RelatedGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 px-3 py-3">
      <p className="text-sm font-semibold text-ink">{label}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <li key={item} className="text-sm leading-6 text-slate-600">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">无</p>
      )}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <h3 className="inline-flex items-center gap-2 text-base font-semibold tracking-normal text-ink">
      <Icon aria-hidden="true" size={18} className="text-teal-600" />
      {label}
    </h3>
  );
}

function MetaPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-600">
      <Icon aria-hidden="true" size={15} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function EmptyAskState() {
  return (
    <section className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center shadow-soft">
      <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <MessageSquareText aria-hidden="true" size={24} strokeWidth={2} />
      </div>
      <h2 className="text-xl font-semibold tracking-normal text-ink">
        暂无问答
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        上传并完成文档摄取后，即可向项目记忆提问。
      </p>
    </section>
  );
}

function toUserFacingError(code: string, fallbackMessage: string) {
  if (code === "ASK_UNAVAILABLE") {
    return "请先上传文档并等待摄取完成，再进行提问。";
  }

  if (code === "VALIDATION_ERROR") {
    return "请输入一个有效的问题。";
  }

  return fallbackMessage || "无法回答该问题。";
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
