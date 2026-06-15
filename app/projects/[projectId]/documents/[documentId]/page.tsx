import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  FileText,
  Hash,
  Lightbulb,
  Quote,
  ShieldAlert,
  TableProperties
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { getProjectDocumentDetail } from "@/lib/documents/service";
import type { DocumentStatusDto } from "@/lib/documents/types";
import type {
  ActionItemMemoryDto,
  ActionItemStatusDto,
  DecisionMemoryDto,
  OpenQuestionMemoryDto,
  RiskMemoryDto,
  RiskSeverityDto
} from "@/lib/memories/types";
import { getProject } from "@/lib/projects/service";

export const dynamic = "force-dynamic";

type DocumentDetailPageProps = {
  params: {
    projectId: string;
    documentId: string;
  };
};

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

const numberFormatter = new Intl.NumberFormat("zh-CN");

const documentStatusStyles: Record<DocumentStatusDto, string> = {
  processing: "border-sky-200 bg-sky-50 text-sky-700",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700"
};

const documentStatusLabels: Record<DocumentStatusDto, string> = {
  processing: "处理中",
  ready: "可用",
  failed: "失败"
};

const actionStatusLabels: Record<ActionItemStatusDto, string> = {
  open: "未开始",
  in_progress: "进行中",
  done: "已完成"
};

const riskSeverityLabels: Record<RiskSeverityDto, string> = {
  low: "低",
  medium: "中",
  high: "高"
};

export default async function DocumentDetailPage({
  params
}: DocumentDetailPageProps) {
  const { projectId, documentId } = params;
  const [project, detail] = await Promise.all([
    getProject(projectId),
    getProjectDocumentDetail(projectId, documentId)
  ]);

  if (!project || !detail) {
    notFound();
  }

  const { document, chunks, memories } = detail;
  const memoryTotal =
    memories.decisions.length +
    memories.actionItems.length +
    memories.openQuestions.length +
    memories.risks.length;

  return (
    <PageShell>
      <div className="space-y-8">
        <Link
          href={`/projects/${project.id}/documents`}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          返回文档
        </Link>

        <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <p className="text-sm font-semibold text-teal-700">
                {project.name}
              </p>
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <FileText aria-hidden="true" size={22} />
                </span>
                <div className="min-w-0 space-y-2">
                  <h1 className="break-words text-3xl font-semibold tracking-normal text-ink">
                    {document.fileName}
                  </h1>
                  <p className="text-sm leading-6 text-slate-600">
                    查看原文、可检索片段和该文档提取出的项目记忆。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm lg:max-w-72 lg:flex-col lg:items-end">
              <span
                className={`inline-flex items-center gap-2 rounded-lg border px-2 py-1 font-semibold ${documentStatusStyles[document.status]}`}
              >
                <CheckCircle2 aria-hidden="true" size={15} />
                {documentStatusLabels[document.status]}
              </span>
              <MetaPill icon={Hash} label={`${chunks.length} 个片段`} />
              <MetaPill icon={TableProperties} label={`${memoryTotal} 条记忆`} />
            </div>
          </div>

          {document.errorMessage ? (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {document.errorMessage}
            </p>
          ) : null}
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="min-w-0 space-y-6">
            <section
              id="raw"
              className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft"
            >
              <SectionHeader
                icon={FileText}
                title="原文"
                description={`${numberFormatter.format(
                  document.rawTextCharacterCount
                )} 个字符`}
              />
              <pre className="mt-4 max-h-[560px] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                {document.rawText}
              </pre>
            </section>

            <section
              id="chunks"
              className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft"
            >
              <SectionHeader
                icon={Hash}
                title="可检索片段"
                description={`${chunks.length} 个 chunks`}
              />
              {chunks.length > 0 ? (
                <div className="mt-4 grid gap-3">
                  {chunks.map((chunk) => (
                    <article
                      key={chunk.id}
                      id={`chunk-${chunk.chunkIndex}`}
                      className="source-chunk-card scroll-mt-24 rounded-lg border border-line bg-slate-50 p-4 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold text-ink">
                          Chunk {chunk.chunkIndex + 1}
                        </h2>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>{chunk.tokenCount} tokens</span>
                          <span>{formatDateTime(chunk.createdAt)}</span>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                        {chunk.content}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyInlineState label="暂无可检索片段" />
              )}
            </section>

            <section
              id="memories"
              className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft"
            >
              <SectionHeader
                icon={TableProperties}
                title="从该文档提取的项目记忆"
                description={`${memoryTotal} 条 memory`}
              />
              {memoryTotal > 0 ? (
                <div className="mt-4 grid gap-4">
                  <MemoryGroup
                    icon={Lightbulb}
                    title="决策"
                    count={memories.decisions.length}
                  >
                    {memories.decisions.map((decision) => (
                      <DecisionItem key={decision.id} decision={decision} />
                    ))}
                  </MemoryGroup>
                  <MemoryGroup
                    icon={ClipboardList}
                    title="行动项"
                    count={memories.actionItems.length}
                  >
                    {memories.actionItems.map((actionItem) => (
                      <ActionItemItem
                        key={actionItem.id}
                        actionItem={actionItem}
                      />
                    ))}
                  </MemoryGroup>
                  <MemoryGroup
                    icon={CircleHelp}
                    title="待解问题"
                    count={memories.openQuestions.length}
                  >
                    {memories.openQuestions.map((openQuestion) => (
                      <OpenQuestionItem
                        key={openQuestion.id}
                        openQuestion={openQuestion}
                      />
                    ))}
                  </MemoryGroup>
                  <MemoryGroup
                    icon={ShieldAlert}
                    title="风险"
                    count={memories.risks.length}
                  >
                    {memories.risks.map((risk) => (
                      <RiskItem key={risk.id} risk={risk} />
                    ))}
                  </MemoryGroup>
                </div>
              ) : (
                <EmptyInlineState label="暂无结构化项目记忆" />
              )}
            </section>
          </main>

          <aside className="h-fit min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold tracking-normal text-ink">
              来源详情
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <DetailRow label="MIME type" value={document.mimeType} />
              <DetailRow label="创建时间" value={formatDateTime(document.createdAt)} />
              <DetailRow label="更新时间" value={formatDateTime(document.updatedAt)} />
              <DetailRow label="片段数" value={String(chunks.length)} />
              <DetailRow label="记忆数" value={String(memoryTotal)} />
            </dl>

            <nav aria-label="文档详情导航" className="mt-5 grid gap-2 text-sm">
              <a
                href="#raw"
                className="rounded-lg px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                原文
              </a>
              <a
                href="#chunks"
                className="rounded-lg px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                可检索片段
              </a>
              <a
                href="#memories"
                className="rounded-lg px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                项目记忆
              </a>
            </nav>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <Icon aria-hidden="true" size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-normal text-ink">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function MemoryGroup({
  icon: Icon,
  title,
  count,
  children
}: {
  icon: LucideIcon;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-base font-semibold tracking-normal text-ink">
          <Icon aria-hidden="true" size={18} className="text-teal-600" />
          {title}
        </h3>
        <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600">
          {count}
        </span>
      </div>
      {count > 0 ? (
        <div className="mt-3 grid gap-3">{children}</div>
      ) : (
        <EmptyInlineState label={`暂无${title}`} />
      )}
    </section>
  );
}

function DecisionItem({ decision }: { decision: DecisionMemoryDto }) {
  return (
    <MemoryItem
      title={decision.title}
      body={decision.summary}
      meta={[
        formatDate(decision.date),
        decision.participants.length > 0
          ? decision.participants.join("、")
          : "无参与人记录"
      ]}
      quote={decision.sourceQuote}
    >
      {decision.rationale ? (
        <LabeledText label="理由" text={decision.rationale} />
      ) : null}
    </MemoryItem>
  );
}

function ActionItemItem({
  actionItem
}: {
  actionItem: ActionItemMemoryDto;
}) {
  return (
    <MemoryItem
      title={actionItem.title}
      body={actionItem.description}
      meta={[
        `负责人：${actionItem.owner ?? "未分配"}`,
        `状态：${actionStatusLabels[actionItem.status]}`,
        `截止：${formatDate(actionItem.dueDate)}`
      ]}
      quote={actionItem.sourceQuote}
    />
  );
}

function OpenQuestionItem({
  openQuestion
}: {
  openQuestion: OpenQuestionMemoryDto;
}) {
  return (
    <MemoryItem
      title={openQuestion.question}
      body={openQuestion.context}
      meta={[`负责人：${openQuestion.owner ?? "未分配"}`]}
      quote={openQuestion.sourceQuote}
    />
  );
}

function RiskItem({ risk }: { risk: RiskMemoryDto }) {
  return (
    <MemoryItem
      title={risk.title}
      body={risk.description}
      meta={[`严重程度：${riskSeverityLabels[risk.severity]}`]}
      quote={risk.sourceQuote}
    >
      {risk.mitigation ? (
        <LabeledText label="缓解措施" text={risk.mitigation} />
      ) : null}
    </MemoryItem>
  );
}

function MemoryItem({
  title,
  body,
  meta,
  quote,
  children
}: {
  title: string;
  body: string;
  meta: string[];
  quote: string;
  children?: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <h4 className="break-words text-base font-semibold tracking-normal text-ink">
        {title}
      </h4>
      {body ? (
        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
          {body}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {meta.map((item) => (
          <span
            key={item}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600"
          >
            {item}
          </span>
        ))}
      </div>
      {children}
      <SourceQuote quote={quote} />
    </article>
  );
}

function LabeledText({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

function SourceQuote({ quote }: { quote: string }) {
  return (
    <div className="mt-3 rounded-lg border border-line bg-slate-50 px-3 py-2">
      <div className="flex min-w-0 gap-2">
        <Quote
          aria-hidden="true"
          size={16}
          className="mt-0.5 shrink-0 text-teal-600"
        />
        <p className="min-w-0 break-words text-sm leading-6 text-slate-700">
          {quote}
        </p>
      </div>
    </div>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-slate-700">{value}</dd>
    </div>
  );
}

function EmptyInlineState({ label }: { label: string }) {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-slate-500">
      <AlertTriangle aria-hidden="true" size={20} className="mx-auto mb-2" />
      {label}
    </div>
  );
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "无日期";
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
