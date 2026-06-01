"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
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

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

const statusStyles: Record<DocumentStatusDto, string> = {
  processing: "border-sky-200 bg-sky-50 text-sky-700",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700"
};

const statusLabels: Record<DocumentStatusDto, string> = {
  processing: "Processing",
  ready: "Ready",
  failed: "Failed"
};

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
      setError("Upload at least one .md or .txt document.");
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
            : "Unable to upload documents."
        );
        return;
      }

      setDocuments(payload.documents);
      setSummary(payload.summary);
      setSelectedFileCount(0);
      setFileInputKey((currentKey) => currentKey + 1);
      router.refresh();
    } catch {
      setError("Unable to upload documents.");
    } finally {
      setIsUploading(false);
    }
  }

  const summaryItems = [
    {
      label: "Total",
      value: summary.total,
      icon: Files,
      className: "border-slate-200 bg-white text-ink"
    },
    {
      label: "Ready",
      value: summary.ready,
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700"
    },
    {
      label: "Processing",
      value: summary.processing,
      icon: LoaderCircle,
      className: "border-sky-200 bg-sky-50 text-sky-700"
    },
    {
      label: "Failed",
      value: summary.failed,
      icon: AlertTriangle,
      className: "border-red-200 bg-red-50 text-red-700"
    }
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-teal-700">{projectName}</p>
            <h1 className="text-4xl font-semibold tracking-normal text-ink">
              Documents
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Uploaded source files, retrievable chunks, and extracted memory.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700">
            <Files aria-hidden="true" size={18} className="text-teal-600" />
            {summary.total} {summary.total === 1 ? "document" : "documents"}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={`rounded-lg border p-4 shadow-soft ${item.className}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{item.label}</span>
                  <Icon aria-hidden="true" size={18} />
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-normal">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {documents.length > 0 ? (
          <div className="grid gap-3">
            {documents.map((document) => (
              <article
                key={document.id}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 rounded-lg border border-line bg-white p-5 shadow-soft sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <FileText aria-hidden="true" size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold tracking-normal text-ink">
                        {document.fileName}
                      </h2>
                      <p className="truncate text-sm text-slate-500">
                        {document.mimeType}
                      </p>
                    </div>
                  </div>
                  {document.errorMessage ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                      {document.errorMessage}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 sm:flex-col sm:items-end">
                  <span
                    className={`rounded-lg border px-2 py-1 text-xs font-semibold ${statusStyles[document.status]}`}
                  >
                    {statusLabels[document.status]}
                  </span>
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    <Clock3 aria-hidden="true" size={16} />
                    {dateFormatter.format(new Date(document.createdAt))}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {document.chunkCount} chunks
                  </span>
                  <span className="font-semibold text-slate-700">
                    {document.extractedMemoryCount} memories
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center shadow-soft">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <FileText aria-hidden="true" size={24} strokeWidth={2} />
            </div>
            <h2 className="text-xl font-semibold tracking-normal text-ink">
              No documents yet
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Upload project notes, decisions, or meeting records.
            </p>
          </div>
        )}
      </section>

      <aside className="min-w-0 h-fit rounded-lg border border-line bg-white p-5 shadow-soft">
        <form onSubmit={handleUpload} className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-ink text-white">
              <UploadCloud aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-normal text-ink">
                Upload documents
              </h2>
              <p className="text-sm text-slate-500">.md and .txt files</p>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="document-files"
              className="text-sm font-medium text-ink"
            >
              Files
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
              className="block min-w-0 w-full rounded-lg border border-line bg-white px-3 py-3 text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            <p className="text-sm text-slate-500">
              {selectedFileCount > 0
                ? `${selectedFileCount} selected`
                : "No files selected"}
            </p>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <UploadCloud aria-hidden="true" size={18} />
            {isUploading ? "Uploading" : "Upload"}
          </button>
        </form>
      </aside>
    </div>
  );
}
