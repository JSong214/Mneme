export function toPgVector(embedding: number[]): string {
  return `[${embedding.map((value) => value.toFixed(8)).join(",")}]`;
}
