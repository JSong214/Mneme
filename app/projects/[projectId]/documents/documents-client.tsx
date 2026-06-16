"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Files,
  LoaderCircle,
  UploadCloud
} from "lucide-react";
import type {
  DocumentDto,
  DocumentStatusDto,
  DocumentSummaryDto,
  ProjectDocumentsDto
} from "@/lib/documents/types";

type DocumentsClientProps = {
  projectId: string;
  projectName: string;
  initialDocuments: DocumentDto[];
  initialSummary: DocumentSummaryDto;
};

type ApiDocumentsResponse =
  | ProjectDocumentsDto
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
  hour: "numeric",
  minute: "2-digit"
});

// 精细小徽章边框样式，去除带彩色背景
const statusStyles: Record<DocumentStatusDto, string> = {
  processing: "border-black/[0.06] bg-slate-50 text-slate-500",
  ready: "border-black/[0.06] bg-slate-50 text-slate-800",
  failed: "border-black/[0.06] bg-slate-50 text-red-600"
};

const statusLabels: Record<DocumentStatusDto, string> = {
  processing: "处理中",
  ready: "可用",
  failed: "失败"
};

/**
 * 文档管理客户端页面组件
 * 展示文档列表、统计数据及上传表单，运用平滑错落的入场动画。
 */
export function DocumentsClient({
  projectId,
  projectName,
  initialDocuments,
  initialSummary
}: DocumentsClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [summary, setSummary] = useState(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(0);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const files = Array.from(fileInputRef.current?.files ?? []);

    if (files.length === 0) {
      setError("请至少上传一个 .md 或 .txt 文档。");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as ApiDocumentsResponse;

      if (!response.ok || "error" in payload) {
        setError(
          "error" in payload
            ? payload.error.message
            : "无法上传文档。"
        );
        return;
      }

      setDocuments(payload.documents);
      setSummary(payload.summary);
      setSelectedFileCount(0);
      setFileInputKey((currentKey) => currentKey + 1);
      router.refresh();
    } catch {
      setError("无法上传文档。");
    } finally {
      setIsUploading(false);
    }
  }

  const summaryItems = [
    {
      label: "总数",
      value: summary.total,
      icon: Files,
      className: "border-black/[0.06] bg-white text-ink"
    },
    {
      label: "可用",
      value: summary.ready,
      icon: CheckCircle2,
      className: "border-black/[0.06] bg-white text-slate-700"
    },
    {
      label: "处理中",
      value: summary.processing,
      icon: LoaderCircle,
      className: "border-black/[0.06] bg-white text-slate-700"
    },
    {
      label: "失败",
      value: summary.failed,
      icon: AlertTriangle,
      className: "border-black/[0.06] bg-white text-red-600"
    }
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{projectName}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              文档
            </h1>
            <p className="max-w-2xl text-sm text-slate-500">
              已上传的源文件、可检索片段和提取出的项目记忆。
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3.5 py-2 text-sm font-semibold text-slate-600">
            <Files aria-hidden="true" size={15} className="text-slate-400" />
            {summary.total} 个文档
          </div>
        </div>

        {/* 顶部统计栏 */}
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
                  <span className="text-sm font-semibold text-slate-400">{item.label}</span>
                  <Icon aria-hidden="true" size={14} className="text-slate-400" />
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* 文档列表卡片 */}
        {documents.length > 0 ? (
          <div className="grid gap-4 animate-fade-in-up delay-200">
            {documents.map((document, index) => (
              <article
                key={document.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in-up grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 rounded-xl border border-black/[0.06] bg-white p-6 shadow-card transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-black/20 hover:shadow-premium sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-black/[0.06] bg-slate-50 text-slate-600">
                      <FileText aria-hidden="true" size={16} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold tracking-tight text-ink">
                        {document.fileName}
                      </h2>
                      <p className="truncate text-xs font-medium text-slate-400">
                        {document.mimeType}
                      </p>
                    </div>
                  </div>
                  {document.errorMessage ? (
                    <p className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600">
                      {document.errorMessage}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3.5 text-sm text-slate-400 sm:flex-col sm:items-end">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${statusStyles[document.status]}`}
                  >
                    {document.status === "processing" && (
                      <span className="size-1.5 rounded-full bg-slate-400 animate-status-pulse" />
                    )}
                    {document.status === "ready" && (
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    )}
                    {document.status === "failed" && (
                      <span className="size-1.5 rounded-full bg-red-500" />
                    )}
                    {statusLabels[document.status]}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-400">
                    <Clock3 aria-hidden="true" size={14} />
                    {dateFormatter.format(new Date(document.createdAt))}
                  </span>
                  <span className="font-semibold text-slate-600 text-sm">
                    {document.chunkCount} 个片段
                  </span>
                  <span className="font-semibold text-slate-600 text-sm">
                    {document.extractedMemoryCount} 条记忆
                  </span>
                  <Link
                    href={`/projects/${projectId}/documents/${document.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-2.5 py-1 font-semibold text-ink transition-all duration-300 ease-smooth hover:bg-black/[0.02] focus:outline-none text-xs"
                  >
                    <ExternalLink aria-hidden="true" size={12} />
                    查看来源
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.08] bg-white px-6 py-12 text-center shadow-card animate-fade-in-up delay-200">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-black/[0.06] bg-slate-50 text-slate-500">
              <FileText aria-hidden="true" size={20} strokeWidth={1.5} />
            </div>
            <h2 className="text-base font-semibold tracking-tight text-ink">
              暂无文档
            </h2>
            <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-400">
              上传项目笔记、决策记录或会议纪要，以开启记忆提取。
            </p>
          </div>
        )}
      </section>

      {/* 右侧上传文档 */}
      <aside className="min-w-0 h-fit rounded-xl border border-black/[0.06] bg-white p-6 shadow-card">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-ink text-white">
              <UploadCloud aria-hidden="true" size={18} />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-ink">
                上传文档
              </h2>
              <p className="text-xs text-slate-400">支持 .md 和 .txt 文件</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="document-files"
              className="text-sm font-semibold text-slate-600"
            >
              文件选择
            </label>
            <input
              key={fileInputKey}
              ref={fileInputRef}
              id="document-files"
              name="files"
              type="file"
              multiple
              accept=".md,.txt,text/markdown,text/plain"
              onChange={(event) =>
                setSelectedFileCount(event.currentTarget.files?.length ?? 0)
              }
              disabled={isUploading}
              className="block min-w-0 w-full rounded-lg border border-black/[0.08] bg-white p-2 text-xs text-ink outline-none transition-all duration-300 focus:border-black/30 focus:ring-2 focus:ring-black/[0.03] file:mr-2 file:rounded-md file:border-0 file:bg-slate-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            <p className="text-xs font-medium text-slate-400">
              {selectedFileCount > 0
                ? `已选择 ${selectedFileCount} 个文件`
                : "未选择任何文件"}
            </p>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition-all duration-300 ease-smooth hover:bg-black/85 focus:outline-none focus:ring-1 focus:ring-black/20 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isUploading ? (
              <LoaderCircle aria-hidden="true" size={14} className="animate-spin" />
            ) : (
              <UploadCloud aria-hidden="true" size={14} />
            )}
            {isUploading ? "上传中..." : "上传文件"}
          </button>
        </form>
      </aside>
    </div>
  );
}
