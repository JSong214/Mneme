import { z } from "zod";
import {
  MAX_EVAL_CASE_QUESTION_LENGTH,
  MAX_EVAL_LIST_ITEM_LENGTH,
  MAX_EVAL_LIST_ITEMS,
} from "@/lib/eval/constants";

const evalListItemSchema = z
  .string()
  .trim()
  .min(1, "Expected item is required.")
  .max(MAX_EVAL_LIST_ITEM_LENGTH, "Expected item is too long.");

export const createEvalCaseSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question is required.")
    .max(MAX_EVAL_CASE_QUESTION_LENGTH, "Question is too long."),
  expectedSources: z
    .array(evalListItemSchema)
    .min(1, "At least one expected source is required.")
    .max(MAX_EVAL_LIST_ITEMS, `Use ${MAX_EVAL_LIST_ITEMS} or fewer sources.`),
  expectedFacts: z
    .array(evalListItemSchema)
    .min(1, "At least one expected fact is required.")
    .max(MAX_EVAL_LIST_ITEMS, `Use ${MAX_EVAL_LIST_ITEMS} or fewer facts.`),
});

export const runEvalSchema = z
  .object({
    evalCaseId: z.string().trim().min(1).optional(),
  })
  .strict();

export const evalRetrievedSourceSchema = z.object({
  fileName: z.string().min(1),
  documentId: z.string().min(1),
  chunkId: z.string().min(1),
  chunkIndex: z.number().int().nonnegative(),
  distance: z.number(),
  quote: z.string(),
});

export const evalRetrievedSourcesSchema = z.array(evalRetrievedSourceSchema);

export const groundednessJudgeSchema = z.object({
  groundednessScore: z.number().int().min(1).max(5),
});

export const groundednessJudgeJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["groundednessScore"],
  properties: {
    groundednessScore: {
      type: "integer",
      minimum: 1,
      maximum: 5,
    },
  },
};

export type CreateEvalCaseInput = z.infer<typeof createEvalCaseSchema>;
export type RunEvalInput = z.infer<typeof runEvalSchema>;
export type GroundednessJudgeResult = z.infer<typeof groundednessJudgeSchema>;
