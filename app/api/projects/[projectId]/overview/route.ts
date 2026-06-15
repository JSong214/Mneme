import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/errors";
import { getProjectOverview } from "@/lib/projects/service";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { projectId } = context.params;

  try {
    const overview = await getProjectOverview(projectId);

    if (!overview) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json({ overview });
  } catch (error) {
    console.error("Failed to load project overview", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to load project overview.");
  }
}
