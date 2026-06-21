"use client";

import { useState } from "react";
import {
  BadgeCheck,
  ClipboardCheck,
  Copy,
  Database,
  Download,
  FileText,
  MessageSquareText,
  Radar,
  TableProperties,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProjectBriefDto } from "@/lib/brief/types";

type BriefClientProps = {
  brief: ProjectBriefDto;
};

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * 项目简报页面客户端组件，提供 Markdown 复制和下载能力。
 */
export function BriefClient({ brief }: BriefClientProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const summaryItems = [
    {
      label: "文档",
      value: `${brief.summary.readyDocumentCount}/${brief.summary.documentCount}`,
      description: `${brief.summary.failedDocumentCount} 个失败`,
      icon: FileText,
    },
    {
      label: "片段",
      value: brief.summary.chunkCount,
      description: "retrievable chunks",
      icon: Database,
    },
    {
      label: "记忆",
      value: brief.summary.memoryCount,
      description: "structured memories",
      icon: TableProperties,
    },
    {
      label: "问答",
      value: brief.summary.askRunCount,
      description: "Ask runs",
      icon: MessageSquareText,
    },
    {
      label: "评估",
      value: `${brief.summary.evalRunsCompleted}/${brief.summary.evalCaseCount}`,
      description: "Eval runs",
      icon: Radar,
    },
    {
      label: "依据分",
      value: brief.summary.averageGroundednessScore ?? "未评估",
      description: "groundedness",
      icon: BadgeCheck,
    },
  ];

  async function handleCopy() {
    const copied = await copyMarkdownToClipboard(brief.markdown);

    setCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  function handleDownload() {
    const blob = new Blob([brief.markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${toSafeFileName(brief.project.name)}-brief.md`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-w-0 space-y-6">
      <main className="min-w-0 space-y-6">
        <section className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {brief.project.name}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-ink">
                项目简报
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                面向 onboarding、项目复盘和作品集展示的 Markdown 交付物。
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.06] bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
              <ClipboardCheck aria-hidden="true" size={14} />
              {formatDateTime(brief.generatedAt)}
            </span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryItems.map((item, index) => (
            <SummaryCard key={item.label} item={item} index={index} />
          ))}
        </section>

        <section className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-card">
          <div className="flex flex-col gap-3 border-b border-black/[0.05] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-ink">
                Markdown 预览
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                内容直接来自当前项目数据，不额外调用 AI 生成。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 text-xs font-semibold text-ink transition-all duration-300 hover:bg-black/[0.02] focus:outline-none focus:ring-1 focus:ring-black/20"
              >
                <Copy aria-hidden="true" size={13} />
                {copyState === "copied"
                  ? "已复制"
                  : copyState === "failed"
                    ? "复制失败"
                    : "复制"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-semibold text-white transition-all duration-300 hover:bg-black/85 focus:outline-none focus:ring-1 focus:ring-black/20"
              >
                <Download aria-hidden="true" size={13} />
                下载 .md
              </button>
            </div>
          </div>

          <pre className="mt-4 max-h-[720px] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-black/[0.05] bg-slate-50 p-4 text-xs leading-6 text-slate-600">
            {brief.markdown}
          </pre>
        </section>
      </main>
    </div>
  );
}

// 复制项目简报，优先使用 Clipboard API，失败时回退到隐藏 textarea。
async function copyMarkdownToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // 继续尝试兼容权限更严格的浏览器环境。
    }
  }

  const textarea = document.createElement("textarea");

  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.append(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

function SummaryCard({
  item,
  index,
}: {
  item: {
    label: string;
    value: string | number;
    description: string;
    icon: LucideIcon;
  };
  index: number;
}) {
  const Icon = item.icon;

  return (
    <article
      style={{ animationDelay: `${index * 60}ms` }}
      className="animate-fade-in-up rounded-xl border border-black/[0.06] bg-white p-5 shadow-card"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-400">
          {item.label}
        </span>
        <Icon aria-hidden="true" size={14} className="text-slate-400" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
        {item.value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{item.description}</p>
    </article>
  );
}

function toSafeFileName(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
