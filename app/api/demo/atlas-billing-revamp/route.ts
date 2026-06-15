import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";
import {
  AtlasDemoImportUnavailableError,
  getAtlasDemoImportDebugMessage,
  importAtlasDemo
} from "@/lib/demo/atlas";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await importAtlasDemo();

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    if (error instanceof AtlasDemoImportUnavailableError) {
      return apiError(
        409,
        "DEMO_IMPORT_UNAVAILABLE",
        "Configure OPENAI_API_KEY before importing the Atlas demo."
      );
    }

    console.error("Atlas demo import failed", getAtlasDemoImportDebugMessage(error));
    return apiError(500, "INTERNAL_ERROR", "Unable to import Atlas demo.");
  }
}
