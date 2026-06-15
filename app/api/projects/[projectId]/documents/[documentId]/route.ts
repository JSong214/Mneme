import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/errors";
import { getProjectDocumentDetail } from "@/lib/documents/service";

type RouteContext = {
  params: {
    projectId: string;
    documentId: string;
  };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { projectId, documentId } = context.params;

  try {
    const documentDetail = await getProjectDocumentDetail(projectId, documentId);

    if (!documentDetail) {
      return apiError(404, "DOCUMENT_NOT_FOUND", "Document was not found.");
    }

    return NextResponse.json({ documentDetail });
  } catch (error) {
    console.error("Failed to load document detail", error);
    return apiError(500, "INTERNAL_ERROR", "Unable to load document detail.");
  }
}
