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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-normal text-ink">
              项目列表
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              为每个项目记忆创建一个工作区.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700">
            <Layers3 aria-hidden="true" size={18} className="text-teal-600" />
            {projects.length} 个项目
          </div>
        </div>

        {projects.length > 0 ? (
          <div className="grid gap-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group grid gap-4 rounded-lg border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0 space-y-2">
                  <h2 className="truncate text-lg font-semibold tracking-normal text-ink">
                    {project.name}
                  </h2>
                  <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                    {project.description ?? "暂无简介"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm text-slate-500 sm:flex-col sm:items-end">
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    <CalendarClock aria-hidden="true" size={16} />
                    {dateFormatter.format(new Date(project.updatedAt))}
                  </span>
                  <span className="inline-flex items-center gap-2 font-semibold text-teal-700">
                    打开
                    <ArrowRight
                      aria-hidden="true"
                      size={16}
                      className="transition group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center shadow-soft">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <FolderPlus aria-hidden="true" size={24} strokeWidth={2} />
            </div>
            <h2 className="text-xl font-semibold tracking-normal text-ink">
              项目列表为空.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              创建第一个工作区，以开启项目记忆流程.
            </p>
          </div>
        )}
      </section>

      <aside className="h-fit rounded-lg border border-line bg-white p-5 shadow-soft">
        <form onSubmit={handleCreateProject} className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-ink text-white">
              <PlusCircle aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-normal text-ink">
                新项目
              </h2>
              <p className="text-sm text-slate-500">项目工作空间</p>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="project-name"
              className="text-sm font-medium text-ink"
            >
              标题
            </label>
            <input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Atlas 账单改进"
              className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              maxLength={120}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="project-description"
              className="text-sm font-medium text-ink"
            >
              简介
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="账单、定价及结账流程的重新设计."
              className="min-h-28 w-full resize-y rounded-lg border border-line bg-white px-3 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              maxLength={1000}
              disabled={isSubmitting}
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <PlusCircle aria-hidden="true" size={18} />
            {isSubmitting ? "创建中..." : "创建项目"}
          </button>
        </form>

        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Sparkles aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-normal text-ink">
                Atlas Demo
              </h2>
              <p className="text-sm text-slate-500">示例项目与 eval cases</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleImportAtlasDemo}
            disabled={isImportingDemo}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-700 shadow-soft transition hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {isImportingDemo ? (
              <LoaderCircle
                aria-hidden="true"
                size={18}
                className="animate-spin"
              />
            ) : (
              <Sparkles aria-hidden="true" size={18} />
            )}
            {isImportingDemo ? "导入中..." : "导入 Atlas Demo"}
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
