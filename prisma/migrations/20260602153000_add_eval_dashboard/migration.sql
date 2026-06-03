CREATE TABLE "eval_cases" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "expectedSources" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "expectedFacts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "eval_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "eval_runs" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "evalCaseId" TEXT NOT NULL,
  "answerJson" JSONB NOT NULL,
  "retrievedSources" JSONB NOT NULL,
  "sourceMatch" BOOLEAN NOT NULL,
  "groundednessScore" INTEGER NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "tokenUsage" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "eval_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "eval_cases_projectId_createdAt_idx" ON "eval_cases"("projectId", "createdAt");
CREATE INDEX "eval_runs_projectId_createdAt_idx" ON "eval_runs"("projectId", "createdAt");
CREATE INDEX "eval_runs_evalCaseId_createdAt_idx" ON "eval_runs"("evalCaseId", "createdAt");

ALTER TABLE "eval_cases"
  ADD CONSTRAINT "eval_cases_projectId_fkey"
  FOREIGN KEY ("projectId")
  REFERENCES "projects"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "eval_runs"
  ADD CONSTRAINT "eval_runs_projectId_fkey"
  FOREIGN KEY ("projectId")
  REFERENCES "projects"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "eval_runs"
  ADD CONSTRAINT "eval_runs_evalCaseId_fkey"
  FOREIGN KEY ("evalCaseId")
  REFERENCES "eval_cases"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
