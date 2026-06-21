"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "取消",
  isConfirming = false,
  children,
  onConfirm,
  onClose
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isConfirming) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirming, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md animate-fade-in-up rounded-xl border border-red-100 bg-white p-5 shadow-soft"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600">
              <AlertTriangle aria-hidden="true" size={17} />
            </span>
            <div className="min-w-0">
              <h2
                id="confirm-dialog-title"
                className="text-base font-semibold tracking-tight text-ink"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-description"
                className="mt-1.5 text-sm leading-6 text-slate-500"
              >
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="关闭确认框"
            onClick={onClose}
            disabled={isConfirming}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-ink focus:outline-none focus:ring-1 focus:ring-black/20 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            <X aria-hidden="true" size={15} />
          </button>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-black/[0.08] bg-white px-4 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-black/20 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-300 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isConfirming ? (
              <LoaderCircle
                aria-hidden="true"
                size={15}
                className="animate-spin"
              />
            ) : null}
            {isConfirming ? "处理中..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
