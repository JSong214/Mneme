import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/errors";
import { deleteProjectAskRun } from "@/lib/ask/service";

type RouteContext = {
  params: {
    projectId: string;
    runId: string;
  };
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { projectId, runId } = context.params;

  try {
    const result = await deleteProjectAskRun(projectId, runId);

    if (!result) {
      return apiError(404, "ASK_RUN_NOT_FOUND", "Ask run was not found.");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to delete Ask run", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to delete Ask run.");
  }
}