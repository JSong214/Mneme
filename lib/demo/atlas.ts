import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { processDocumentIngestion } from "@/lib/ingestion/service";
import { toProjectDto, type ProjectDto } from "@/lib/projects/types";

const ATLAS_PROJECT_NAME = "Atlas Billing Revamp";
const ATLAS_PROJECT_DESCRIPTION =
  "Fictional SaaS project for redesigning billing, pricing, checkout, and migration workflows.";
const ATLAS_DEMO_DIR = path.join(
  process.cwd(),
  "demo-data",
  "atlas-billing-revamp"
);
const ATLAS_EVAL_PATH = path.join(
  process.cwd(),
  "evals",
  "atlas-billing-revamp.json"
);

const evalSeedCaseSchema = z.object({
  question: z.string().trim().min(1),
  expectedSources: z.array(z.string().trim().min(1)).min(1),
  expectedFacts: z.array(z.string().trim().min(1)).min(1)
});

const evalSeedCasesSchema = z.array(evalSeedCaseSchema);

type AtlasEvalSeedCase = z.infer<typeof evalSeedCaseSchema>;

export type AtlasDemoImportResultDto = {
  project: ProjectDto;
  documentsCreated: number;
  documentsSkipped: number;
  documentsReprocessed: number;
  documentsReady: number;
  documentsFailed: number;
  evalCasesCreated: number;
  evalCasesSkipped: number;
};

type AtlasDemoDocument = {
  fileName: string;
  rawText: string;
};

export class AtlasDemoImportUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AtlasDemoImportUnavailableError";
  }
}

// 导入内置 Atlas demo：创建项目、写入文档并复用现有摄取 pipeline。
export async function importAtlasDemo(): Promise<AtlasDemoImportResultDto> {
  if (!process.env.OPENAI_API_KEY) {
    throw new AtlasDemoImportUnavailableError(
      "OPENAI_API_KEY is required to ingest the Atlas demo documents."
    );
  }

  const [documents, evalCases] = await Promise.all([
    readAtlasDemoDocuments(),
    readAtlasEvalCases()
  ]);
  const project = await findOrCreateAtlasProject();
  let documentsCreated = 0;
  let documentsSkipped = 0;
  let documentsReprocessed = 0;
  let documentsReady = 0;
  let documentsFailed = 0;

  for (const document of documents) {
    const existingDocument = await prisma.document.findFirst({
      where: {
        projectId: project.id,
        fileName: document.fileName
      },
      select: {
        id: true,
        status: true
      }
    });

    const documentId =
      existingDocument?.id ??
      (
        await prisma.document.create({
          data: {
            projectId: project.id,
            fileName: document.fileName,
            mimeType: "text/markdown",
            rawText: document.rawText,
            status: "PROCESSING"
          },
          select: {
            id: true
          }
        })
      ).id;

    if (!existingDocument) {
      documentsCreated += 1;
    } else if (existingDocument.status === "READY") {
      documentsSkipped += 1;
      documentsReady += 1;
      continue;
    } else {
      documentsReprocessed += 1;
    }

    const ingestionResult = await processDocumentIngestion(documentId);

    if (ingestionResult?.status === "ready") {
      documentsReady += 1;
    } else {
      documentsFailed += 1;
    }
  }

  const evalSeedResult = await seedAtlasEvalCases(project.id, evalCases);
  const refreshedProject = await prisma.project.findUniqueOrThrow({
    where: {
      id: project.id
    }
  });

  return {
    project: toProjectDto(refreshedProject),
    documentsCreated,
    documentsSkipped,
    documentsReprocessed,
    documentsReady,
    documentsFailed,
    evalCasesCreated: evalSeedResult.created,
    evalCasesSkipped: evalSeedResult.skipped
  };
}

async function findOrCreateAtlasProject() {
  const existingProject = await prisma.project.findFirst({
    where: {
      name: ATLAS_PROJECT_NAME
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (existingProject) {
    return existingProject;
  }

  return prisma.project.create({
    data: {
      name: ATLAS_PROJECT_NAME,
      description: ATLAS_PROJECT_DESCRIPTION
    }
  });
}

async function readAtlasDemoDocuments(): Promise<AtlasDemoDocument[]> {
  const fileNames = (await readdir(ATLAS_DEMO_DIR))
    .filter((fileName) => fileName.endsWith(".md"))
    .sort();

  return Promise.all(
    fileNames.map(async (fileName) => ({
      fileName,
      rawText: await readFile(path.join(ATLAS_DEMO_DIR, fileName), "utf8")
    }))
  );
}

async function readAtlasEvalCases(): Promise<AtlasEvalSeedCase[]> {
  const rawJson = await readFile(ATLAS_EVAL_PATH, "utf8");
  const parsedJson = JSON.parse(rawJson) as unknown;

  return evalSeedCasesSchema.parse(parsedJson);
}

async function seedAtlasEvalCases(
  projectId: string,
  evalCases: AtlasEvalSeedCase[]
) {
  let created = 0;
  let skipped = 0;

  for (const evalCase of evalCases) {
    const existingEvalCase = await prisma.evalCase.findFirst({
      where: {
        projectId,
        question: evalCase.question
      },
      select: {
        id: true
      }
    });

    if (existingEvalCase) {
      skipped += 1;
      continue;
    }

    await prisma.evalCase.create({
      data: {
        projectId,
        question: evalCase.question,
        expectedSources: evalCase.expectedSources,
        expectedFacts: evalCase.expectedFacts
      }
    });
    created += 1;
  }

  return {
    created,
    skipped
  };
}

export function getAtlasDemoImportDebugMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Atlas demo import error.";
}
