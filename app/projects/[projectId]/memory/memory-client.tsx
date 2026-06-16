"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  FileText,
  Lightbulb,
  Quote,
  ShieldAlert,
  TableProperties,
  UserRound
} from "lucide-react";
import type {
  ActionItemMemoryDto,
  ActionItemStatusDto,
  DecisionMemoryDto,
  MemorySummaryDto,
  OpenQuestionMemoryDto,
  ProjectMemoryGroupsDto,
  RiskMemoryDto,
  RiskSeverityDto
} from "@/lib/memories/types";

type MemoryClientProps = {
  projectName: string;
  initialMemories: ProjectMemoryGroupsDto;
  initialSummary: MemorySummaryDto;
};

const memoryTabs = [
  {
    id: "decisions",
    label: "决策",
    icon: Lightbulb
  },
  {
    id: "actionItems",
    label: "行动项",
    icon: ClipboardList
  },
  {
    id: "openQuestions",
    label: "待解问题",
    icon: CircleHelp
  },
  {
    id: "risks",
    label: "风险",
    icon: ShieldAlert
  }
] as const;

type MemoryTabId = (typeof memoryTabs)[number]["id"];

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

// 精细状态标签，去除带彩色背景
const actionStatusStyles: Record<ActionItemStatusDto, string> = {
  open: "border-black/[0.06] bg-slate-50 text-slate-500",
  in_progress: "border-black/[0.06] bg-slate-50 text-slate-700",
  done: "border-black/[0.06] bg-slate-50 text-emerald-600"
};

const actionStatusLabels: Record<ActionItemStatusDto, string> = {
  open: "未开始",
  in_progress: "进行中",
  done: "已完成"
};

// 精细风险严重度样式，去除带色背景
const riskSeverityStyles: Record<RiskSeverityDto, string> = {
  low: "border-black/[0.06] bg-slate-50 text-emerald-600",
  medium: "border-black/[0.06] bg-slate-50 text-amber-600",
  high: "border-black/[0.06] bg-slate-50 text-red-600"
};

const riskSeverityLabels: Record<RiskSeverityDto, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险"
};

/**
 * 项目记忆模块客户端组件
 * 支持分选项卡（Tab）浏览提取出来的“决策、行动项、待解问题、风险”信息。
 */
export function MemoryClient({
  projectName,
  initialMemories,
  initialSummary
}: MemoryClientProps) {
  const [activeTab, setActiveTab] = useState<MemoryTabId>("decisions");

  const summaryItems = [
    {
      label: "决策",
      value: initialSummary.decisions,
      icon: Lightbulb,
      className: "border-black/[0.06] bg-white text-ink"
    },
    {
      label: "行动项",
      value: initialSummary.actionItems,
      icon: ClipboardList,
      className: "border-black/[0.06] bg-white text-ink"
    },
    {
      label: "待解问题",
      value: initialSummary.openQuestions,
      icon: CircleHelp,
      className: "border-black/[0.06] bg-white text-ink"
    },
    {
      label: "风险",
      value: initialSummary.risks,
      icon: ShieldAlert,
      className: "border-black/[0.06] bg-white text-ink"
    }
  ];

  return (
    <div className="min-w-0 space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{projectName}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            项目记忆
          </h1>
          <p className="max-w-2xl text-sm text-slate-500">
            从已上传文档中提取出的项目上下文。
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
          <TableProperties aria-hidden="true" size={14} className="text-slate-400" />
          {initialSummary.total} 条记忆
        </div>
      </section>

      {/* 顶部指标卡片 */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

      {initialSummary.total > 0 ? (
        <section className="space-y-5">
          {/* Tab 选项卡 */}
          <div
            role="tablist"
            aria-label="记忆类型"
            className="grid gap-1.5 rounded-xl border border-black/[0.06] bg-white p-1.5 shadow-card sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up delay-150"
          >
            {memoryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = initialSummary[tab.id];

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-w-0 items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-left text-xs font-semibold transition-all duration-300 ease-smooth focus:outline-none focus:ring-1 focus:ring-black/20 ${
                    isActive
                      ? "bg-ink text-white shadow-card"
                      : "text-slate-500 hover:bg-slate-50 hover:text-ink"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon aria-hidden="true" size={14} className="shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                      isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 记忆列表展示区，应用 staggered 入场动画 */}
          <div className="animate-fade-in-up delay-200">
            {renderMemoryList(activeTab, initialMemories)}
          </div>
        </section>
      ) : (
        <EmptyMemoryState />
      )}
    </div>
  );
}

function renderMemoryList(
  activeTab: MemoryTabId,
  memories: ProjectMemoryGroupsDto
) {
  if (activeTab === "decisions") {
    return memories.decisions.length > 0 ? (
      <div className="grid gap-4">
        {memories.decisions.map((decision, index) => (
          <DecisionCard key={decision.id} decision={decision} index={index} />
        ))}
      </div>
    ) : (
      <EmptyTabState label="决策" />
    );
  }

  if (activeTab === "actionItems") {
    return memories.actionItems.length > 0 ? (
      <div className="grid gap-4">
        {memories.actionItems.map((actionItem, index) => (
          <ActionItemCard key={actionItem.id} actionItem={actionItem} index={index} />
        ))}
      </div>
    ) : (
      <EmptyTabState label="行动项" />
    );
  }

  if (activeTab === "openQuestions") {
    return memories.openQuestions.length > 0 ? (
      <div className="grid gap-4">
        {memories.openQuestions.map((openQuestion, index) => (
          <OpenQuestionCard
            key={openQuestion.id}
            openQuestion={openQuestion}
            index={index}
          />
        ))}
      </div>
    ) : (
      <EmptyTabState label="待解问题" />
    );
  }

  return memories.risks.length > 0 ? (
    <div className="grid gap-4">
      {memories.risks.map((risk, index) => (
        <RiskCard key={risk.id} risk={risk} index={index} />
      ))}
    </div>
  ) : (
    <EmptyTabState label="风险" />
  );
}

function DecisionCard({ decision, index }: { decision: DecisionMemoryDto; index: number }) {
  return (
    <article
      style={{ animationDelay: `${index * 50}ms` }}
      className="animate-fade-in-up min-w-0 rounded-xl border border-black/[0.06] bg-white p-6 shadow-card transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-black/20 hover:shadow-premium"
    >
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <MemoryIcon icon={Lightbulb} />
            <div className="min-w-0 space-y-1">
              <h2 className="break-words text-base font-semibold tracking-tight text-ink">
                {decision.title}
              </h2>
              <p className="text-xs leading-5 text-slate-500">
                {decision.summary}
              </p>
            </div>
          </div>

          {decision.rationale ? (
            <LabeledText label="理由" text={decision.rationale} />
          ) : null}

          {decision.participants.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {decision.participants.map((participant) => (
                <span
                  key={participant}
                  className="rounded-md border border-black/[0.04] bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500"
                >
                  {participant}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <MetaStack
          source={decision.document.fileName}
          createdAt={decision.createdAt}
          dateLabel={formatDate(decision.date)}
        />
      </div>

      <SourceQuote quote={decision.sourceQuote} />
    </article>
  );
}

function ActionItemCard({
  actionItem,
  index
}: {
  actionItem: ActionItemMemoryDto;
  index: number;
}) {
  return (
    <article
      style={{ animationDelay: `${index * 50}ms` }}
      className="animate-fade-in-up min-w-0 rounded-xl border border-black/[0.06] bg-white p-6 shadow-card transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-black/20 hover:shadow-premium"
    >
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <MemoryIcon icon={ClipboardList} />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-base font-semibold tracking-tight text-ink">
                  {actionItem.title}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold ${actionStatusStyles[actionItem.status]}`}
                >
                  {actionItem.status === "open" && <span className="size-1 rounded-full bg-slate-400" />}
                  {actionItem.status === "in_progress" && <span className="size-1 rounded-full bg-amber-500 animate-status-pulse" />}
                  {actionItem.status === "done" && <span className="size-1 rounded-full bg-emerald-500" />}
                  {actionStatusLabels[actionItem.status]}
                </span>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                {actionItem.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <MetaPill
              icon={UserRound}
              label={actionItem.owner ?? "未分配"}
            />
            <MetaPill
              icon={CalendarClock}
              label={formatDate(actionItem.dueDate)}
            />
          </div>
        </div>

        <MetaStack
          source={actionItem.document.fileName}
          createdAt={actionItem.createdAt}
        />
      </div>

      <SourceQuote quote={actionItem.sourceQuote} />
    </article>
  );
}

function OpenQuestionCard({
  openQuestion,
  index
}: {
  openQuestion: OpenQuestionMemoryDto;
  index: number;
}) {
  return (
    <article
      style={{ animationDelay: `${index * 50}ms` }}
      className="animate-fade-in-up min-w-0 rounded-xl border border-black/[0.06] bg-white p-6 shadow-card transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-black/20 hover:shadow-premium"
    >
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <MemoryIcon icon={CircleHelp} />
            <div className="min-w-0 space-y-1">
              <h2 className="break-words text-base font-semibold tracking-tight text-ink">
                {openQuestion.question}
              </h2>
              {openQuestion.context ? (
                <p className="text-xs leading-5 text-slate-500">
                  {openQuestion.context}
                </p>
              ) : null}
            </div>
          </div>

          <MetaPill
            icon={UserRound}
            label={openQuestion.owner ?? "未分配"}
          />
        </div>

        <MetaStack
          source={openQuestion.document.fileName}
          createdAt={openQuestion.createdAt}
        />
      </div>

      <SourceQuote quote={openQuestion.sourceQuote} />
    </article>
  );
}

function RiskCard({ risk, index }: { risk: RiskMemoryDto; index: number }) {
  return (
    <article
      style={{ animationDelay: `${index * 50}ms` }}
      className="animate-fade-in-up min-w-0 rounded-xl border border-black/[0.06] bg-white p-6 shadow-card transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-black/20 hover:shadow-premium"
    >
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <MemoryIcon icon={ShieldAlert} />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-base font-semibold tracking-tight text-ink">
                  {risk.title}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold ${riskSeverityStyles[risk.severity]}`}
                >
                  {risk.severity === "low" && <span className="size-1 rounded-full bg-emerald-500" />}
                  {risk.severity === "medium" && <span className="size-1 rounded-full bg-amber-500" />}
                  {risk.severity === "high" && <span className="size-1 rounded-full bg-red-500 animate-status-pulse" />}
                  {riskSeverityLabels[risk.severity]}
                </span>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                {risk.description}
              </p>
            </div>
          </div>

          {risk.mitigation ? (
            <LabeledText label="缓解措施" text={risk.mitigation} />
          ) : null}
        </div>

        <MetaStack source={risk.document.fileName} createdAt={risk.createdAt} />
      </div>

      <SourceQuote quote={risk.sourceQuote} />
    </article>
  );
}

function MemoryIcon({ icon: Icon }: { icon: typeof Lightbulb }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-black/[0.06] bg-slate-50 text-slate-500">
      <Icon aria-hidden="true" size={15} strokeWidth={2} />
    </span>
  );
}

function MetaStack({
  source,
  createdAt,
  dateLabel
}: {
  source: string;
  createdAt: string;
  dateLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-slate-400 lg:max-w-64 lg:flex-col lg:items-end">
      {dateLabel ? <MetaPill icon={CalendarClock} label={dateLabel} /> : null}
      <MetaPill icon={FileText} label={source} />
      <MetaPill icon={CheckCircle2} label={formatDateTime(createdAt)} />
    </div>
  );
}

function MetaPill({
  icon: Icon,
  label
}: {
  icon: typeof CalendarClock;
  label: string;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-black/[0.06] bg-slate-50 px-2.5 py-0.5 font-bold text-slate-500">
      <Icon aria-hidden="true" size={12} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function LabeledText({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-black/[0.05] bg-slate-50/50 px-3.5 py-2">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
    </div>
  );
}

function SourceQuote({ quote }: { quote: string }) {
  return (
    <div className="mt-4 rounded-lg border border-black/[0.04] bg-slate-50/50 px-4 py-3">
      <div className="flex min-w-0 gap-3">
        <Quote
          aria-hidden="true"
          size={14}
          className="mt-0.5 shrink-0 text-slate-400"
        />
        <p className="min-w-0 break-words text-xs leading-5 text-slate-500 italic">
          “{quote}”
        </p>
      </div>
    </div>
  );
}

function EmptyMemoryState() {
  return (
    <section className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.08] bg-white px-6 py-12 text-center shadow-card animate-fade-in-up">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-black/[0.06] bg-slate-50 text-slate-500">
        <TableProperties aria-hidden="true" size={20} strokeWidth={1.5} />
      </div>
      <h2 className="text-base font-semibold tracking-tight text-ink">
        暂无项目记忆
      </h2>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-400">
        上传文档并完成摄取后，即可在此浏览提取出的结构化项目记忆。
      </p>
    </section>
  );
}

function EmptyTabState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.08] bg-white px-6 py-10 text-center shadow-card animate-fade-in-up">
      <AlertTriangle
        aria-hidden="true"
        size={20}
        className="mb-3 text-slate-400 animate-status-pulse"
      />
      <h2 className="text-sm font-semibold tracking-tight text-ink">
        暂无{label}
      </h2>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-400">
        该项目尚未提取出任何{label}。
      </p>
    </div>
  );
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "无日期";
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
