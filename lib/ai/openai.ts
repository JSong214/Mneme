const DEFAULT_OPENAI_API_BASE_URL = "https://api.openai.com/v1";
const OPENAI_API_BASE_URL =
  process.env.OPENAI_API_BASE_URL?.replace(/\/$/, "") ??
  DEFAULT_OPENAI_API_BASE_URL;
export const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
export const OPENAI_EMBEDDING_DIMENSIONS = 1536;
export const OPENAI_EXTRACTION_MODEL = "gpt-4o-mini";

type OpenAIEmbeddingsResponse = {
  data?: Array<{
    index: number;
    embedding: number[];
  }>;
};

type OpenAIResponsesPayload = {
  output_text?: unknown;
  output?: unknown;
  usage?: unknown;
  error?: {
    message?: string;
  };
};

export type OpenAIStructuredResponse = {
  text: string;
  tokenUsage: unknown | null;
};

export class OpenAIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIServiceError";
  }
}

export async function createEmbeddings(input: string[]): Promise<number[][]> {
  if (input.length === 0) {
    return [];
  }

  const payload = (await requestOpenAI("/embeddings", {
    model: OPENAI_EMBEDDING_MODEL,
    input
  })) as OpenAIEmbeddingsResponse;

  const embeddings = payload.data
    ?.slice()
    .sort((left, right) => left.index - right.index)
    .map((item) => item.embedding);

  if (!embeddings || embeddings.length !== input.length) {
    throw new OpenAIServiceError("OpenAI returned an invalid embeddings response.");
  }

  embeddings.forEach((embedding) => {
    if (!Array.isArray(embedding)) {
      throw new OpenAIServiceError("OpenAI returned an invalid embedding.");
    }

    validateEmbedding(embedding);
  });

  return embeddings;
}

export async function createStructuredResponseText(
  input: Array<{ role: "system" | "user"; content: string }>,
  schema: Record<string, unknown>,
  name: string
): Promise<string> {
  const response = await createStructuredResponse(input, schema, name);

  return response.text;
}

export async function createStructuredResponse(
  input: Array<{ role: "system" | "user"; content: string }>,
  schema: Record<string, unknown>,
  name: string
): Promise<OpenAIStructuredResponse> {
  const payload = (await requestOpenAI("/responses", {
    model: OPENAI_EXTRACTION_MODEL,
    input,
    text: {
      format: {
        type: "json_schema",
        name,
        strict: true,
        schema
      }
    },
    max_output_tokens: 2500
  })) as OpenAIResponsesPayload;

  if (payload.error?.message) {
    throw new OpenAIServiceError(payload.error.message);
  }

  return {
    text: extractResponseText(payload),
    tokenUsage: payload.usage ?? null
  };
}

async function requestOpenAI(
  path: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new OpenAIServiceError("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(`${OPENAI_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = (await response.json().catch(() => null)) as
    | OpenAIResponsesPayload
    | null;

  if (!response.ok) {
    throw new OpenAIServiceError(
      payload?.error?.message ?? `OpenAI request failed with ${response.status}.`
    );
  }

  if (!payload) {
    throw new OpenAIServiceError("OpenAI returned an invalid JSON response.");
  }

  return payload;
}

function validateEmbedding(embedding: number[]) {
  if (embedding.length !== OPENAI_EMBEDDING_DIMENSIONS) {
    throw new OpenAIServiceError("OpenAI returned an embedding with the wrong dimensions.");
  }

  if (!embedding.every(Number.isFinite)) {
    throw new OpenAIServiceError("OpenAI returned a non-finite embedding value.");
  }
}

function extractResponseText(payload: OpenAIResponsesPayload): string {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  if (!Array.isArray(payload.output)) {
    throw new OpenAIServiceError("OpenAI returned an invalid structured response.");
  }

  const text = payload.output
    .flatMap((outputItem) => {
      if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
        return [];
      }

      return outputItem.content.flatMap((contentItem) => {
        if (!isRecord(contentItem)) {
          return [];
        }

        if (contentItem.type === "refusal" && typeof contentItem.refusal === "string") {
          throw new OpenAIServiceError(contentItem.refusal);
        }

        return contentItem.type === "output_text" && typeof contentItem.text === "string"
          ? [contentItem.text]
          : [];
      });
    })
    .join("");

  if (!text) {
    throw new OpenAIServiceError("OpenAI returned an empty structured response.");
  }

  return text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
