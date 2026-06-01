export type TextChunk = {
  content: string;
  chunkIndex: number;
  tokenCount: number;
};

const MAX_CHUNK_CHARACTERS = 3_200;
const CHUNK_OVERLAP_CHARACTERS = 320;

export function splitTextIntoChunks(rawText: string): TextChunk[] {
  const normalizedText = rawText.replace(/\r\n/g, "\n").trim();

  if (!normalizedText) {
    return [];
  }

  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of splitParagraphs(normalizedText)) {
    if (paragraph.length > MAX_CHUNK_CHARACTERS) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
      }

      chunks.push(...splitLongParagraph(paragraph));
      continue;
    }

    const nextChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;

    if (nextChunk.length <= MAX_CHUNK_CHARACTERS) {
      currentChunk = nextChunk;
      continue;
    }

    chunks.push(currentChunk);
    currentChunk = withOverlap(currentChunk, paragraph);
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.map((content, chunkIndex) => ({
    content,
    chunkIndex,
    tokenCount: estimateTokenCount(content)
  }));
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function splitLongParagraph(paragraph: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < paragraph.length) {
    const end = Math.min(start + MAX_CHUNK_CHARACTERS, paragraph.length);
    chunks.push(paragraph.slice(start, end).trim());

    if (end === paragraph.length) {
      break;
    }

    start = Math.max(end - CHUNK_OVERLAP_CHARACTERS, start + 1);
  }

  return chunks.filter(Boolean);
}

function withOverlap(previousChunk: string, paragraph: string): string {
  const overlap = previousChunk.slice(-CHUNK_OVERLAP_CHARACTERS).trim();

  return overlap ? `${overlap}\n\n${paragraph}` : paragraph;
}

function estimateTokenCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
