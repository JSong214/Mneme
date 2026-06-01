import { z } from "zod";
import { createStructuredResponseText } from "@/lib/ai/openai";
import type { TextChunk } from "@/lib/ingestion/chunking";

const MAX_EXTRACTION_GROUP_CHARACTERS = 24_000;

const extractionResultSchema = z.object({
  decisions: z.array(
    z.object({
      title: z.string().min(1),
      summary: z.string().min(1),
      rationale: z.string(),
      date: z.string(),
      participants: z.array(z.string()),
      sourceQuote: z.string().min(1)
    })
  ),
  actionItems: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      owner: z.string(),
      dueDate: z.string(),
      status: z.enum(["open", "in_progress", "done"]),
      sourceQuote: z.string().min(1)
    })
  ),
  openQuestions: z.array(
    z.object({
      question: z.string().min(1),
      context: z.string(),
      owner: z.string(),
      sourceQuote: z.string().min(1)
    })
  ),
  risks: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      severity: z.enum(["low", "medium", "high"]),
      mitigation: z.string(),
      sourceQuote: z.string().min(1)
    })
  )
});

export type StructuredMemoryExtraction = z.infer<typeof extractionResultSchema>;

const memoryExtractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["decisions", "actionItems", "openQuestions", "risks"],
  properties: {
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "summary",
          "rationale",
          "date",
          "participants",
          "sourceQuote"
        ],
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          rationale: { type: "string" },
          date: { type: "string" },
          participants: {
            type: "array",
            items: { type: "string" }
          },
          sourceQuote: { type: "string" }
        }
      }
    },
    actionItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "description",
          "owner",
          "dueDate",
          "status",
          "sourceQuote"
        ],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          owner: { type: "string" },
          dueDate: { type: "string" },
          status: {
            type: "string",
            enum: ["open", "in_progress", "done"]
          },
          sourceQuote: { type: "string" }
        }
      }
    },
    openQuestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "context", "owner", "sourceQuote"],
        properties: {
          question: { type: "string" },
          context: { type: "string" },
          owner: { type: "string" },
          sourceQuote: { type: "string" }
        }
      }
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "description",
          "severity",
          "mitigation",
          "sourceQuote"
        ],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"]
          },
          mitigation: { type: "string" },
          sourceQuote: { type: "string" }
        }
      }
    }
  }
};

export async function extractStructuredMemories(
  documentName: string,
  chunks: TextChunk[]
): Promise<StructuredMemoryExtraction> {
  const groups = buildExtractionGroups(chunks);
  const results: StructuredMemoryExtraction[] = [];

  for (let index = 0; index < groups.length; index += 1) {
    const responseText = await createStructuredResponseText(
      [
        {
          role: "system",
          content:
            "Extract structured project memories from source text. Include only facts that are explicit in the source. Use empty strings when a field is unknown. Keep sourceQuote as a short exact quote from the source. Return no prose outside the JSON schema."
        },
        {
          role: "user",
          content: [
            `Document: ${documentName}`,
            `Chunk group: ${index + 1} of ${groups.length}`,
            "Extract decisions, action items, open questions, and risks from this source text.",
            "Source text:",
            groups[index]
          ].join("\n\n")
        }
      ],
      memoryExtractionJsonSchema,
      "project_memory_extraction"
    );
    const parsedJson = JSON.parse(responseText) as unknown;
    results.push(extractionResultSchema.parse(parsedJson));
  }

  return mergeExtractions(results);
}

function buildExtractionGroups(chunks: TextChunk[]): string[] {
  const groups: string[] = [];
  let currentGroup = "";

  for (const chunk of chunks) {
    const chunkText = `Chunk ${chunk.chunkIndex + 1}\n${chunk.content}`;
    const nextGroup = currentGroup
      ? `${currentGroup}\n\n---\n\n${chunkText}`
      : chunkText;

    if (nextGroup.length <= MAX_EXTRACTION_GROUP_CHARACTERS) {
      currentGroup = nextGroup;
      continue;
    }

    if (currentGroup) {
      groups.push(currentGroup);
    }

    currentGroup = chunkText;
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

function mergeExtractions(
  results: StructuredMemoryExtraction[]
): StructuredMemoryExtraction {
  return {
    decisions: dedupeBy(
      results.flatMap((result) => result.decisions),
      (decision) => `${decision.title}|${decision.sourceQuote}`
    ),
    actionItems: dedupeBy(
      results.flatMap((result) => result.actionItems),
      (actionItem) => `${actionItem.title}|${actionItem.sourceQuote}`
    ),
    openQuestions: dedupeBy(
      results.flatMap((result) => result.openQuestions),
      (openQuestion) => `${openQuestion.question}|${openQuestion.sourceQuote}`
    ),
    risks: dedupeBy(
      results.flatMap((result) => result.risks),
      (risk) => `${risk.title}|${risk.sourceQuote}`
    )
  };
}

function dedupeBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seenKeys = new Set<string>();
  const dedupedItems: T[] = [];

  for (const item of items) {
    const key = getKey(item).toLowerCase();

    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    dedupedItems.push(item);
  }

  return dedupedItems;
}
