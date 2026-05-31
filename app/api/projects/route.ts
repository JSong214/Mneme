import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { apiError } from "@/lib/api/errors";
import { createProject, listProjects } from "@/lib/projects/service";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to list projects", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to list projects.");
  }
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  try {
    const project = await createProject(payload);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        400,
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? "Invalid project input."
      );
    }

    console.error("Failed to create project", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to create project.");
  }
}
