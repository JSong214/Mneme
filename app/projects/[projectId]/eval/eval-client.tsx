"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Clock3,
  ExternalLink,
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
import {
  retrievalModeLabels,
  type EvalCaseDto,
  type EvalRunDto,
  type EvalRunMutationDto,
  type EvalSummaryDto,
  type RetrievalModeDto,
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

const retrievalModes: RetrievalModeDto[] = ["baseline", "rerank"];

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
  high: "border-black/[0.06] bg-slate-50 text-slate-700",
  medium: "border-black/[0.06] bg-slate-50 text-slate-700",
  low: "border-black/[0.06] bg-slate-50 text-red-600",
} as const;

/**
 * 评估模块客户端组件
 * 支持新增测试用例、按 retrieval mode 运行评估，并查看来源命中诊断。
 */
export function EvalClient({
  projectId,
  projectName,
  initialCases,
  initialSummary,
}: EvalClientProps) {
  const router = useRouter();
  const [cases, setCases] = useState(initialCases);
  const [summary, setSummary] = useState(initialSummary);
  const [retrievalMode, setRetrievalMode] =
    useState<RetrievalModeDto>("baseline");
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
      const payload = await requestEvalRun({ evalCaseId, retrievalMode });

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
      const payload = await requestEvalRun({ retrievalMode });

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

  async function requestEvalRun(body: {
    evalCaseId?: string;
    retrievalMode: RetrievalModeDto;
  }) {
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
        const newRun = runsByCaseId.get(evalCase.id);

        if (!newRun) {
          return evalCase;
        }

        const latestRunsByMode = {
          ...evalCase.latestRunsByMode,
          [newRun.retrievalMode]: newRun,
        };
        const latestRun = pickLatestRun(Object.values(latestRunsByMode));

        return {
          ...evalCase,
          latestRun,
          latestRunsByMode,
        };
      }),
    );
    setSummary(nextSummary);
  }

  const summaryItems = [
    {
      label: "用例",
      value: summary.totalCases,
      icon: Radar,
      className: "border-black/[0.06] bg-white text-ink",
    },
    {
      label: "已运行",
      value: summary.casesWithRuns,
      icon: Play,
      className: "border-black/[0.06] bg-white text-slate-700",
    },
    {
      label: "来源命中",
      value: summary.sourceMatches,
      icon: BadgeCheck,
      className: "border-black/[0.06] bg-white text-slate-700",
    },
    {
      label: "平均依据分",
      value: summary.averageGroundednessScore ?? "未评估",
      icon: Gauge,
      className: "border-black/[0.06] bg-white text-slate-700",
    },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{projectName}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              评估
            </h1>
            <p className="max-w-2xl text-sm text-slate-500">
              固定问题集用于检查系统能不能找到正确依据，并基于依据回答问题。
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <RetrievalModeControl
              value={retrievalMode}
              onChange={setRetrievalMode}
            />
            <button
              type="button"
              onClick={handleRunAll}
              disabled={isRunningAll || cases.length === 0}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-xs font-semibold text-white transition-all duration-300 ease-smooth hover:bg-black/85 focus:outline-none focus:ring-1 focus:ring-black/20 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isRunningAll ? (
                <LoaderCircle
                  aria-hidden="true"
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Play aria-hidden="true" size={14} />
              )}
              {isRunningAll
                ? "运行中..."
                : `运行全部 ${retrievalModeLabels[retrievalMode]}`}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                style={{ animationDelay: `${index * 60}ms` }}
                className={`animate-fade-in-up rounded-xl border p-5 shadow-card ${item.className}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-400">{item.label}</span>
                  <Icon aria-hidden="true" size={14} className="text-slate-400" />
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        <ModeComparison summary={summary} />

        {summary.latestRunAt ? (
          <p className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.06] bg-white px-3 py-1.5 text-xs text-slate-500 shadow-card animate-fade-in-up delay-75">
            <Clock3 aria-hidden="true" size={13} className="text-slate-400" />
            最近运行时间：{formatDateTime(summary.latestRunAt)}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600 animate-fade-in-up">
            {error}
          </p>
        ) : null}

        {cases.length > 0 ? (
          <div className="grid gap-4 animate-fade-in-up delay-150">
            {cases.map((evalCase, index) => (
              <EvalCaseCard
                key={evalCase.id}
                projectId={projectId}
                evalCase={evalCase}
                activeMode={retrievalMode}
                isRunning={runningCaseId === evalCase.id}
                onRun={() => handleRunCase(evalCase.id)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <EmptyEvalState />
        )}
      </section>

      <aside className="h-fit min-w-0 rounded-xl border border-black/[0.06] bg-white p-6 shadow-card">
        <form onSubmit={handleCreateCase} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-ink text-white">
              <Plus aria-hidden="true" size={18} />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-ink">
                新增用例
              </h2>
              <p className="text-xs text-slate-400">单行表示一个来源或预期事实</p>
            </div>
          </div>

          <LabeledTextarea
            id="eval-question"
            label="评估问题"
            value={question}
            rows={3}
            maxLength={MAX_EVAL_CASE_QUESTION_LENGTH}
            placeholder="例如：为什么定价不用按量计费模式？"
            disabled={isCreating}
            onChange={setQuestion}
          />

          <LabeledTextarea
            id="eval-sources"
            label="期望数据来源 (文件名)"
            value={expectedSources}
            rows={3}
            placeholder="pricing-meeting-notes.md"
            disabled={isCreating}
            onChange={setExpectedSources}
          />

          <LabeledTextarea
            id="eval-facts"
            label="预期关键事实"
            value={expectedFacts}
            rows={3}
            placeholder="按量定价对客户而言预测月度账单较为困难"
            disabled={isCreating}
            onChange={setExpectedFacts}
          />

          <p className="text-xs text-slate-400 leading-normal">
            单条内容最大限制为 {MAX_EVAL_LIST_ITEM_LENGTH} 个字符。
          </p>

          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-xs font-semibold text-white transition-all duration-300 ease-smooth hover:bg-black/85 focus:outline-none focus:ring-1 focus:ring-black/20 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isCreating ? (
              <LoaderCircle
                aria-hidden="true"
                size={14}
                className="animate-spin"
              />
            ) : (
              <Plus aria-hidden="true" size={14} />
            )}
            {isCreating ? "创建中..." : "保存用例"}
          </button>
        </form>
      </aside>
    </div>
  );
}

function RetrievalModeControl({
  value,
  onChange,
}: {
  value: RetrievalModeDto;
  onChange: (mode: RetrievalModeDto) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-black/[0.06] bg-white p-1 text-xs font-semibold shadow-card">
      {retrievalModes.map((mode) => {
        const isActive = value === mode;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`rounded-md px-3 py-1.5 transition-all duration-300 ${
              isActive
                ? "bg-ink text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-ink"
            }`}
          >
            {retrievalModeLabels[mode]}
          </button>
        );
      })}
    </div>
  );
}

function ModeComparison({ summary }: { summary: EvalSummaryDto }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 animate-fade-in-up delay-100">
      {retrievalModes.map((mode) => {
        const modeSummary = summary.modeSummaries[mode];

        return (
          <article
            key={mode}
            className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-black/[0.06] bg-slate-50 text-slate-500">
                  <BarChart3 aria-hidden="true" size={14} />
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-ink">
                  {retrievalModeLabels[mode]}
                </h2>
              </div>
              <span className="rounded-lg border border-black/[0.06] bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-500">
                {modeSummary.casesWithRuns}/{modeSummary.totalCases}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <ModeStat label="命中" value={modeSummary.sourceMatches} />
              <ModeStat
                label="依据分"
                value={modeSummary.averageGroundednessScore ?? "未评"}
              />
              <ModeStat
                label="延迟"
                value={
                  modeSummary.averageLatencyMs === null
                    ? "暂无"
                    : `${modeSummary.averageLatencyMs}ms`
                }
              />
            </div>
          </article>
        );
      })}
    </section>
  );
}

function ModeStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-black/[0.04] bg-slate-50/50 px-2 py-2">
      <p className="font-semibold text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-ink">{value}</p>
    </div>
  );
}

function EvalCaseCard({
  projectId,
  evalCase,
  activeMode,
  isRunning,
  onRun,
  index
}: {
  projectId: string;
  evalCase: EvalCaseDto;
  activeMode: RetrievalModeDto;
  isRunning: boolean;
  onRun: () => void;
  index: number;
}) {
  const activeRun = evalCase.latestRunsByMode[activeMode];

  return (
    <article
      style={{ animationDelay: `${index * 50}ms` }}
      className="animate-fade-in-up min-w-0 rounded-xl border border-black/[0.06] bg-white p-6 shadow-card transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-black/20 hover:shadow-premium"
    >
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-black/[0.06] bg-slate-50 text-slate-500">
              <Target aria-hidden="true" size={16} />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="break-words text-base font-semibold tracking-tight text-ink">
                {evalCase.question}
              </h2>
              <p className="text-xs font-medium text-slate-400">
                创建时间：{formatDateTime(evalCase.createdAt)}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <ExpectedList label="目标来源" items={evalCase.expectedSources} />
            <ExpectedList label="预期覆盖事实" items={evalCase.expectedFacts} />
          </div>
          <CaseModeComparison evalCase={evalCase} />
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold lg:max-w-64 lg:flex-col lg:items-end">
          {activeRun ? (
            <>
              <RetrievalModePill mode={activeRun.retrievalMode} />
              <SourceMatchPill run={activeRun} />
              <MetaPill
                icon={Gauge}
                label={`依据分 ${activeRun.groundednessScore}/5`}
              />
              <MetaPill icon={Clock3} label={`${activeRun.latencyMs} ms`} />
            </>
          ) : (
            <span className="rounded-lg border border-black/[0.06] bg-slate-50 px-2.5 py-0.5 font-bold text-slate-500">
              {retrievalModeLabels[activeMode]} 未运行
            </span>
          )}
          <button
            type="button"
            onClick={onRun}
            disabled={isRunning}
            className="inline-flex h-9 w-28 items-center justify-center gap-1 rounded-lg bg-ink px-3 text-xs font-semibold text-white transition-all duration-300 ease-smooth hover:bg-black/85 focus:outline-none focus:ring-1 focus:ring-black/20 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isRunning ? (
              <LoaderCircle
                aria-hidden="true"
                size={12}
                className="animate-spin"
              />
            ) : (
              <Play aria-hidden="true" size={12} />
            )}
            {isRunning ? "进行中" : `运行 ${retrievalModeLabels[activeMode]}`}
          </button>
        </div>
      </div>

      {activeRun ? <EvalRunPanel projectId={projectId} run={activeRun} /> : null}
    </article>
  );
}

function CaseModeComparison({ evalCase }: { evalCase: EvalCaseDto }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {retrievalModes.map((mode) => {
        const run = evalCase.latestRunsByMode[mode];

        return (
          <div
            key={mode}
            className="rounded-lg border border-black/[0.05] bg-slate-50/40 px-3 py-2 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-600">
                {retrievalModeLabels[mode]}
              </span>
              {run ? (
                <span className="font-semibold text-slate-400">
                  {formatDateTime(run.createdAt)}
                </span>
              ) : (
                <span className="font-semibold text-slate-400">未运行</span>
              )}
            </div>
            {run ? (
              <div className="mt-2 flex flex-wrap gap-1.5 font-semibold text-slate-500">
                <span>{run.sourceMatch ? "来源命中" : "来源缺失"}</span>
                <span>依据 {run.groundednessScore}/5</span>
                <span>{run.latencyMs} ms</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function EvalRunPanel({
  projectId,
  run,
}: {
  projectId: string;
  run: EvalRunDto;
}) {
  return (
    <section className="mt-5 space-y-5 border-t border-black/[0.05] pt-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ResultStat
          icon={run.sourceMatch ? CheckCircle2 : XCircle}
          label="来源匹配"
          value={run.sourceMatch ? "通过" : "缺失"}
          className={
            run.sourceMatch
              ? "border-black/[0.06] bg-slate-50 text-emerald-600"
              : "border-black/[0.06] bg-slate-50 text-red-500"
          }
        />
        <ResultStat
          icon={Gauge}
          label="依据充分性"
          value={`${run.groundednessScore} / 5`}
          className="border-black/[0.06] bg-slate-50 text-slate-700"
        />
        <ResultStat
          icon={BadgeCheck}
          label="回答可信度"
          value={confidenceLabels[run.answer.confidence]}
          className={confidenceStyles[run.answer.confidence]}
        />
        <ResultStat
          icon={Radar}
          label="候选片段"
          value={formatRetrievalMetrics(run)}
          className="border-black/[0.06] bg-slate-50 text-slate-500"
        />
      </div>

      <SourceDiagnostics run={run} />

      <div className="space-y-2">
        <SectionTitle icon={Quote} label="生成答案" />
        <div className="rounded-lg border border-black/[0.05] bg-slate-50/30 px-4 py-3">
          <p className="whitespace-pre-wrap text-xs leading-6 text-slate-500 font-normal">
            {run.answer.answer}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle icon={FileSearch} label="检索到的 Chunks" />
        {run.retrievedSources.length > 0 ? (
          <div className="grid gap-3">
            {run.retrievedSources.map((source) => (
              <div
                key={source.chunkId}
                className="rounded-lg border border-black/[0.06] bg-slate-50/20 px-4 py-3.5 space-y-2.5"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <MetaPill icon={FileSearch} label={source.fileName} />
                  <MetaPill
                    icon={Target}
                    label={`chunk ${source.chunkIndex + 1}`}
                  />
                  <MetaPill
                    icon={Gauge}
                    label={`distance ${source.distance.toFixed(4)}`}
                  />
                  {source.matchesExpectedSource ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50/40 px-2.5 py-0.5 font-bold text-emerald-700">
                      <CheckCircle2 aria-hidden="true" size={12} />
                      目标来源
                    </span>
                  ) : null}
                  <Link
                    href={`/projects/${projectId}/documents/${source.documentId}#chunk-${source.chunkIndex}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-black/[0.06] bg-white px-2.5 py-0.5 font-bold text-ink transition-all duration-300 hover:bg-black/[0.02]"
                  >
                    查看片段
                    <ExternalLink aria-hidden="true" size={11} />
                  </Link>
                </div>
                <p className="break-words text-xs leading-5 text-slate-500 italic">
                  “{source.quote}”
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-black/[0.08] bg-slate-50/50 px-3 py-6 text-center text-xs text-slate-400">
            未能检索到任何来源片段。
          </p>
        )}
      </div>
    </section>
  );
}

function SourceDiagnostics({ run }: { run: EvalRunDto }) {
  const missingSources = run.diagnostics.missingExpectedSources;

  return (
    <section className="space-y-3">
      <SectionTitle icon={Target} label="来源诊断" />
      <div className="rounded-lg border border-black/[0.06] bg-white px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {run.diagnostics.expectedSourceCoverage.map((source) => (
            <span
              key={source.source}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${
                source.matched
                  ? "border-emerald-100 bg-emerald-50/40 text-emerald-700"
                  : "border-red-100 bg-red-50/40 text-red-600"
              }`}
            >
              {source.matched ? (
                <CheckCircle2 aria-hidden="true" size={12} />
              ) : (
                <XCircle aria-hidden="true" size={12} />
              )}
              {source.source}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {missingSources.length === 0
            ? "所有 expected sources 都已出现在 retrieved chunks 中。"
            : `缺失来源：${missingSources.join("、")}`}
        </p>
      </div>
    </section>
  );
}

function ExpectedList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-md border border-black/[0.04] bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500"
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
    <div className={`rounded-xl border p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</span>
        <Icon aria-hidden="true" size={13} className="opacity-80" />
      </div>
      <p className="mt-1.5 text-base font-bold tracking-tight">{value}</p>
    </div>
  );
}

function RetrievalModePill({ mode }: { mode: RetrievalModeDto }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.06] bg-slate-50 px-2.5 py-0.5 font-bold text-slate-600">
      <BarChart3 aria-hidden="true" size={12} />
      {retrievalModeLabels[mode]}
    </span>
  );
}

function SourceMatchPill({ run }: { run: EvalRunDto }) {
  const missingCount = run.diagnostics.missingExpectedSources.length;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 font-bold ${
        run.sourceMatch
          ? "border-black/[0.06] bg-slate-50 text-emerald-600"
          : "border-black/[0.06] bg-slate-50 text-red-500"
      }`}
    >
      {run.sourceMatch ? (
        <CheckCircle2 aria-hidden="true" size={12} />
      ) : (
        <XCircle aria-hidden="true" size={12} />
      )}
      {run.sourceMatch ? "来源命中" : `缺 ${missingCount} 个来源`}
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
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-600">
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
        className="block w-full resize-none rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-xs leading-5 text-ink outline-none transition-all duration-300 focus:border-black/30 focus:ring-2 focus:ring-black/[0.03] disabled:cursor-not-allowed disabled:bg-slate-50"
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
    <h3 className="inline-flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-tight">
      <Icon aria-hidden="true" size={13} className="text-slate-400" />
      {label}
    </h3>
  );
}

function MetaPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-black/[0.06] bg-slate-50 px-2.5 py-0.5 font-bold text-slate-500">
      <Icon aria-hidden="true" size={12} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function EmptyEvalState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.08] bg-white px-6 py-12 text-center shadow-card animate-fade-in-up delay-150">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-black/[0.06] bg-slate-50 text-slate-500">
        <Radar aria-hidden="true" size={20} strokeWidth={1.5} />
      </div>
      <h2 className="text-base font-semibold tracking-tight text-ink">
        暂无评估用例
      </h2>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-400">
        在右侧面板新增固定测试问题、期望数据来源及预期事实后，即可一键运行各项评估指标。
      </p>
    </div>
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

function pickLatestRun(runs: Array<EvalRunDto | null>) {
  return (
    runs
      .filter((run): run is EvalRunDto => Boolean(run))
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )[0] ?? null
  );
}

function toUserFacingError(code: string, fallbackMessage: string) {
  if (code === "EVAL_UNAVAILABLE") {
    return "请先上传文档并等待摄取完成，再运行评估。";
  }

  if (code === "EVAL_CASE_NOT_FOUND") {
    return "评估用例不存在。";
  }

  if (code === "VALIDATION_ERROR") {
    return fallbackMessage || "请输入有效的评估用例。";
  }

  return fallbackMessage || "无法处理评估请求。";
}

function formatRetrievalMetrics(run: EvalRunDto): string {
  if (!run.retrievalMetrics) {
    return retrievalModeLabels[run.retrievalMode];
  }

  return `${run.retrievalMetrics.candidateCount} -> ${run.retrievalMetrics.returnedCount}`;
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
