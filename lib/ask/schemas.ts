import { z } from "zod";
import { MAX_ASK_QUESTION_LENGTH } from "@/lib/ask/constants";

export const askQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question is required.")
    .max(MAX_ASK_QUESTION_LENGTH, "Question is too long.")
});

export const askAnswerSchema = z.object({
  answer: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]),
  evidence: z.array(
    z.object({
      file: z.string().min(1),
      date: z.string(),
      quote: z.string().min(1),
      relevance: z.string().min(1),
      documentId: z.string().min(1).optional(),
      chunkId: z.string().min(1).optional(),
      chunkIndex: z.number().int().nonnegative().optional()
    })
  ),
  missingInfo: z.array(z.string()),
  related: z.object({
    decisions: z.array(z.string()),
    actionItems: z.array(z.string()),
    openQuestions: z.array(z.string()),
    risks: z.array(z.string())
  })
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
export type AskAnswer = z.infer<typeof askAnswerSchema>;
export type AskConfidence = AskAnswer["confidence"];

export const askAnswerJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "confidence", "evidence", "missingInfo", "related"],
  properties: {
    answer: { type: "string" },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"]
    },
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["file", "date", "quote", "relevance"],
        properties: {
          file: { type: "string" },
          date: { type: "string" },
          quote: { type: "string" },
          relevance: { type: "string" }
        }
      }
    },
    missingInfo: {
      type: "array",
      items: { type: "string" }
    },
    related: {
      type: "object",
      additionalProperties: false,
      required: ["decisions", "actionItems", "openQuestions", "risks"],
      properties: {
        decisions: {
          type: "array",
          items: { type: "string" }
        },
        actionItems: {
          type: "array",
          items: { type: "string" }
        },
        openQuestions: {
          type: "array",
          items: { type: "string" }
        },
        risks: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  }
};
