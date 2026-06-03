"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileSearch,
  Gauge,
  LoaderCircle,
  Play,
  Plus,
  Quote,
  Radar,
  Target,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  MAX_EVAL_CASE_QUESTION_LENGTH,
  MAX_EVAL_LIST_ITEM_LENGTH,
} from "@/lib/eval/constants";
import type {
  EvalCaseDto,
  EvalRunDto,
  EvalRunMutationDto,
  EvalSummaryDto,
} from "@/lib/eval/types";

type EvalClientProps = {
  projectId: string;
  projectName: string;
  initialCases: EvalCaseDto[];
  initialSummary: EvalSummaryDto;
};

type ApiEvalCaseResponse =
  | {
      case: EvalCaseDto;
      summary: EvalSummaryDto;
    }
  | ApiErrorResponse;

type ApiEvalRunResponse = EvalRunMutationDto | ApiErrorResponse;

type ApiErrorResponse = {
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

const confidenceLabels = {
  high: "高",
  medium: "中",
  low: "低",
} as const;

const confidenceStyles = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-red-200 bg-red-50 text-red-700",
} as const;

export function EvalClient({
  projectId,
  projectName,
  initialCases,
  initialSummary,
}: EvalClientProps) {
  const router = useRouter();
  const [cases, setCases] = useState(initialCases);
  const [summary, setSummary] = useState(initialSummary);
  const [question, setQuestion] = useState("");
  const [expectedSources, setExpectedSources] = useState("");
  const [expectedFacts, setExpectedFacts] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningCaseId, setRunningCaseId] = useState<string | null>(null);

  async function handleCreateCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const sourceItems = parseTextList(expectedSources);
    const factItems = parseTextList(expectedFacts);
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("请输入 eval question。");
      return;
    }

    if (sourceItems.length === 0 || factItems.length === 0) {
      setError("来源和预期事实至少各填写一项。");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/eval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmedQuestion,
          expectedSources: sourceItems,
          expectedFacts: factItems,
        }),
      });
      const payload = (await response.json()) as ApiEvalCaseResponse;

      if (!response.ok || "error" in payload) {
        setError(
          "error" in payload
            ? toUserFacingError(payload.error.code, payload.error.message)
            : "无法创建 eval case。",
        );
        return;
      }

      setCases((currentCases) => [payload.case, ...currentCases]);
      setSummary(payload.summary);
      setQuestion("");
      setExpectedSources("");
      setExpectedFacts("");
      router.refresh();
    } catch {
      setError("无法创建 eval case。");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRunCase(evalCaseId: string) {
    setError(null);
    setRunningCaseId(evalCaseId);

    try {
      const payload = await requestEvalRun({ evalCaseId });

      applyEvalRuns(payload.runs, payload.summary);
      router.refresh();
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : "无法运行 eval。",
      );
    } finally {
      setRunningCaseId(null);
    }
  }

  async function handleRunAll() {
    setError(null);
    setIsRunningAll(true);

    try {
      const payload = await requestEvalRun({});

      applyEvalRuns(payload.runs, payload.summary);
      router.refresh();
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : "无法运行 eval。",
      );
    } finally {
      setIsRunningAll(false);
    }
  }

  async function requestEvalRun(body: { evalCaseId?: string }) {
    const response = await fetch(`/api/projects/${projectId}/eval/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as ApiEvalRunResponse;

    if (!response.ok || "error" in payload) {
      throw new Error(
        "error" in payload
          ? toUserFacingError(payload.error.code, payload.error.message)
          : "无法运行 eval。",
      );
    }

    return payload;
  }

  function applyEvalRuns(runs: EvalRunDto[], nextSummary: EvalSummaryDto) {
    const runsByCaseId = new Map(runs.map((run) => [run.evalCaseId, run]));

    setCases((currentCases) =>
      currentCases.map((evalCase) => {
        const latestRun = runsByCaseId.get(evalCase.id);

        return latestRun ? { ...evalCase, latestRun } : evalCase;
      }),
    );
    setSummary(nextSummary);
  }

  const summaryItems = [
    {
      label: "用例",
      value: summary.totalCases,
      icon: Radar,
      className: "border-teal-200 bg-teal-50 text-teal-700",
    },
    {
      label: "已运行",
      value: summary.casesWithRuns,
      icon: Play,
      className: "border-sky-200 bg-sky-50 text-sky-700",
    },
    {
      label: "来源命中",
      value: summary.sourceMatches,
      icon: BadgeCheck,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      label: "平均依据分",
      value: summary.averageGroundednessScore ?? "未记录",
      icon: Gauge,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-3">
            <p className="text-sm font-semibold text-teal-700">{projectName}</p>
            <h1 className="text-4xl font-semibold tracking-normal text-ink">
              评估
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              固定问题集用于检查系统能不能找到正确依据，并基于依据回答问题。
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunAll}
            disabled={isRunningAll || cases.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isRunningAll ? (
              <LoaderCircle
                aria-hidden="true"
                size={18}
                className="animate-spin"
              />
            ) : (
              <Play aria-hidden="true" size={18} />
            )}
            {isRunningAll ? "运行中..." : "运行全部"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={`rounded-lg border p-4 shadow-soft ${item.className}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{item.label}</span>
                  <Icon aria-hidden="true" size={18} />
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-normal">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {summary.latestRunAt ? (
          <p className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-600 shadow-soft">
            <Clock3 aria-hidden="true" size={16} className="text-teal-600" />
            最近运行：{formatDateTime(summary.latestRunAt)}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        {cases.length > 0 ? (
          <div className="grid gap-4">
            {cases.map((evalCase) => (
              <EvalCaseCard
                key={evalCase.id}
                evalCase={evalCase}
                isRunning={runningCaseId === evalCase.id}
                onRun={() => handleRunCase(evalCase.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyEvalState />
        )}
      </section>

      <aside className="h-fit min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft">
        <form onSubmit={handleCreateCase} className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-ink text-white">
              <Plus aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-normal text-ink">
                新增用例
              </h2>
              <p className="text-sm text-slate-500">每行一个 来源 或 事实</p>
            </div>
          </div>

          <LabeledTextarea
            id="eval-question"
            label="评估问题"
            value={question}
            rows={5}
            maxLength={MAX_EVAL_CASE_QUESTION_LENGTH}
            placeholder="例如：为什么不用按量计费？"
            disabled={isCreating}
            onChange={setQuestion}
          />

          <LabeledTextarea
            id="eval-sources"
            label="来源"
            value={expectedSources}
            rows={4}
            placeholder="(产品名称)定价会议记录.md"
            disabled={isCreating}
            onChange={setExpectedSources}
          />

          <LabeledTextarea
            id="eval-facts"
            label="预期事实"
            value={expectedFacts}
            rows={5}
            placeholder="用户觉得按量计费不够透明"
            disabled={isCreating}
            onChange={setExpectedFacts}
          />

          <p className="text-xs leading-5 text-slate-500">
            单项最多 {MAX_EVAL_LIST_ITEM_LENGTH} 个字符。
          </p>

          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isCreating ? (
              <LoaderCircle
                aria-hidden="true"
                size={18}
                className="animate-spin"
              />
            ) : (
              <Plus aria-hidden="true" size={18} />
            )}
            {isCreating ? "创建中..." : "创建用例"}
          </button>
        </form>
      </aside>
    </div>
  );
}

function EvalCaseCard({
  evalCase,
  isRunning,
  onRun,
}: {
  evalCase: EvalCaseDto;
  isRunning: boolean;
  onRun: () => void;
}) {
  const latestRun = evalCase.latestRun;

  return (
    <article className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Target aria-hidden="true" size={20} />
            </span>
            <div className="min-w-0 space-y-2">
              <h2 className="break-words text-lg font-semibold tracking-normal text-ink">
                {evalCase.question}
              </h2>
              <p className="text-sm text-slate-500">
                创建于 {formatDateTime(evalCase.createdAt)}
              </p>
            </div>
          </div>

          <ExpectedList label="来源" items={evalCase.expectedSources} />
          <ExpectedList label="预期事实" items={evalCase.expectedFacts} />
        </div>

        <div className="flex flex-wrap gap-2 text-sm lg:max-w-64 lg:flex-col lg:items-end">
          {latestRun ? (
            <>
              <SourceMatchPill sourceMatch={latestRun.sourceMatch} />
              <MetaPill
                icon={Gauge}
                label={`${latestRun.groundednessScore}/5`}
              />
              <MetaPill icon={Clock3} label={`${latestRun.latencyMs} ms`} />
            </>
          ) : (
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-600">
              未运行
            </span>
          )}
          <button
            type="button"
            onClick={onRun}
            disabled={isRunning}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isRunning ? (
              <LoaderCircle
                aria-hidden="true"
                size={16}
                className="animate-spin"
              />
            ) : (
              <Play aria-hidden="true" size={16} />
            )}
            {isRunning ? "运行中" : "运行"}
          </button>
        </div>
      </div>

      {latestRun ? <EvalRunPanel run={latestRun} /> : null}
    </article>
  );
}

function EvalRunPanel({ run }: { run: EvalRunDto }) {
  return (
    <section className="mt-5 space-y-4 border-t border-line pt-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ResultStat
          icon={run.sourceMatch ? CheckCircle2 : XCircle}
          label="来源"
          value={run.sourceMatch ? "通过" : "未通过"}
          className={
            run.sourceMatch
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }
        />
        <ResultStat
          icon={Gauge}
          label="依据充分性"
          value={`${run.groundednessScore}/5`}
          className="border-amber-200 bg-amber-50 text-amber-700"
        />
        <ResultStat
          icon={BadgeCheck}
          label="可信度"
          value={confidenceLabels[run.answer.confidence]}
          className={confidenceStyles[run.answer.confidence]}
        />
        <ResultStat
          icon={BarChart3}
          label="Token usage"
          value={formatTokenUsage(run.tokenUsage)}
          className="border-slate-200 bg-slate-50 text-slate-700"
        />
      </div>

      <div className="space-y-3">
        <SectionTitle icon={Quote} label="回答" />
        <div className="rounded-lg border border-line bg-slate-50 px-4 py-3">
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {run.answer.answer}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <SectionTitle icon={FileSearch} label="检索来源" />
        {run.retrievedSources.length > 0 ? (
          <div className="grid gap-3">
            {run.retrievedSources.map((source) => (
              <div
                key={source.chunkId}
                className="rounded-lg border border-line bg-slate-50 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
                  <MetaPill icon={FileSearch} label={source.fileName} />
                  <MetaPill
                    icon={Target}
                    label={`chunk ${source.chunkIndex}`}
                  />
                  <MetaPill
                    icon={Gauge}
                    label={`distance ${source.distance.toFixed(4)}`}
                  />
                </div>
                <p className="mt-3 break-words text-sm leading-6 text-slate-700">
                  {source.quote}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-line bg-white px-3 py-6 text-center text-sm text-slate-600">
            未检索到来源。
          </p>
        )}
      </div>
    </section>
  );
}

function ExpectedList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResultStat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  className: string;
}) {
  return (
    <div className={`rounded-lg border p-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{label}</span>
        <Icon aria-hidden="true" size={16} />
      </div>
      <p className="mt-2 text-lg font-semibold tracking-normal">{value}</p>
    </div>
  );
}

function SourceMatchPill({ sourceMatch }: { sourceMatch: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-2 py-1 font-semibold ${
        sourceMatch
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {sourceMatch ? (
        <CheckCircle2 aria-hidden="true" size={15} />
      ) : (
        <XCircle aria-hidden="true" size={15} />
      )}
      {sourceMatch ? "来源命中" : "来源缺失"}
    </span>
  );
}

function LabeledTextarea({
  id,
  label,
  value,
  rows,
  maxLength,
  placeholder,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  rows: number;
  maxLength?: number;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="block w-full resize-y rounded-lg border border-line bg-white px-3 py-3 text-sm leading-6 text-ink focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
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

function EmptyEvalState() {
  return (
    <section className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center shadow-soft">
      <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Radar aria-hidden="true" size={24} strokeWidth={2} />
      </div>
      <h2 className="text-xl font-semibold tracking-normal text-ink">
        暂无 eval case
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        新增固定问题、expected sources 和 expected facts 后即可运行评估。
      </p>
    </section>
  );
}

function parseTextList(value: string) {
  return [
    ...new Set(
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function toUserFacingError(code: string, fallbackMessage: string) {
  if (code === "EVAL_UNAVAILABLE") {
    return "请先上传文档并等待摄取完成，再运行 eval。";
  }

  if (code === "EVAL_CASE_NOT_FOUND") {
    return "Eval case 不存在。";
  }

  if (code === "VALIDATION_ERROR") {
    return fallbackMessage || "请输入有效的 eval case。";
  }

  return fallbackMessage || "无法处理 eval 请求。";
}

function formatTokenUsage(value: unknown): string {
  if (!value) {
    return "未记录";
  }

  const totalTokens = extractTotalTokens(value);

  return totalTokens ? `${totalTokens} tokens` : "已记录";
}

function extractTotalTokens(value: unknown): number | null {
  if (!isRecord(value)) {
    return null;
  }

  const directTotal = value.total_tokens ?? value.totalTokens;

  if (typeof directTotal === "number" && Number.isFinite(directTotal)) {
    return directTotal;
  }

  const nestedTotals = Object.values(value)
    .map(extractTotalTokens)
    .filter((item): item is number => typeof item === "number");

  return nestedTotals.length > 0
    ? nestedTotals.reduce((total, item) => total + item, 0)
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
