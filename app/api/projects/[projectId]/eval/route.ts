import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/errors";
import {
  createProjectEvalCase,
  getEvalDebugMessage,
  listProjectEval
} from "@/lib/eval/service";
import { createEvalCaseSchema } from "@/lib/eval/schemas";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { projectId } = context.params;

  try {
    const result = await listProjectEval(projectId);

    if (!result) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list eval cases", getEvalDebugMessage(error));
    return apiError(500, "INTERNAL_ERROR", "Unable to list eval cases.");
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { projectId } = context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsedBody = createEvalCaseSchema.safeParse(body);

  if (!parsedBody.success) {
    const message =
      parsedBody.error.issues[0]?.message ?? "Eval case is invalid.";

    return apiError(400, "VALIDATION_ERROR", message);
  }

  try {
    const result = await createProjectEvalCase(projectId, parsedBody.data);

    if (!result) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create eval case", getEvalDebugMessage(error));
    return apiError(500, "INTERNAL_ERROR", "Unable to create eval case.");
  }
}
