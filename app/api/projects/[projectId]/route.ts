import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { apiError } from "@/lib/api/errors";
import {
  deleteProject,
  getProject,
  ProjectDeleteConfirmationError
} from "@/lib/projects/service";

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

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { projectId } = context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  try {
    const result = await deleteProject(projectId, body);

    if (!result) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        400,
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? "Invalid project deletion input."
      );
    }

    if (error instanceof ProjectDeleteConfirmationError) {
      return apiError(
        400,
        "VALIDATION_ERROR",
        "Project name confirmation does not match."
      );
    }

    console.error("Failed to delete project", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to delete project.");
  }
}
