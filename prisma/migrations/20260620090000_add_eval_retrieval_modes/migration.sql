CREATE TYPE "retrieval_mode" AS ENUM ('baseline', 'rerank');

ALTER TABLE "eval_runs"
  ADD COLUMN "retrievalMode" "retrieval_mode" NOT NULL DEFAULT 'baseline',
  ADD COLUMN "retrievalMetrics" JSONB;
