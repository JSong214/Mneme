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
  TableProperties,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import type {
  ProjectActivityDto,
  ProjectActivityType,
} from "@/lib/projects/types";
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
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
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
    href: "documents",
  },
  {
    title: "问答",
    description: "基于来源证据提问项目问题。",
    icon: MessageSquareText,
    status: "可用",
    href: "ask",
  },
  {
    title: "记忆",
    description: "浏览决策、行动项、待解问题和风险。",
    icon: TableProperties,
    status: "可用",
    href: "memory",
  },
  {
    title: "评估",
    description: "检查证据召回和回答依据。",
    icon: Radar,
    status: "可用",
    href: "eval",
  },
];

// 活动类型的微标样式定义，去除刺眼的带色背景，统一使用细微描边和精致的单色图标
const activityStyles: Record<
  ProjectActivityType,
  {
    icon: LucideIcon;
    className: string;
  }
> = {
  document: {
    icon: FileText,
    className: "border-black/[0.06] bg-slate-50 text-slate-700",
  },
  decision: {
    icon: Lightbulb,
    className: "border-black/[0.06] bg-slate-50 text-slate-700",
  },
  action_item: {
    icon: ClipboardList,
    className: "border-black/[0.06] bg-slate-50 text-slate-700",
  },
  open_question: {
    icon: CircleHelp,
    className: "border-black/[0.06] bg-slate-50 text-slate-700",
  },
  risk: {
    icon: ShieldAlert,
    className: "border-black/[0.06] bg-slate-50 text-slate-700",
  },
  ask: {
    icon: MessageSquareText,
    className: "border-black/[0.06] bg-slate-50 text-slate-700",
  },
  eval: {
    icon: Radar,
    className: "border-black/[0.06] bg-slate-50 text-slate-700",
  },
};

/**
 * 项目详情页面
 * 展示特定项目工作区内的文档、记忆、问答、评估总况，以及最近的活动时间流。
 */
export default async function ProjectDetailPage({
  params,
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
      className: "border-black/[0.06] bg-white",
      details: [
        `${overview.documents.ready} 个可用`,
        `${overview.documents.processing} 个处理中`,
        `${overview.documents.failed} 个失败`,
      ],
    },
    {
      label: "片段",
      value: overview.chunks.total,
      description: "可检索 source chunks",
      icon: Database,
      className: "border-black/[0.06] bg-white",
      details: [
        overview.chunks.averageTokenCount === null
          ? "暂无平均 token"
          : `平均 ${overview.chunks.averageTokenCount} tokens`,
      ],
    },
    {
      label: "项目记忆",
      value: overview.memories.total,
      description: "结构化 decisions、tasks、questions、risks",
      icon: Brain,
      className: "border-black/[0.06] bg-white",
      details: [
        `${overview.memories.decisions} 个决策`,
        `${overview.memories.actionItems} 个行动项`,
        `${overview.memories.openQuestions} 个待解问题`,
        `${overview.memories.risks} 个风险`,
      ],
    },
    {
      label: "质量闭环",
      value:
        overview.eval.averageGroundednessScore === null
          ? "未评估"
          : `${overview.eval.averageGroundednessScore}/5`,
      description: "Ask 与 Eval 的运行情况",
      icon: BarChart3,
      className: "border-black/[0.06] bg-white",
      details: [
        `${overview.ask.totalRuns} 次问答`,
        `${overview.eval.casesWithRuns}/${overview.eval.totalCases} 个 eval 已运行`,
        `${overview.eval.sourceMatches} 个来源命中`,
      ],
    },
  ];

  // 各个工作区卡片的特定高雅主题色映射配置
  const cardThemes: Record<
    string,
    {
      iconWrapper: string;
      hoverBorder: string;
      linkText: string;
    }
  > = {
    文档: {
      iconWrapper: "bg-emerald-50 text-emerald-700 border-emerald-100",
      hoverBorder: "hover:border-emerald-300",
      linkText: "text-emerald-700",
    },
    问答: {
      iconWrapper: "bg-blue-50 text-blue-700 border-blue-100",
      hoverBorder: "hover:border-blue-300",
      linkText: "text-blue-700",
    },
    记忆: {
      iconWrapper: "bg-amber-50 text-amber-800 border-amber-100",
      hoverBorder: "hover:border-amber-400",
      linkText: "text-amber-800",
    },
    评估: {
      iconWrapper: "bg-purple-50 text-purple-700 border-purple-100",
      hoverBorder: "hover:border-purple-300",
      linkText: "text-purple-700",
    },
  };

  return (
    <PageShell>
      <div className="space-y-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-all duration-300 ease-smooth hover:text-ink focus:outline-none"
        >
          <ArrowLeft aria-hidden="true" size={14} />
          返回项目列表
        </Link>

        {/* 项目头部信息卡片 */}
        <section className="animate-fade-in-up rounded-xl border border-black/[0.06] bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-ink">
                {project.name}
              </h1>
              <p className="text-sm leading-6 text-slate-500">
                {project.description ?? "暂无简介"}
              </p>
            </div>
            <dl className="grid min-w-64 gap-2 text-xs">
              <div className="rounded-lg border border-black/[0.04] bg-slate-50/50 p-3">
                <dt className="font-semibold text-slate-400">创建时间</dt>
                <dd className="mt-1 font-semibold text-ink text-sm">
                  {dateFormatter.format(new Date(project.createdAt))}
                </dd>
              </div>
              <div className="rounded-lg border border-black/[0.04] bg-slate-50/50 p-3">
                <dt className="font-semibold text-slate-400">更新时间</dt>
                <dd className="mt-1 font-semibold text-ink text-sm">
                  {dateFormatter.format(new Date(project.updatedAt))}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* 双栏网格主容器，实现活动流的右侧卡片置放，将侧边栏宽度从 360px 调整为 400px 以避免横向滚动条 */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-8 items-start">
          {/* 左侧主显示区 */}
          <div className="space-y-8">
            {/* 工作区功能卡片入口网格，合并为 2x2 并配置主题色 */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                功能入口
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up delay-200">
                {workspaceItems.map((item) => {
                  const Icon = item.icon;
                  const theme = cardThemes[item.title] || {
                    iconWrapper:
                      "bg-slate-50 text-slate-600 border-black/[0.06]",
                    hoverBorder: "hover:border-black/20",
                    linkText: "text-ink",
                  };
                  const statusClassName =
                    item.status === "可用"
                      ? "border-black/[0.06] bg-slate-50 text-slate-700"
                      : "border-black/[0.04] bg-slate-50/55 text-slate-400";

                  const cardContent = (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <span
                          className={`flex size-9 items-center justify-center rounded-lg border transition-all duration-500 ease-smooth ${theme.iconWrapper}`}
                        >
                          <Icon aria-hidden="true" size={16} strokeWidth={2} />
                        </span>
                        <span
                          className={`rounded-lg border px-2 py-0.5 text-xs font-semibold tracking-wide ${statusClassName}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-5 space-y-1.5">
                        <h3 className="text-base font-semibold tracking-tight text-ink">
                          {item.title}
                        </h3>
                        <p className="text-xs leading-relaxed text-slate-400">
                          {item.description}
                        </p>
                        {"href" in item ? (
                          <span
                            className={`inline-flex items-center gap-1 pt-2 text-xs font-bold transition-transform duration-300 group-hover:translate-x-0.5 ${theme.linkText}`}
                          >
                            打开
                            <ArrowRight aria-hidden="true" size={13} />
                          </span>
                        ) : null}
                      </div>
                    </>
                  );

                  return "href" in item ? (
                    <Link
                      key={item.title}
                      href={`/projects/${project.id}/${item.href}`}
                      className={`group rounded-xl border border-black/[0.06] bg-white p-6 shadow-card transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:shadow-premium focus:outline-none focus:ring-1 focus:ring-black/20 ${theme.hoverBorder}`}
                    >
                      {cardContent}
                    </Link>
                  ) : (
                    <article
                      key={item.title}
                      className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-card"
                    >
                      {cardContent}
                    </article>
                  );
                })}
              </div>
            </section>

            {/* 指标面板 */}
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-ink">
                    项目概览
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    当前项目记忆系统的摄取、检索、问答和评估状态。
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.06] bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-card">
                  <Activity
                    aria-hidden="true"
                    size={15}
                    className="text-slate-400 animate-status-pulse"
                  />
                  最近摄取：
                  {formatDateTime(overview.documents.latestIngestionAt)}
                </div>
              </div>

              {/* 四大指标卡片 */}
              <div className="grid gap-4 sm:grid-cols-2">
                {overviewMetrics.map((metric, index) => (
                  <OverviewMetricCard
                    key={metric.label}
                    metric={metric}
                    index={index}
                  />
                ))}
              </div>

              {/* 核心状态详情板块 */}
              <div className="grid gap-4 sm:grid-cols-3">
                <OverviewStatusCard
                  icon={CheckCircle2}
                  title="文档状态"
                  value={`${overview.documents.ready}/${overview.documents.total}`}
                  description="可用文档"
                  details={[
                    `${overview.documents.failed} 个失败`,
                    `${overview.documents.processing} 个处理中`,
                  ]}
                  delayClass="delay-75"
                />
                <OverviewStatusCard
                  icon={MessageSquareText}
                  title="最近问答"
                  value={overview.ask.totalRuns}
                  description={formatDateTime(overview.ask.latestRunAt)}
                  details={["Ask 会保存最近的结构化答案。"]}
                  delayClass="delay-100"
                />
                <OverviewStatusCard
                  icon={Radar}
                  title="最近评估"
                  value={overview.eval.totalCases}
                  description={formatDateTime(overview.eval.latestRunAt)}
                  details={[
                    `平均 ${overview.eval.averageGroundednessScore === null ? "未评" : `${overview.eval.averageGroundednessScore}/5`} 分`,
                  ]}
                  delayClass="delay-150"
                />
              </div>
            </section>
          </div>

          {/* 右侧边栏最近活动卡片 */}
          <aside className="sticky top-20 mt-11 animate-fade-in-up delay-200 rounded-xl border border-black/[0.06] bg-white p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.04] pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-50 border border-black/[0.06] text-slate-500">
                  <Activity aria-hidden="true" size={14} />
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-ink">
                  最近活动
                </h2>
              </div>
              <span className="rounded-lg border border-black/[0.06] bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {overview.activity.length} 条
              </span>
            </div>

            {overview.activity.length > 0 ? (
              <div className="divide-y divide-black/[0.04] max-h-[480px] overflow-y-auto overflow-x-hidden pr-1 no-scrollbar">
                {overview.activity.slice(0, 8).map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-black/[0.08] bg-slate-50/50 px-4 py-8 text-center text-xs leading-6 text-slate-400">
                暂无记录。上传文档、提问后显示。
              </p>
            )}
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

function ActivityRow({ item }: { item: ProjectActivityDto }) {
  const style = activityStyles[item.type];
  const Icon = style.icon;
  const content = (
    <div className="flex min-w-0 items-start gap-3 py-3.5 transition-all duration-300">
      <span
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border ${style.className}`}
      >
        <Icon aria-hidden="true" size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {item.label}
          </p>
          <h3 className="break-words text-xs font-semibold tracking-tight text-ink line-clamp-2">
            {item.title}
          </h3>
          <time
            dateTime={item.timestamp}
            className="text-[10px] text-slate-400 mt-0.5"
          >
            {formatDateTime(item.timestamp)}
          </time>
        </div>
      </div>
      {item.href ? (
        <ExternalLink
          aria-hidden="true"
          size={12}
          className="mt-1 shrink-0 text-slate-300 group-hover:text-ink transition-colors duration-300"
        />
      ) : null}
    </div>
  );

  return item.href ? (
    <Link
      href={item.href}
      className="group block rounded-lg px-1 transition-all duration-300 ease-smooth hover:bg-black/[0.01]"
    >
      {content}
    </Link>
  ) : (
    <article className="px-1">{content}</article>
  );
}

function OverviewMetricCard({
  metric,
  index,
}: {
  metric: OverviewMetric;
  index: number;
}) {
  const Icon = metric.icon;

  return (
    <article
      style={{ animationDelay: `${index * 60}ms` }}
      className="animate-fade-in-up rounded-xl border border-black/[0.06] bg-white p-5 shadow-card transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-black/20 hover:shadow-premium"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400">{metric.label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink">
            {metric.value}
          </p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-black/[0.05] bg-slate-50 text-slate-500">
          <Icon aria-hidden="true" size={14} className="shrink-0" />
        </span>
      </div>
      <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
        {metric.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {metric.details.map((detail) => (
          <span
            key={detail}
            className="rounded-md border border-black/[0.04] bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500"
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
  details,
  delayClass,
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description: string;
  details: string[];
  delayClass: string;
}) {
  return (
    <article
      className={`animate-fade-in-up ${delayClass} rounded-xl border border-black/[0.06] bg-white p-5 shadow-card transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-black/20 hover:shadow-premium`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400">{title}</p>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-ink">
            {value}
          </p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-black/[0.05] bg-slate-50 text-slate-500">
          <Icon aria-hidden="true" size={14} />
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">{description}</p>
      <div className="mt-3.5 space-y-1.5">
        {details.map((detail) => (
          <p key={detail} className="text-xs text-slate-400 leading-relaxed">
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
