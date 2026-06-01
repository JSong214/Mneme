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

const actionStatusStyles: Record<ActionItemStatusDto, string> = {
  open: "border-sky-200 bg-sky-50 text-sky-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700"
};

const actionStatusLabels: Record<ActionItemStatusDto, string> = {
  open: "未开始",
  in_progress: "进行中",
  done: "已完成"
};

const riskSeverityStyles: Record<RiskSeverityDto, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-red-200 bg-red-50 text-red-700"
};

const riskSeverityLabels: Record<RiskSeverityDto, string> = {
  low: "低",
  medium: "中",
  high: "高"
};

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
      className: "border-teal-200 bg-teal-50 text-teal-700"
    },
    {
      label: "行动项",
      value: initialSummary.actionItems,
      icon: ClipboardList,
      className: "border-sky-200 bg-sky-50 text-sky-700"
    },
    {
      label: "待解问题",
      value: initialSummary.openQuestions,
      icon: CircleHelp,
      className: "border-amber-200 bg-amber-50 text-amber-700"
    },
    {
      label: "风险",
      value: initialSummary.risks,
      icon: ShieldAlert,
      className: "border-red-200 bg-red-50 text-red-700"
    }
  ];

  return (
    <div className="min-w-0 space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-semibold text-teal-700">{projectName}</p>
          <h1 className="text-4xl font-semibold tracking-normal text-ink">
            项目记忆
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            从已上传文档中提取出的项目上下文。
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700">
          <TableProperties aria-hidden="true" size={18} className="text-teal-600" />
          {initialSummary.total}{" "}
          条记忆
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

      {initialSummary.total > 0 ? (
        <section className="space-y-5">
          <div
            role="tablist"
            aria-label="记忆类型"
            className="grid gap-2 rounded-lg border border-line bg-white p-2 shadow-soft sm:grid-cols-2 lg:grid-cols-4"
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
                  className={`flex min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                    isActive
                      ? "bg-ink text-white shadow-soft"
                      : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon aria-hidden="true" size={17} className="shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </span>
                  <span
                    className={`rounded-lg px-2 py-1 text-xs ${
                      isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {renderMemoryList(activeTab, initialMemories)}
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
      <div className="grid gap-3">
        {memories.decisions.map((decision) => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </div>
    ) : (
      <EmptyTabState label="决策" />
    );
  }

  if (activeTab === "actionItems") {
    return memories.actionItems.length > 0 ? (
      <div className="grid gap-3">
        {memories.actionItems.map((actionItem) => (
          <ActionItemCard key={actionItem.id} actionItem={actionItem} />
        ))}
      </div>
    ) : (
      <EmptyTabState label="行动项" />
    );
  }

  if (activeTab === "openQuestions") {
    return memories.openQuestions.length > 0 ? (
      <div className="grid gap-3">
        {memories.openQuestions.map((openQuestion) => (
          <OpenQuestionCard
            key={openQuestion.id}
            openQuestion={openQuestion}
          />
        ))}
      </div>
    ) : (
      <EmptyTabState label="待解问题" />
    );
  }

  return memories.risks.length > 0 ? (
    <div className="grid gap-3">
      {memories.risks.map((risk) => (
        <RiskCard key={risk.id} risk={risk} />
      ))}
    </div>
  ) : (
    <EmptyTabState label="风险" />
  );
}

function DecisionCard({ decision }: { decision: DecisionMemoryDto }) {
  return (
    <article className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <MemoryIcon icon={Lightbulb} className="bg-teal-50 text-teal-700" />
            <div className="min-w-0 space-y-1">
              <h2 className="break-words text-lg font-semibold tracking-normal text-ink">
                {decision.title}
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                {decision.summary}
              </p>
            </div>
          </div>

          {decision.rationale ? (
            <LabeledText label="理由" text={decision.rationale} />
          ) : null}

          {decision.participants.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {decision.participants.map((participant) => (
                <span
                  key={participant}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600"
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
  actionItem
}: {
  actionItem: ActionItemMemoryDto;
}) {
  return (
    <article className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <MemoryIcon icon={ClipboardList} className="bg-sky-50 text-sky-700" />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-lg font-semibold tracking-normal text-ink">
                  {actionItem.title}
                </h2>
                <span
                  className={`rounded-lg border px-2 py-1 text-xs font-semibold ${actionStatusStyles[actionItem.status]}`}
                >
                  {actionStatusLabels[actionItem.status]}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {actionItem.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
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
  openQuestion
}: {
  openQuestion: OpenQuestionMemoryDto;
}) {
  return (
    <article className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <MemoryIcon
              icon={CircleHelp}
              className="bg-amber-50 text-amber-700"
            />
            <div className="min-w-0 space-y-1">
              <h2 className="break-words text-lg font-semibold tracking-normal text-ink">
                {openQuestion.question}
              </h2>
              {openQuestion.context ? (
                <p className="text-sm leading-6 text-slate-600">
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

function RiskCard({ risk }: { risk: RiskMemoryDto }) {
  return (
    <article className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <MemoryIcon icon={ShieldAlert} className="bg-red-50 text-red-700" />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-lg font-semibold tracking-normal text-ink">
                  {risk.title}
                </h2>
                <span
                  className={`rounded-lg border px-2 py-1 text-xs font-semibold ${riskSeverityStyles[risk.severity]}`}
                >
                  {riskSeverityLabels[risk.severity]}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-600">
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

function MemoryIcon({
  icon: Icon,
  className
}: {
  icon: typeof Lightbulb;
  className: string;
}) {
  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${className}`}
    >
      <Icon aria-hidden="true" size={20} strokeWidth={2} />
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
    <div className="flex flex-wrap gap-2 text-sm text-slate-500 lg:max-w-64 lg:flex-col lg:items-end">
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
    <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-600">
      <Icon aria-hidden="true" size={15} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function LabeledText({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

function SourceQuote({ quote }: { quote: string }) {
  return (
    <div className="mt-4 rounded-lg border border-line bg-slate-50 px-4 py-3">
      <div className="flex min-w-0 gap-3">
        <Quote
          aria-hidden="true"
          size={18}
          className="mt-0.5 shrink-0 text-teal-600"
        />
        <p className="min-w-0 break-words text-sm leading-6 text-slate-700">
          {quote}
        </p>
      </div>
    </div>
  );
}

function EmptyMemoryState() {
  return (
    <section className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center shadow-soft">
      <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <TableProperties aria-hidden="true" size={24} strokeWidth={2} />
      </div>
      <h2 className="text-xl font-semibold tracking-normal text-ink">
        暂无项目记忆
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        上传文档并完成摄取后，即可浏览提取出的项目记忆。
      </p>
    </section>
  );
}

function EmptyTabState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white px-6 py-10 text-center shadow-soft">
      <AlertTriangle
        aria-hidden="true"
        size={24}
        className="mb-3 text-slate-400"
      />
      <h2 className="text-lg font-semibold tracking-normal text-ink">
        暂无{label}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        该项目尚未提取出{label}。
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
