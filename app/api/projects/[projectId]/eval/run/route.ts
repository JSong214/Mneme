import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/errors";
import {
  EvalCaseNotFoundError,
  EvalUnavailableError,
  getEvalDebugMessage,
  runProjectEval
} from "@/lib/eval/service";
import { runEvalSchema } from "@/lib/eval/schemas";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { projectId } = context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsedBody = runEvalSchema.safeParse(body);

  if (!parsedBody.success) {
    const message =
      parsedBody.error.issues[0]?.message ?? "Eval run request is invalid.";

    return apiError(400, "VALIDATION_ERROR", message);
  }

  try {
    const result = await runProjectEval(projectId, parsedBody.data);

    if (!result) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof EvalCaseNotFoundError) {
      return apiError(404, "EVAL_CASE_NOT_FOUND", "Eval case was not found.");
    }

    if (error instanceof EvalUnavailableError) {
      return apiError(
        409,
        "EVAL_UNAVAILABLE",
        "Upload and ingest documents before running evals."
      );
    }

    console.error("Eval run failed", getEvalDebugMessage(error));
    return apiError(500, "INTERNAL_ERROR", "Unable to run eval.");
  }
}
