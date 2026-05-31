import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/errors";
import { DOCUMENT_FILE_FIELD, DocumentUploadError } from "@/lib/documents/schemas";
import {
  listProjectDocuments,
  uploadProjectDocuments
} from "@/lib/documents/service";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { projectId } = context.params;

  try {
    const result = await listProjectDocuments(projectId);

    if (!result) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list documents", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to list documents.");
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { projectId } = context.params;
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return apiError(
      400,
      "DOCUMENT_UPLOAD_ERROR",
      "Request body must be multipart form data."
    );
  }

  const files = formData
    .getAll(DOCUMENT_FILE_FIELD)
    .filter((value): value is File => typeof value !== "string");

  try {
    const result = await uploadProjectDocuments(projectId, files);

    if (!result) {
      return apiError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof DocumentUploadError) {
      return apiError(400, error.code, error.message);
    }

    console.error("Failed to upload documents", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to upload documents.");
  }
}
