import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/errors";
import { listProjectMemories } from "@/lib/memories/service";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { projectId } = context.params;

  try {
    const result = await listProjectMemories(projectId);

    if (!result) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list memories", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to list memories.");
  }
}
