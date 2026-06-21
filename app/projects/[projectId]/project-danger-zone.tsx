"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";

type ProjectDangerZoneProps = {
  projectId: string;
  projectName: string;
  summary: {
    documents: number;
    chunks: number;
    memories: number;
    askRuns: number;
    evalCases: number;
    evalRunsWithResults: number;
  };
};

type DeleteProjectResponse =
  | {
      deletedProjectId: string;
    }
  | {
      error: {
        code: string;
        message: string;
      };
    };

export function ProjectDangerZone({
  projectId,
  projectName,
  summary
}: ProjectDangerZoneProps) {
  const router = useRouter();
  const [confirmationName, setConfirmationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isConfirmed = confirmationName.trim() === projectName;

  async function handleDeleteProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isConfirmed) {
      setError("请输入完整项目名后再删除。");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          confirmationName
        })
      });
      const payload = (await response.json()) as DeleteProjectResponse;

      if (!response.ok || "error" in payload) {
        setError(
          "error" in payload ? payload.error.message : "无法删除项目。"
        );
        return;
      }

      router.push("/projects");
      router.refresh();
    } catch {
      setError("无法删除项目。");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="rounded-xl border border-red-100 bg-white p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600">
              <AlertTriangle aria-hidden="true" size={17} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                Danger Zone
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                永久删除项目
              </h2>
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            删除项目会一并删除所有文档、chunks、结构化记忆、Ask runs、Eval cases 和 Eval runs。该操作不可恢复。
          </p>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <DangerMetric label="文档" value={summary.documents} />
            <DangerMetric label="Chunks" value={summary.chunks} />
            <DangerMetric label="记忆" value={summary.memories} />
            <DangerMetric label="Ask" value={summary.askRuns} />
            <DangerMetric label="Eval cases" value={summary.evalCases} />
            <DangerMetric label="已运行 eval" value={summary.evalRunsWithResults} />
          </div>
        </div>

        <form
          onSubmit={handleDeleteProject}
          className="min-w-0 space-y-3 lg:w-80"
        >
          <label
            htmlFor="project-delete-confirmation"
            className="text-xs font-semibold text-slate-600"
          >
            输入项目名确认：{projectName}
          </label>
          <input
            id="project-delete-confirmation"
            value={confirmationName}
            onChange={(event) => setConfirmationName(event.currentTarget.value)}
            disabled={isDeleting}
            className="h-10 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-sm text-ink outline-none transition-all duration-300 focus:border-red-300 focus:ring-2 focus:ring-red-50 disabled:cursor-not-allowed disabled:bg-slate-50"
            placeholder={projectName}
          />
          {error ? (
            <p className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!isConfirmed || isDeleting}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-600 px-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-300 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isDeleting ? (
              <LoaderCircle aria-hidden="true" size={15} className="animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" size={15} />
            )}
            {isDeleting ? "删除中..." : "永久删除项目"}
          </button>
        </form>
      </div>
    </section>
  );
}

function DangerMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-red-100/70 bg-red-50/30 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-red-700">{value}</p>
    </div>
  );
}