import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/errors";
import { getProject } from "@/lib/projects/service";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { projectId } = context.params;

  try {
    const project = await getProject(projectId);

    if (!project) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Failed to get project", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to get project.");
  }
}
