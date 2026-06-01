CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "action_item_status" AS ENUM ('open', 'in_progress', 'done');
CREATE TYPE "risk_severity" AS ENUM ('low', 'medium', 'high');

CREATE TABLE "chunks" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "tokenCount" INTEGER NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "chunks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decisions" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "rationale" TEXT,
  "date" TIMESTAMP(3),
  "participants" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sourceQuote" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "action_items" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "owner" TEXT,
  "dueDate" TIMESTAMP(3),
  "status" "action_item_status" NOT NULL DEFAULT 'open',
  "sourceQuote" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "open_questions" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "context" TEXT NOT NULL,
  "owner" TEXT,
  "sourceQuote" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "open_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "risks" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" "risk_severity" NOT NULL DEFAULT 'medium',
  "mitigation" TEXT,
  "sourceQuote" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "risks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chunks_documentId_chunkIndex_key" ON "chunks"("documentId", "chunkIndex");
CREATE INDEX "chunks_projectId_idx" ON "chunks"("projectId");
CREATE INDEX "chunks_documentId_idx" ON "chunks"("documentId");

CREATE INDEX "decisions_projectId_idx" ON "decisions"("projectId");
CREATE INDEX "decisions_documentId_idx" ON "decisions"("documentId");

CREATE INDEX "action_items_projectId_idx" ON "action_items"("projectId");
CREATE INDEX "action_items_documentId_idx" ON "action_items"("documentId");

CREATE INDEX "open_questions_projectId_idx" ON "open_questions"("projectId");
CREATE INDEX "open_questions_documentId_idx" ON "open_questions"("documentId");

CREATE INDEX "risks_projectId_idx" ON "risks"("projectId");
CREATE INDEX "risks_documentId_idx" ON "risks"("documentId");

ALTER TABLE "chunks"
  ADD CONSTRAINT "chunks_projectId_fkey"
  FOREIGN KEY ("projectId")
  REFERENCES "projects"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "chunks"
  ADD CONSTRAINT "chunks_documentId_fkey"
  FOREIGN KEY ("documentId")
  REFERENCES "documents"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "decisions"
  ADD CONSTRAINT "decisions_projectId_fkey"
  FOREIGN KEY ("projectId")
  REFERENCES "projects"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "decisions"
  ADD CONSTRAINT "decisions_documentId_fkey"
  FOREIGN KEY ("documentId")
  REFERENCES "documents"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "action_items"
  ADD CONSTRAINT "action_items_projectId_fkey"
  FOREIGN KEY ("projectId")
  REFERENCES "projects"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "action_items"
  ADD CONSTRAINT "action_items_documentId_fkey"
  FOREIGN KEY ("documentId")
  REFERENCES "documents"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "open_questions"
  ADD CONSTRAINT "open_questions_projectId_fkey"
  FOREIGN KEY ("projectId")
  REFERENCES "projects"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "open_questions"
  ADD CONSTRAINT "open_questions_documentId_fkey"
  FOREIGN KEY ("documentId")
  REFERENCES "documents"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "risks"
  ADD CONSTRAINT "risks_projectId_fkey"
  FOREIGN KEY ("projectId")
  REFERENCES "projects"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "risks"
  ADD CONSTRAINT "risks_documentId_fkey"
  FOREIGN KEY ("documentId")
  REFERENCES "documents"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
