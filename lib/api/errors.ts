import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "DOCUMENT_UPLOAD_ERROR"
  | "PROJECT_NOT_FOUND"
  | "UNSUPPORTED_DOCUMENT_TYPE"
  | "INTERNAL_ERROR";

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string
) {
  return NextResponse.json(
    {
      error: {
        code,
        message
      }
    },
    { status }
  );
}
