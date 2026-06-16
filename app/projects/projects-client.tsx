"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  FolderPlus,
  Layers3,
  LoaderCircle,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import type { ProjectDto } from "@/lib/projects/types";

type ProjectsClientProps = {
  initialProjects: ProjectDto[];
};

type ApiCreateProjectResponse =
  | {
      project: ProjectDto;
    }
  | {
      error: {
        code: string;
        message: string;
      };
    };

type ApiAtlasDemoImportResponse =
  | {
      result: {
        project: ProjectDto;
        documentsCreated: number;
        documentsSkipped: number;
        documentsReprocessed: number;
        documentsReady: number;
        documentsFailed: number;
        evalCasesCreated: number;
        evalCasesSkipped: number;
      };
    }
  | {
      error: {
        code: string;
        message: string;
      };
    };

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projects, setProjects] = useState(initialProjects);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportingDemo, setIsImportingDemo] = useState(false);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: description.length > 0 ? description : undefined,
        }),
      });
      const payload = (await response.json()) as ApiCreateProjectResponse;

      if (!response.ok || "error" in payload) {
        setError(
          "error" in payload
            ? payload.error.message
            : "无法创建项目。",
        );
        return;
      }

      setProjects((currentProjects) => [payload.project, ...currentProjects]);
      setName("");
      setDescription("");
      router.refresh();
    } catch {
      setError("无法创建项目。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImportAtlasDemo() {
    setError(null);
    setIsImportingDemo(true);

    try {
      const response = await fetch("/api/demo/atlas-billing-revamp", {
        method: "POST",
      });
      const payload = (await response.json()) as ApiAtlasDemoImportResponse;

      if (!response.ok || "error" in payload) {
        setError(
          "error" in payload
            ? toDemoImportError(payload.error.code, payload.error.message)
            : "无法导入 Atlas demo。",
        );
        return;
      }

      setProjects((currentProjects) => [
        payload.result.project,
        ...currentProjects.filter(
          (project) => project.id !== payload.result.project.id,
        ),
      ]);
      router.refresh();
      router.push(`/projects/${payload.result.project.id}`);
    } catch {
      setError("无法导入 Atlas demo。");
    } finally {
      setIsImportingDemo(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* 左侧项目列表区域 */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              项目列表
            </h1>
            <p className="max-w-2xl text-sm text-slate-500">
              为每个项目记忆创建一个独立的工作区。
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3.5 py-2 text-sm font-semibold text-slate-600">
            <Layers3 aria-hidden="true" size={15} className="text-ink" />
            {projects.length} 个项目
          </div>
        </div>

        {projects.length > 0 ? (
          <div className="grid gap-4">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                style={{ animationDelay: `${index * 60}ms` }}
                className="animate-fade-in-up group grid gap-4 rounded-xl border border-black/[0.06] bg-white p-6 shadow-card transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-black/20 hover:shadow-premium focus:outline-none focus:ring-1 focus:ring-black/20 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0 space-y-2.5">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-ink group-hover:text-black">
                    {project.name}
                  </h2>
                  <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                    {project.description ?? "暂无简介"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-slate-400">
                    <CalendarClock aria-hidden="true" size={14} />
                    {dateFormatter.format(new Date(project.updatedAt))}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-ink group-hover:translate-x-0.5 transition-transform duration-300">
                    打开
                    <ArrowRight
                      aria-hidden="true"
                      size={14}
                      className="transition-transform duration-300"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.08] bg-white px-6 py-12 text-center shadow-card animate-fade-in-up">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-black/[0.06] bg-slate-50 text-slate-500">
              <FolderPlus aria-hidden="true" size={22} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              项目列表为空
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
              创建第一个工作区，以开启结构化项目记忆流程。
            </p>
          </div>
        )}
      </section>

      {/* 右侧边栏操作区域 */}
      <aside className="h-fit rounded-xl border border-black/[0.06] bg-white p-6 shadow-card space-y-6">
        {/* 新建项目表单 */}
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-ink text-white">
              <PlusCircle aria-hidden="true" size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-ink">
                新项目
              </h2>
              <p className="text-xs text-slate-400 font-medium">项目工作空间</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="project-name"
              className="text-sm font-semibold text-slate-600"
            >
              标题
            </label>
            <input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Atlas 账单改进"
              className="h-10 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-sm text-ink outline-none transition-all duration-300 focus:border-black/30 focus:ring-2 focus:ring-black/[0.03]"
              maxLength={120}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="project-description"
              className="text-sm font-semibold text-slate-600"
            >
              简介
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="关于账单、定价及结账流程的重新设计。"
              className="min-h-24 w-full resize-none rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 text-sm leading-6 text-ink outline-none transition-all duration-300 focus:border-black/30 focus:ring-2 focus:ring-black/[0.03]"
              maxLength={1000}
              disabled={isSubmitting}
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition-all duration-300 ease-smooth hover:bg-black/85 focus:outline-none focus:ring-1 focus:ring-black/20 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? (
              <LoaderCircle aria-hidden="true" size={15} className="animate-spin" />
            ) : (
              <PlusCircle aria-hidden="true" size={15} />
            )}
            {isSubmitting ? "创建中..." : "创建项目"}
          </button>
        </form>

        {/* Atlas Demo 快捷导入 */}
        <div className="border-t border-black/[0.06] pt-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg border border-black/[0.06] bg-slate-50 text-slate-600">
              <Sparkles aria-hidden="true" size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-ink">
                Atlas Demo
              </h2>
              <p className="text-xs text-slate-400 font-medium">包含示例文件及评测用例</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleImportAtlasDemo}
            disabled={isImportingDemo}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-4 text-sm font-semibold text-ink transition-all duration-300 ease-smooth hover:bg-black/[0.02] focus:outline-none focus:ring-1 focus:ring-black/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          >
            {isImportingDemo ? (
              <LoaderCircle
                aria-hidden="true"
                size={15}
                className="animate-spin"
              />
            ) : (
              <Sparkles aria-hidden="true" size={15} />
            )}
            {isImportingDemo ? "导入中..." : "导入演示数据"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function toDemoImportError(code: string, fallbackMessage: string) {
  if (code === "DEMO_IMPORT_UNAVAILABLE") {
    return "请先配置 OPENAI_API_KEY，并重新启动 dev server 后再导入 Atlas Demo。";
  }

  return fallbackMessage || "无法导入 Atlas demo。";
}
