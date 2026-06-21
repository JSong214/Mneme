"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import type { ProjectDocumentsDto } from "@/lib/documents/types";

type DeleteDocumentButtonProps = {
  projectId: string;
  documentId: string;
  fileName: string;
  compact?: boolean;
  redirectHref?: string;
  onDeleted?: (result: ProjectDocumentsDto) => void;
  onError?: (message: string) => void;
};

type DeleteDocumentResponse =
  | ProjectDocumentsDto
  | {
      error: {
        code: string;
        message: string;
      };
    };

export function DeleteDocumentButton({
  projectId,
  documentId,
  fileName,
  compact = false,
  redirectHref,
  onDeleted,
  onError
}: DeleteDocumentButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleDelete() {
    setLocalError(null);
    onError?.("");

    const confirmed = window.confirm(
      [
        `确定要永久删除文档「${fileName}」吗？`,
        "这会删除该文档的 chunks 和结构化项目记忆。",
        "历史问答的答案文本和 quote 快照会保留，但查看原文的来源链接会失效。"
      ].join("\n\n")
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/documents/${documentId}`,
        {
          method: "DELETE"
        }
      );
      const payload = (await response.json()) as DeleteDocumentResponse;

      if (!response.ok || "error" in payload) {
        const message =
          "error" in payload ? payload.error.message : "无法删除文档。";
        setLocalError(message);
        onError?.(message);
        return;
      }

      onDeleted?.(payload);

      if (redirectHref) {
        router.push(redirectHref);
      }

      router.refresh();
    } catch {
      setLocalError("无法删除文档。");
      onError?.("无法删除文档。");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={compact ? "inline-flex" : "space-y-2"}>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className={
          compact
            ? "inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 transition-all duration-300 hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-200 disabled:cursor-not-allowed disabled:text-slate-300"
            : "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-white px-4 text-sm font-semibold text-red-600 transition-all duration-300 hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-200 disabled:cursor-not-allowed disabled:text-slate-300"
        }
      >
        {isDeleting ? (
          <LoaderCircle aria-hidden="true" size={14} className="animate-spin" />
        ) : (
          <Trash2 aria-hidden="true" size={14} />
        )}
        {isDeleting ? "删除中..." : compact ? "删除" : "删除文档"}
      </button>
      {!compact && localError ? (
        <p className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600">
          {localError}
        </p>
      ) : null}
    </div>
  );
}