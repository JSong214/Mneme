CREATE TABLE "ask_runs" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answerJson" JSONB NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "tokenUsage" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ask_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ask_runs_projectId_createdAt_idx" ON "ask_runs"("projectId", "createdAt");

ALTER TABLE "ask_runs"
  ADD CONSTRAINT "ask_runs_projectId_fkey"
  FOREIGN KEY ("projectId")
  REFERENCES "projects"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
