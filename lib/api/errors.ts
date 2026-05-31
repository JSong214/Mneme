import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "PROJECT_NOT_FOUND"
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
