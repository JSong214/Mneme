import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Database,
  ExternalLink,
  FileText,
  Lightbulb,
  MessageSquareText,
  Radar,
  ShieldAlert,
  TableProperties
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import type { ProjectActivityDto, ProjectActivityType } from "@/lib/projects/types";
import { getProjectOverview } from "@/lib/projects/service";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: {
    projectId: string;
  };
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  year: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

type WorkspaceItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  status: "可用" | "计划中";
  href?: string;
};

type OverviewMetric = {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  className: string;
  details: string[];
};

const workspaceItems: WorkspaceItem[] = [
  {
    title: "文档",
    description: "上传源文件并跟踪摄取状态。",
    icon: FileText,
    status: "可用",
    href: "documents"
  },
  {
    title: "问答",
    description: "基于来源证据提问项目问题。",
    icon: MessageSquareText,
    status: "可用",
    href: "ask"
  },
  {
    title: "记忆",
    description: "浏览决策、行动项、待解问题和风险。",
    icon: TableProperties,
    status: "可用",
    href: "memory"
  },
  {
    title: "评估",
    description: "检查证据召回和回答依据。",
    icon: Radar,
    status: "可用",
    href: "eval"
  }
];

const activityStyles: Record<
  ProjectActivityType,
  {
    icon: LucideIcon;
    className: string;
  }
> = {
  document: {
    icon: FileText,
    className: "border-teal-200 bg-teal-50 text-teal-700"
  },
  decision: {
    icon: Lightbulb,
    className: "border-amber-200 bg-amber-50 text-amber-700"
  },
  action_item: {
    icon: ClipboardList,
    className: "border-sky-200 bg-sky-50 text-sky-700"
  },
  open_question: {
    icon: CircleHelp,
    className: "border-violet-200 bg-violet-50 text-violet-700"
  },
  risk: {
    icon: ShieldAlert,
    className: "border-red-200 bg-red-50 text-red-700"
  },
  ask: {
    icon: MessageSquareText,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  eval: {
    icon: Radar,
    className: "border-indigo-200 bg-indigo-50 text-indigo-700"
  }
};

export default async function ProjectDetailPage({
  params
}: ProjectDetailPageProps) {
  const { projectId } = params;
  const overview = await getProjectOverview(projectId);

  if (!overview) {
    notFound();
  }

  const { project } = overview;
  const overviewMetrics: OverviewMetric[] = [
    {
      label: "文档",
      value: overview.documents.total,
      description: "上传源文件与摄取状态",
      icon: FileText,
      className: "border-teal-200 bg-teal-50 text-teal-700",
      details: [
        `${overview.documents.ready} 个可用`,
        `${overview.documents.processing} 个处理中`,
        `${overview.documents.failed} 个失败`
      ]
    },
    {
      label: "片段",
      value: overview.chunks.total,
      description: "可检索 source chunks",
      icon: Database,
      className: "border-sky-200 bg-sky-50 text-sky-700",
      details: [
        overview.chunks.averageTokenCount === null
          ? "暂无平均 token"
          : `平均 ${overview.chunks.averageTokenCount} tokens`
      ]
    },
    {
      label: "项目记忆",
      value: overview.memories.total,
      description: "结构化 decisions、tasks、questions、risks",
      icon: Brain,
      className: "border-amber-200 bg-amber-50 text-amber-700",
      details: [
        `${overview.memories.decisions} 个决策`,
        `${overview.memories.actionItems} 个行动项`,
        `${overview.memories.openQuestions} 个待解问题`,
        `${overview.memories.risks} 个风险`
      ]
    },
    {
      label: "质量闭环",
      value:
        overview.eval.averageGroundednessScore === null
          ? "未评估"
          : `${overview.eval.averageGroundednessScore}/5`,
      description: "Ask 与 Eval 的运行情况",
      icon: BarChart3,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      details: [
        `${overview.ask.totalRuns} 次问答`,
        `${overview.eval.casesWithRuns}/${overview.eval.totalCases} 个 eval 已运行`,
        `${overview.eval.sourceMatches} 个来源命中`
      ]
    }
  ];

  return (
    <PageShell>
      <div className="space-y-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          项目列表
        </Link>

        <section className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-normal text-ink">
                {project.name}
              </h1>
              <p className="text-base leading-7 text-slate-600">
                {project.description ?? "暂无简介"}
              </p>
            </div>
            <dl className="grid min-w-64 gap-3 text-sm">
              <div className="rounded-lg border border-line bg-slate-50 p-3">
                <dt className="font-medium text-slate-500">创建时间</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {dateFormatter.format(new Date(project.createdAt))}
                </dd>
              </div>
              <div className="rounded-lg border border-line bg-slate-50 p-3">
                <dt className="font-medium text-slate-500">更新时间</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {dateFormatter.format(new Date(project.updatedAt))}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-normal text-ink">
                项目概览
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                当前项目记忆系统的摄取、检索、问答和评估状态。
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-soft">
              <Activity aria-hidden="true" size={18} className="text-teal-600" />
              最近摄取：{formatDateTime(overview.documents.latestIngestionAt)}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {overviewMetrics.map((metric) => (
              <OverviewMetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <OverviewStatusCard
              icon={CheckCircle2}
              title="文档状态"
              value={`${overview.documents.ready}/${overview.documents.total}`}
              description="可用文档"
              details={[
                `${overview.documents.failed} 个失败`,
                `${overview.documents.processing} 个处理中`
              ]}
            />
            <OverviewStatusCard
              icon={MessageSquareText}
              title="最近问答"
              value={overview.ask.totalRuns}
              description={formatDateTime(overview.ask.latestRunAt)}
              details={["Ask 会保存最近的结构化答案和证据。"]}
            />
            <OverviewStatusCard
              icon={Radar}
              title="最近评估"
              value={overview.eval.totalCases}
              description={formatDateTime(overview.eval.latestRunAt)}
              details={[
                `${overview.eval.sourceMatches} 命中 / ${overview.eval.sourceMisses} 缺失`,
                overview.eval.averageGroundednessScore === null
                  ? "暂无依据分"
                  : `平均依据分 ${overview.eval.averageGroundednessScore}/5`
              ]}
            />
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-normal text-ink">
                最近活动
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                文档摄取、项目记忆、问答和评估的最新变化。
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              <Activity aria-hidden="true" size={18} className="text-teal-600" />
              {overview.activity.length} 条
            </span>
          </div>

          {overview.activity.length > 0 ? (
            <div className="mt-5 divide-y divide-line">
              {overview.activity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-dashed border-line bg-slate-50 px-4 py-8 text-center text-sm leading-6 text-slate-600">
              暂无活动。上传文档、提问或运行 eval 后会在这里出现。
            </p>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            const statusClassName =
              item.status === "可用"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700";
            const cardContent = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Icon aria-hidden="true" size={20} strokeWidth={2} />
                  </span>
                  <span
                    className={`rounded-lg border px-2 py-1 text-xs font-semibold ${statusClassName}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="mt-5 space-y-2">
                  <h2 className="text-lg font-semibold tracking-normal text-ink">
                    {item.title}
                  </h2>
                  <p className="text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                  {"href" in item ? (
                    <span className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-teal-700">
                      打开
                      <ArrowRight aria-hidden="true" size={16} />
                    </span>
                  ) : null}
                </div>
              </>
            );

            return "href" in item ? (
              <Link
                key={item.title}
                href={`/projects/${project.id}/${item.href}`}
                className="group rounded-lg border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                {cardContent}
              </Link>
            ) : (
              <article
                key={item.title}
                className="rounded-lg border border-line bg-white p-5 shadow-soft"
              >
                {cardContent}
              </article>
            );
          })}
        </section>
      </div>
    </PageShell>
  );
}

function ActivityRow({ item }: { item: ProjectActivityDto }) {
  const style = activityStyles[item.type];
  const Icon = style.icon;
  const content = (
    <div className="flex min-w-0 items-start gap-3 py-4">
      <span
        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border ${style.className}`}
      >
        <Icon aria-hidden="true" size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
              {item.label}
            </p>
            <h3 className="mt-1 break-words text-base font-semibold tracking-normal text-ink">
              {item.title}
            </h3>
          </div>
          <time
            dateTime={item.timestamp}
            className="shrink-0 text-sm font-medium text-slate-500"
          >
            {formatDateTime(item.timestamp)}
          </time>
        </div>
        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
          {item.description}
        </p>
      </div>
      {item.href ? (
        <ExternalLink
          aria-hidden="true"
          size={16}
          className="mt-1 hidden shrink-0 text-slate-400 sm:block"
        />
      ) : null}
    </div>
  );

  return item.href ? (
    <Link
      href={item.href}
      className="block rounded-lg px-2 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
    >
      {content}
    </Link>
  ) : (
    <article className="px-2">{content}</article>
  );
}

function OverviewMetricCard({ metric }: { metric: OverviewMetric }) {
  const Icon = metric.icon;

  return (
    <article className={`rounded-lg border p-4 shadow-soft ${metric.className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{metric.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal">
            {metric.value}
          </p>
        </div>
        <Icon aria-hidden="true" size={20} className="shrink-0" />
      </div>
      <p className="mt-3 text-sm leading-6 opacity-90">{metric.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {metric.details.map((detail) => (
          <span
            key={detail}
            className="rounded-lg border border-white/60 bg-white/55 px-2 py-1 text-xs font-semibold"
          >
            {detail}
          </span>
        ))}
      </div>
    </article>
  );
}

function OverviewStatusCard({
  icon: Icon,
  title,
  value,
  description,
  details
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description: string;
  details: string[];
}) {
  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-ink">
            {value}
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <Icon aria-hidden="true" size={20} />
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-600">{description}</p>
      <div className="mt-4 grid gap-2">
        {details.map((detail) => (
          <p key={detail} className="text-sm leading-6 text-slate-600">
            {detail}
          </p>
        ))}
      </div>
    </article>
  );
}

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "暂无记录";
}
