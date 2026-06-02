import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/errors";
import {
  askProjectQuestion,
  AskUnavailableError,
  getAskDebugMessage,
  listProjectAskRuns
} from "@/lib/ask/service";
import { askQuestionSchema } from "@/lib/ask/schemas";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { projectId } = context.params;

  try {
    const result = await listProjectAskRuns(projectId);

    if (!result) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list Ask runs", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to list Ask runs.");
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

  const parsedBody = askQuestionSchema.safeParse(body);

  if (!parsedBody.success) {
    const message =
      parsedBody.error.issues[0]?.message ?? "Question is required.";

    return apiError(400, "VALIDATION_ERROR", message);
  }

  try {
    const run = await askProjectQuestion(projectId, parsedBody.data.question);

    if (!run) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    if (error instanceof AskUnavailableError) {
      return apiError(
        409,
        "ASK_UNAVAILABLE",
        "Upload and ingest documents before asking questions."
      );
    }

    console.error("Ask pipeline failed", getAskDebugMessage(error));
    return apiError(500, "INTERNAL_ERROR", "Unable to answer question.");
  }
}
