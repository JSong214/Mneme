import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  MessageSquareText,
  Radar,
  TableProperties
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { getProject } from "@/lib/projects/service";

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

type WorkspaceItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  status: "可用" | "计划中";
  href?: string;
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

export default async function ProjectDetailPage({
  params
}: ProjectDetailPageProps) {
  const { projectId } = params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

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
