import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/errors";
import { getProjectBrief } from "@/lib/brief/service";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { projectId } = context.params;

  try {
    const brief = await getProjectBrief(projectId);

    if (!brief) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json({ brief });
  } catch (error) {
    console.error("Failed to generate project brief", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to generate project brief.");
  }
}
